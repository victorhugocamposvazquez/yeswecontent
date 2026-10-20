import "server-only";
import { hasClaude } from "@/lib/env";
import type { AiCheck, AiModel } from "@/lib/types";
import { askClaude } from "./claude";
import { visibilityPrompt } from "./prompts";

export const MODELS: AiModel[] = ["chatgpt", "claude", "gemini", "perplexity"];

export interface VisibilityResult {
  model: AiModel;
  mentioned: boolean;
  position: number | null;
  cited_urls: string[];
  competitors_mentioned: string[];
  answer_excerpt: string | null;
  stubbed: boolean;
}

export interface Brand {
  name: string;
  domain: string;
  competitors: { name: string; domain?: string }[];
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Detecta si la respuesta menciona la marca y en qué posición respecto a los competidores. */
export function detectMention(answer: string, brand: Brand): Omit<VisibilityResult, "model" | "stubbed"> {
  const text = norm(answer);
  const indexOf = (name: string, domain?: string) => {
    const idx = [name, domain, domain?.split(".")[0]]
      .filter((x): x is string => !!x && x.length > 2)
      .map((x) => text.indexOf(norm(x)))
      .filter((i) => i >= 0);
    return idx.length ? Math.min(...idx) : -1;
  };
  const brandIdx = indexOf(brand.name, brand.domain);
  const comps = brand.competitors.map((c) => ({ c, idx: indexOf(c.name, c.domain) })).filter((x) => x.idx >= 0);
  const mentioned = brandIdx >= 0;
  const position = mentioned ? comps.filter((x) => x.idx < brandIdx).length + 1 : null;
  const urls = [...answer.matchAll(/https?:\/\/[^\s)\]"'>]+/g)].map((m) => m[0]);
  const anchor = mentioned ? brandIdx : comps[0]?.idx ?? 0;
  const excerpt = answer.slice(Math.max(0, anchor - 120), anchor + 220).replace(/\s+/g, " ").trim();
  return {
    mentioned,
    position,
    cited_urls: urls.slice(0, 10),
    competitors_mentioned: comps.map((x) => x.c.domain ?? x.c.name),
    answer_excerpt: excerpt ? `…${excerpt}…` : null,
  };
}

async function openAiCompatible(url: string, key: string, model: string, prompt: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }] }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content ?? "";
}

async function askModel(model: AiModel, prompt: string): Promise<string | null> {
  const p = visibilityPrompt(prompt);
  switch (model) {
    case "claude":
      return hasClaude ? askClaude({ prompt: p, maxTokens: 1500 }) : null;
    case "chatgpt":
      // TODO: revisar el modelo por defecto cuando cambie la gama de OpenAI.
      return process.env.OPENAI_API_KEY
        ? openAiCompatible("https://api.openai.com/v1/chat/completions", process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL ?? "gpt-4o-mini", p)
        : null;
    case "perplexity":
      // TODO: Perplexity devuelve también `citations`; guardarlas en cited_urls.
      return process.env.PERPLEXITY_API_KEY
        ? openAiCompatible("https://api.perplexity.ai/chat/completions", process.env.PERPLEXITY_API_KEY, process.env.PERPLEXITY_MODEL ?? "sonar", p)
        : null;
    case "gemini": {
      const key = process.env.GEMINI_API_KEY;
      if (!key) return null;
      // TODO: activar grounding con Google Search para respuestas más parecidas a las de la app.
      const m = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ contents: [{ parts: [{ text: p }] }] }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) throw new Error(`gemini → ${res.status}`);
      const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      return json.candidates?.[0]?.content?.parts?.map((x) => x.text ?? "").join("") ?? "";
    }
  }
}

/** Respuesta simulada y determinista para modelos sin clave configurada. */
function stub(model: AiModel, prompt: string, brand: Brand): VisibilityResult {
  const seed = [...(prompt + model)].reduce((a, c) => a + c.charCodeAt(0), 0);
  const mentioned = seed % 3 !== 0;
  const comps = brand.competitors.slice(0, (seed % 2) + 1);
  return {
    model,
    mentioned,
    position: mentioned ? (seed % 3) + 1 : null,
    cited_urls: mentioned ? [`https://${brand.domain}`] : [],
    competitors_mentioned: comps.map((c) => c.domain ?? c.name),
    answer_excerpt: mentioned
      ? `…entre las opciones que suelen recomendarse está ${brand.name}, que destaca por su especialización…`
      : `…algunas opciones conocidas son ${comps.map((c) => c.name).join(" y ") || "otras marcas del sector"}…`,
    stubbed: true,
  };
}

export async function runVisibilityCheck(prompt: string, brand: Brand, models: AiModel[] = MODELS): Promise<VisibilityResult[]> {
  return Promise.all(
    models.map(async (model) => {
      try {
        const answer = await askModel(model, prompt);
        if (answer == null) return stub(model, prompt, brand);
        return { model, ...detectMention(answer, brand), stubbed: false };
      } catch {
        return stub(model, prompt, brand);
      }
    }),
  );
}

/* ───────── Agregados para la vista ───────── */

export const MODEL_LABEL: Record<AiModel, string> = { chatgpt: "ChatGPT", claude: "Claude", gemini: "Gemini", perplexity: "Perplexity" };

export function latestByPromptModel(checks: AiCheck[]) {
  const map = new Map<string, AiCheck>();
  for (const c of [...checks].sort((a, b) => b.checked_at.localeCompare(a.checked_at))) {
    const key = `${c.prompt_id}:${c.model}`;
    if (!map.has(key)) map.set(key, c);
  }
  return map;
}

export function shareByModel(checks: AiCheck[]) {
  const latest = [...latestByPromptModel(checks).values()];
  return MODELS.map((m) => {
    const rows = latest.filter((c) => c.model === m);
    const hits = rows.filter((c) => c.mentioned).length;
    return { model: m, label: MODEL_LABEL[m], share: rows.length ? Math.round((hits / rows.length) * 100) : 0, total: rows.length, hits };
  });
}

export function overallShare(checks: AiCheck[]) {
  const latest = [...latestByPromptModel(checks).values()];
  return latest.length ? Math.round((latest.filter((c) => c.mentioned).length / latest.length) * 100) : 0;
}

export function competitorCounts(checks: AiCheck[]) {
  const latest = [...latestByPromptModel(checks).values()];
  const counts = new Map<string, number>();
  latest.forEach((c) => c.competitors_mentioned.forEach((d) => counts.set(d, (counts.get(d) ?? 0) + 1)));
  return [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}
