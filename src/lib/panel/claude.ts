import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { estimateClaudeCostUsd, recordAiUsage, type UsageContext } from "@/lib/ai/usage";

export const CLAUDE_MODEL = "claude-sonnet-5-5";

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }));

export async function askClaude({
  system,
  prompt,
  maxTokens = 4000,
  usage,
}: {
  system?: string;
  prompt: string;
  maxTokens?: number;
  usage?: UsageContext;
}): Promise<string> {
  const res = await getClient().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    ...(system ? { system } : {}),
    messages: [{ role: "user", content: prompt }],
  });
  const inputTokens = res.usage?.input_tokens ?? 0;
  const outputTokens = res.usage?.output_tokens ?? 0;
  void recordAiUsage({
    provider: "anthropic",
    model: CLAUDE_MODEL,
    purpose: usage?.purpose ?? "other",
    inputTokens,
    outputTokens,
    costUsd: estimateClaudeCostUsd(inputTokens, outputTokens, CLAUDE_MODEL),
    siteId: usage?.siteId,
    workspaceId: usage?.workspaceId,
    meta: usage?.meta,
  });
  return res.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
}

/** Pide JSON y lo extrae aunque el modelo lo envuelva en texto o en ```json. */
export async function askClaudeJSON<T>(opts: {
  system?: string;
  prompt: string;
  maxTokens?: number;
  usage?: UsageContext;
}): Promise<T> {
  const text = await askClaude(opts);
  return parseJsonLoose<T>(text);
}

export function parseJsonLoose<T>(text: string): T {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  const end = Math.max(candidate.lastIndexOf("}"), candidate.lastIndexOf("]"));
  if (start === -1 || end === -1) throw new Error("La respuesta no contiene JSON");
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}

/** Registra el uso de un mensaje Claude ya obtenido (p. ej. streaming del especialista). */
export function trackClaudeMessageUsage(
  msg: { usage?: { input_tokens?: number; output_tokens?: number }; model?: string },
  usage?: UsageContext,
) {
  const inputTokens = msg.usage?.input_tokens ?? 0;
  const outputTokens = msg.usage?.output_tokens ?? 0;
  const model = msg.model || CLAUDE_MODEL;
  void recordAiUsage({
    provider: "anthropic",
    model,
    purpose: usage?.purpose ?? "specialist",
    inputTokens,
    outputTokens,
    costUsd: estimateClaudeCostUsd(inputTokens, outputTokens, model),
    siteId: usage?.siteId,
    workspaceId: usage?.workspaceId,
    meta: usage?.meta,
  });
}
