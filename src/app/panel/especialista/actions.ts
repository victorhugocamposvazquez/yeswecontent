"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSite, getSubscription, getVisibility, listContentItems, listPlans } from "@/lib/data";
import { isDemo } from "@/lib/env";
import { DEMO_NOTE, type ActionState } from "@/lib/panel/action-types";
import { proposalSchema } from "@/lib/panel/specialist";
import type { ChatMessage, Proposal, ProposalStatus } from "@/lib/panel/specialist-types";
import { createClient } from "@/lib/supabase/server";

const ok = (message: string): ActionState => ({ ok: true, message: isDemo ? `${message} ${DEMO_NOTE}` : message, at: Date.now() });
const fail = (message: string): ActionState => ({ ok: false, message, at: Date.now() });
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/** Mensajes de una conversación guardada (con Supabase). */
export async function loadThreadMessages(threadId: string): Promise<ChatMessage[]> {
  if (isDemo) return [];
  const site = await getCurrentSite();
  if (!site) return [];
  const sb = await createClient();
  const { data: thread } = await sb.from("specialist_threads").select("id").eq("id", threadId).eq("site_id", site.id).maybeSingle();
  if (!thread) return [];
  const { data } = await sb.from("specialist_messages").select("id, role, content, tool_proposals, created_at").eq("thread_id", threadId).order("created_at").limit(200);
  return (data ?? []).map((m) => ({
    id: m.id as string,
    role: m.role as ChatMessage["role"],
    content: m.content as string,
    proposals: (Array.isArray(m.tool_proposals) ? m.tool_proposals : []) as Proposal[],
    created_at: m.created_at as string,
  }));
}

export async function deleteThread(threadId: string): Promise<ActionState> {
  if (isDemo) return ok("Conversación eliminada.");
  const site = await getCurrentSite();
  if (!site) return fail("No hay ningún sitio activo.");
  const sb = await createClient();
  const { error } = await sb.from("specialist_threads").delete().eq("id", threadId).eq("site_id", site.id);
  if (error) return fail(error.message);
  revalidatePath("/panel/especialista");
  return ok("Conversación eliminada.");
}

/** Guarda el nuevo estado de una propuesta dentro del mensaje (jsonb). */
async function setProposalStatus(messageId: string | null | undefined, proposalId: string, status: ProposalStatus) {
  if (isDemo || !messageId) return;
  const sb = await createClient();
  const { data } = await sb.from("specialist_messages").select("tool_proposals").eq("id", messageId).maybeSingle();
  if (!data || !Array.isArray(data.tool_proposals)) return;
  const next = (data.tool_proposals as Proposal[]).map((p) => (p.id === proposalId ? { ...p, status } : p));
  await sb.from("specialist_messages").update({ tool_proposals: next }).eq("id", messageId);
}

export async function dismissProposal(messageId: string | null, proposalId: string): Promise<ActionState> {
  await setProposalStatus(messageId, proposalId, "dismissed");
  return { ok: true, message: "Propuesta descartada.", at: Date.now() };
}

/** Aplica una propuesta del especialista tras la confirmación del usuario. */
export async function applyProposal(messageId: string | null, raw: unknown): Promise<ActionState> {
  const parsed = proposalSchema.safeParse(raw);
  if (!parsed.success) return fail("La propuesta no es válida.");
  const p = parsed.data;
  const site = await getCurrentSite();
  if (!site) return fail("No hay ningún sitio activo.");

  if (p.kind === "content_topic") {
    const d = p.data;
    const label = d.kind === "refresh" ? "Actualización añadida al plan" : "Tema añadido al plan";
    if (isDemo) return ok(`${label}: «${d.title}».`);
    const existing = await listContentItems(site.id);
    if (d.kind === "new" && existing.some((c) => norm(c.title) === norm(d.title) && c.status !== "skipped")) return fail("Ese tema ya está en tu plan.");
    const sb = await createClient();
    const { error } = await sb.from("content_items").insert({
      site_id: site.id,
      title: d.title,
      keyword: d.keyword,
      cluster: d.cluster ?? null,
      intent: d.intent ?? null,
      language: site.language,
      scheduled_for: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10),
      status: "planned",
      kind: d.kind,
    });
    if (error) return fail(error.message);
    await setProposalStatus(messageId, p.id, "applied");
    revalidatePath("/panel/plan");
    return ok(`${label}: «${d.title}».`);
  }

  if (p.kind === "tracked_prompt") {
    const d = p.data;
    if (isDemo) return ok(`Pregunta añadida: «${d.prompt}». La revisaremos mañana en los cuatro modelos.`);
    const [{ prompts }, sub, plans] = await Promise.all([getVisibility(site.id), getSubscription(site.id), listPlans()]);
    const limit = plans.find((pl) => pl.id === sub?.plan_id)?.tracked_prompts ?? 10;
    if (prompts.some((x) => norm(x.prompt) === norm(d.prompt))) return fail("Ya sigues esa pregunta.");
    if (prompts.filter((x) => x.active).length >= limit) return fail(`Has llegado al límite de ${limit} preguntas de tu plan. Pausa alguna en Visibilidad IA o amplía el plan.`);
    const sb = await createClient();
    const { error } = await sb.from("ai_prompts").insert({ site_id: site.id, prompt: d.prompt });
    if (error) return fail(error.message);
    await setProposalStatus(messageId, p.id, "applied");
    revalidatePath("/panel/visibilidad-ia");
    return ok(`Pregunta añadida: «${d.prompt}».`);
  }

  const d = p.data;
  if (isDemo) return ok(`Tarea abierta: «${d.title}».`);
  const sb = await createClient();
  const { error } = await sb.from("audit_tasks").insert({
    site_id: site.id,
    check_id: d.check_id,
    title: d.title,
    detail: [d.reason, ...d.steps.map((s, i) => `${i + 1}. ${s}`)].filter(Boolean).join("\n"),
    priority: d.priority,
    source: "specialist",
  });
  if (error) return fail(error.message);
  await setProposalStatus(messageId, p.id, "applied");
  revalidatePath("/panel/auditoria");
  return ok(`Tarea abierta: «${d.title}».`);
}
