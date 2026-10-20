"use client";

import { useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import { Badge, Button, Input } from "@/components/ui";
import { ModelLogo } from "./model-logo";

type Result = { model: string; mentioned: boolean; position: number | null; competitors_mentioned: string[]; answer_excerpt: string | null; stubbed: boolean };
const LABEL: Record<string, string> = { chatgpt: "ChatGPT", claude: "Claude", gemini: "Gemini", perplexity: "Perplexity" };

/** Prueba puntual de una pregunta contra los modelos, sin guardarla. */
export function VisibilityTester() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[] | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/visibility-check", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se ha podido comprobar.");
      setResults(json.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={run} className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="try-prompt" className="sr-only">
          Pregunta para probar
        </label>
        <Input id="try-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ej.: ¿qué tienda online recomiendas para…?" required minLength={3} />
        <Button type="submit" variant="ink" disabled={loading} className="shrink-0">
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />} Probar
        </Button>
      </form>
      <div aria-live="polite">
        {error && <p className="mt-3 rounded-lg bg-bad-soft px-3 py-2 text-[13px] text-bad">{error}</p>}
        {loading && !results && (
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="h-20 animate-pulse rounded-xl border border-line bg-paper-2" />
            ))}
          </ul>
        )}
        {results && (
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {results.map((r) => (
              <li key={r.model} className="rounded-xl border border-line bg-card p-3.5 shadow-[var(--shadow-xs)]">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-[13px] font-semibold">
                    <ModelLogo model={r.model} size={18} /> {LABEL[r.model] ?? r.model}
                  </span>
                  <span className="flex gap-1">
                    {r.stubbed && <Badge className="px-2 py-0 text-[11px]">simulado</Badge>}
                    <Badge tone={r.mentioned ? "ok" : "bad"} dot className="px-2 py-0 text-[11px]">
                      {r.mentioned ? `Te menciona · #${r.position}` : "No te menciona"}
                    </Badge>
                  </span>
                </div>
                {r.answer_excerpt && <p className="mt-2 border-l-2 border-line pl-3 text-xs leading-relaxed text-ink-2">{r.answer_excerpt}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
