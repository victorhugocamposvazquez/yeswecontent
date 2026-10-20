"use client";

import { useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import { Badge, Button, Input } from "@/components/ui";

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
        {error && <p className="mt-3 text-sm text-bad">{error}</p>}
        {results && (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {results.map((r) => (
              <li key={r.model} className="rounded-xl border border-line bg-paper p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{LABEL[r.model] ?? r.model}</span>
                  <span className="flex gap-1">
                    {r.stubbed && <Badge>simulado</Badge>}
                    <Badge tone={r.mentioned ? "ok" : "bad"}>{r.mentioned ? `Te menciona · #${r.position}` : "No te menciona"}</Badge>
                  </span>
                </div>
                {r.answer_excerpt && <p className="mt-2 text-xs italic text-ink-2">{r.answer_excerpt}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
