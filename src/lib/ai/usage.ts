import "server-only";
import { claudeUsd, openaiChatUsd } from "@/lib/ai/pricing";
import { getAiPriceRates } from "@/lib/ai/rates-server";
import { createServiceClient } from "@/lib/supabase/server";
import { isDemo } from "@/lib/env";

export type AiProvider = "anthropic" | "openai" | "gemini" | "perplexity";
export type AiPurpose =
  | "article"
  | "plan"
  | "image"
  | "image_brief"
  | "specialist"
  | "visibility"
  | "links"
  | "analyze"
  | "other";

export type UsageContext = {
  siteId?: string | null;
  workspaceId?: string | null;
  purpose?: AiPurpose;
  meta?: Record<string, unknown>;
};

export function estimateClaudeCostUsd(inputTokens: number, outputTokens: number, model = "") {
  void model;
  return claudeUsd(getAiPriceRates(), inputTokens, outputTokens);
}

export function estimateOpenAiChatCostUsd(inputTokens: number, outputTokens: number) {
  return openaiChatUsd(getAiPriceRates(), inputTokens, outputTokens);
}

export function estimateImageCostUsd() {
  return getAiPriceRates().openaiImageUsd;
}

export function usdToEur(usd: number) {
  return usd * getAiPriceRates().usdEurRate;
}

/**
 * Registra un evento de consumo. Fire-and-forget seguro: no tumba la petición
 * si falla el insert (demo, sin service role, etc.).
 */
export async function recordAiUsage(opts: {
  provider: AiProvider;
  model: string;
  purpose: AiPurpose;
  inputTokens?: number;
  outputTokens?: number;
  costUsd: number;
  siteId?: string | null;
  workspaceId?: string | null;
  meta?: Record<string, unknown>;
}): Promise<void> {
  if (isDemo) return;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const db = createServiceClient();
    const { error } = await db.from("ai_usage_events").insert({
      site_id: opts.siteId ?? null,
      workspace_id: opts.workspaceId ?? null,
      provider: opts.provider,
      model: opts.model,
      purpose: opts.purpose,
      input_tokens: Math.max(0, Math.round(opts.inputTokens ?? 0)),
      output_tokens: Math.max(0, Math.round(opts.outputTokens ?? 0)),
      cost_usd: Math.max(0, opts.costUsd),
      meta: opts.meta ?? {},
    });
    if (error) console.warn("[ai_usage]", error.message);
  } catch (e) {
    console.warn("[ai_usage]", e instanceof Error ? e.message : e);
  }
}
