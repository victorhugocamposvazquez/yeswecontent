import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSite } from "@/lib/data";
import { hasClaude, isDemo } from "@/lib/env";
import { requireUser } from "@/lib/panel/auth";
import { CLAUDE_MODEL, trackClaudeMessageUsage } from "@/lib/panel/claude";
import { buildSystemPrompt, demoAnswer, getSpecialistContext, specialistTools, toolUseToProposal } from "@/lib/panel/specialist";
import { threadTitle, type Proposal, type StreamEvent } from "@/lib/panel/specialist-types";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const input = z.object({
  threadId: z.string().max(64).nullish(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(12000),
        proposals: z.array(z.object({ kind: z.string(), status: z.string(), data: z.record(z.string(), z.unknown()) })).max(10).optional(),
      }),
    )
    .min(1)
    .max(60),
});

const KIND_NOTE: Record<string, string> = { content_topic: "tema para el plan", tracked_prompt: "pregunta a seguir", audit_fix: "tarea de auditoría" };
const STATUS_NOTE: Record<string, string> = { pending: "pendiente", applied: "aceptada", dismissed: "descartada" };

/**
 * POST { threadId?, messages } → NDJSON en streaming con eventos
 * thread · text · proposal · done · error (ver StreamEvent).
 * Las propuestas nunca se aplican aquí: el usuario las confirma en el panel.
 */
export async function POST(req: Request) {
  const { error } = await requireUser();
  if (error) return error;
  const parsed = input.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });
  const { messages } = parsed.data;
  const last = messages[messages.length - 1];
  if (last.role !== "user" || !last.content.trim()) return NextResponse.json({ error: "Falta tu pregunta." }, { status: 400 });

  const site = await getCurrentSite();
  if (!site) return NextResponse.json({ error: "No hay ningún sitio activo." }, { status: 404 });

  // Persistencia (solo con Supabase): hilo + mensaje del usuario antes de responder.
  let threadId = parsed.data.threadId ?? null;
  let newThread: { id: string; title: string } | null = null;
  const sb = isDemo ? null : await createClient();
  if (sb) {
    if (threadId) {
      const { data } = await sb.from("specialist_threads").select("id").eq("id", threadId).eq("site_id", site.id).maybeSingle();
      if (!data) threadId = null;
    }
    if (!threadId) {
      const title = threadTitle(messages.find((m) => m.role === "user")?.content ?? last.content);
      const { data, error: e } = await sb.from("specialist_threads").insert({ site_id: site.id, title }).select("id, title").single();
      if (e || !data) return NextResponse.json({ error: e?.message ?? "No se pudo crear la conversación." }, { status: 500 });
      threadId = data.id as string;
      newThread = { id: data.id as string, title: data.title as string };
    }
    await sb.from("specialist_messages").insert({ thread_id: threadId, role: "user", content: last.content });
  }

  const ctx = await getSpecialistContext(site);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (ev: StreamEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(ev)}\n`));
      let text = "";
      const proposals: Proposal[] = [];
      const onText = (v: string) => {
        text += v;
        send({ t: "text", v });
      };
      const onProposal = (p: Proposal) => {
        proposals.push(p);
        send({ t: "proposal", p });
      };

      try {
        if (newThread) send({ t: "thread", ...newThread });

        if (!hasClaude) {
          await streamDemo(ctx, last.content, onText, onProposal, req.signal);
        } else {
          await streamClaude(ctx, messages, onText, onProposal, req.signal);
        }

        let messageId: string = crypto.randomUUID();
        if (sb && threadId) {
          const { data } = await sb
            .from("specialist_messages")
            .insert({ thread_id: threadId, role: "assistant", content: text, tool_proposals: proposals })
            .select("id")
            .single();
          if (data) messageId = data.id as string;
        }
        send({ t: "done", messageId });
      } catch (e) {
        if (!req.signal.aborted) {
          console.error("[especialista]", e);
          send({ t: "error", message: "No he podido terminar la respuesta. Vuelve a intentarlo en unos segundos." });
        }
      } finally {
        try {
          controller.close();
        } catch {
          // ya cerrado (el cliente canceló)
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-cache, no-transform", "x-accel-buffering": "no" },
  });
}

/* ───────── Claude con herramientas ───────── */

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }));

type InMsg = z.infer<typeof input>["messages"][number];

function toApiMessages(messages: InMsg[]): Anthropic.MessageParam[] {
  const recent = messages.slice(-20);
  while (recent.length && recent[0].role !== "user") recent.shift();
  const out: Anthropic.MessageParam[] = [];
  for (const m of recent) {
    let content = m.content.trim() || "…";
    if (m.role === "assistant" && m.proposals?.length) {
      const notes = m.proposals.map((p) => {
        const d = p.data as Record<string, unknown>;
        const label = (d.title ?? d.prompt ?? "") as string;
        return `${KIND_NOTE[p.kind] ?? p.kind} «${label}» (${STATUS_NOTE[p.status] ?? p.status})`;
      });
      content += `\n\n[Propuestas de esta respuesta: ${notes.join("; ")}]`;
    }
    // Une turnos consecutivos del mismo rol (p. ej. tras una respuesta fallida).
    const prev = out[out.length - 1];
    if (prev && prev.role === m.role) prev.content = `${prev.content as string}\n\n${content}`;
    else out.push({ role: m.role, content });
  }
  return out;
}

async function streamClaude(
  ctx: Awaited<ReturnType<typeof getSpecialistContext>>,
  messages: InMsg[],
  onText: (v: string) => void,
  onProposal: (p: Proposal) => void,
  signal: AbortSignal,
) {
  const system: Anthropic.TextBlockParam[] = [{ type: "text", text: buildSystemPrompt(ctx), cache_control: { type: "ephemeral" } }];
  const tools = specialistTools(ctx);
  const convo = toApiMessages(messages);

  // Bucle de herramientas: el modelo propone, devolvemos "pendiente de confirmar" y sigue escribiendo.
  for (let turn = 0; turn < 4; turn++) {
    const s = getClient().messages.stream({ model: CLAUDE_MODEL, max_tokens: 2000, system, tools, messages: convo }, { signal });
    s.on("text", onText);
    const msg = await s.finalMessage();
    trackClaudeMessageUsage(msg, { siteId: ctx.site.id, workspaceId: ctx.site.workspace_id, purpose: "specialist" });
    const toolUses = msg.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (msg.stop_reason !== "tool_use" || !toolUses.length) return;

    const results: Anthropic.ToolResultBlockParam[] = toolUses.map((tu) => {
      const p = toolUseToProposal(tu.name, tu.input);
      if (p) onProposal(p);
      return {
        type: "tool_result",
        tool_use_id: tu.id,
        content: p ? "Propuesta mostrada al usuario. Queda pendiente de que la confirme; no está aplicada." : "La propuesta no era válida y no se ha mostrado.",
        ...(p ? {} : { is_error: true }),
      };
    });
    convo.push({ role: "assistant", content: msg.content }, { role: "user", content: results });
  }
}

/* ───────── respuesta de ejemplo sin clave ───────── */

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function streamDemo(
  ctx: Awaited<ReturnType<typeof getSpecialistContext>>,
  question: string,
  onText: (v: string) => void,
  onProposal: (p: Proposal) => void,
  signal: AbortSignal,
) {
  const { text, proposals } = demoAnswer(ctx, question);
  await wait(350);
  const chunks = text.match(/\S+\s*|\s+/g) ?? [text];
  for (let i = 0; i < chunks.length; i += 3) {
    if (signal.aborted) return;
    onText(chunks.slice(i, i + 3).join(""));
    await wait(18);
  }
  for (const p of proposals) {
    await wait(120);
    onProposal(p);
  }
}
