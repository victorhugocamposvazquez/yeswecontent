"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CircleAlert, CircleCheck, CircleX, Download, Info, Loader2, Search } from "lucide-react";
import { ScoreRing } from "@/components/charts";
import { cn } from "@/lib/utils";
import type { CheckStatus, ToolResult } from "@/lib/marketing/tools";
import { CopyButton } from "./copy-button";

const statusIcon: Record<CheckStatus, { I: typeof CircleCheck; cls: string; label: string }> = {
  pass: { I: CircleCheck, cls: "text-ok", label: "Correcto" },
  warn: { I: CircleAlert, cls: "text-warn", label: "Mejorable" },
  fail: { I: CircleX, cls: "text-bad", label: "Problema" },
  info: { I: Info, cls: "text-ink-3", label: "Información" },
};

export function ToolRunner({ slug, cta = "Analizar", initialUrl }: { slug: string; cta?: string; initialUrl?: string }) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ToolResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const autorun = useRef(false);

  const run = useCallback(
    async (target: string) => {
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const res = await fetch(`/api/tools/${slug}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: target, email: email || undefined }),
        });
        const data = await res.json().catch(() => ({ error: "Respuesta inesperada del servidor." }));
        if (!res.ok) setError(data.error ?? "No hemos podido analizar esa web.");
        else {
          setResult(data as ToolResult);
          requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
        }
      } catch {
        setError("No hay conexión. Comprueba tu red y vuelve a probar.");
      } finally {
        setLoading(false);
      }
    },
    [slug, email],
  );

  useEffect(() => {
    if (initialUrl && !autorun.current) {
      autorun.current = true;
      void run(initialUrl);
    }
  }, [initialUrl, run]);

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (url.trim()) void run(url.trim());
        }}
        className="rounded-2xl border border-line bg-card p-4 shadow-[0_12px_32px_-16px_rgba(21,19,15,0.22)] sm:p-6"
      >
        <label htmlFor={`url-${slug}`} className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">
          URL de tu web
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden />
            <input
              id={`url-${slug}`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              inputMode="url"
              autoComplete="url"
              placeholder="https://tuweb.com"
              className="w-full rounded-lg border border-line bg-paper py-3 pr-4 pl-10 outline-none focus:ring-4 focus:ring-lime"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-signal px-6 py-3 font-semibold text-signal-ink shadow-sm transition disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {loading ? "Analizando…" : cta}
          </button>
        </div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-ink-3 hover:text-ink">¿Quieres que te enviemos el informe? (opcional)</summary>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
            className="mt-2 w-full max-w-sm rounded-lg border border-line bg-paper px-4 py-2 outline-none focus:ring-4 focus:ring-lime"
          />
          <p className="mt-1 text-xs text-ink-3">Solo lo usaremos para enviarte el resultado y algún consejo. Sin spam.</p>
        </details>
      </form>

      <div ref={resultRef} className="scroll-mt-24" aria-live="polite">
        {loading && (
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-dashed border-line p-6 text-ink-2">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Descargando y revisando la web. Suele tardar menos de 10 segundos.
          </div>
        )}
        {error && (
          <p role="alert" className="mt-8 rounded-2xl border border-bad/40 bg-bad/10 p-5 font-medium text-bad">
            {error}
          </p>
        )}
        {result && <ResultView result={result} />}
      </div>
    </div>
  );
}

function ResultView({ result }: { result: ToolResult }) {
  return (
    <div className="mt-10 space-y-6">
      <div className="flex flex-col gap-5 rounded-2xl border border-line bg-card p-6 sm:flex-row sm:items-center">
        {typeof result.score === "number" && (
          <div className="shrink-0">
            <ScoreRing score={result.score} size={104} />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">{result.url}</p>
          <p className="mt-1 font-display text-3xl leading-tight">{result.summary}</p>
        </div>
      </div>

      {result.preview?.kind === "serp" && (
        <div className="rounded-2xl border border-line bg-white p-6">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">Vista previa aproximada</p>
          <p className="truncate text-sm text-[#202124]">{prettyUrl(result.preview.url)}</p>
          <p className="mt-1 line-clamp-1 text-xl text-[#1a0dab]">{result.preview.title}</p>
          <p className="mt-1 line-clamp-2 max-w-[600px] text-sm text-[#4d5156]">{result.preview.description}</p>
        </div>
      )}

      {result.preview?.kind === "card" && (
        <div className="max-w-lg overflow-hidden rounded-2xl border border-line bg-card">
          {result.preview.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={result.preview.image} alt="" className="aspect-[1.91/1] w-full border-b border-line object-cover" />
          ) : (
            <div className="grid aspect-[1.91/1] w-full place-items-center border-b border-line bg-paper-2 text-sm text-ink-3">Sin imagen</div>
          )}
          <div className="p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">{result.preview.site}</p>
            <p className="mt-1 font-semibold">{result.preview.title}</p>
            <p className="mt-1 line-clamp-2 text-sm text-ink-2">{result.preview.description}</p>
          </div>
        </div>
      )}

      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
        {result.checks.map((c, i) => {
          const s = statusIcon[c.status];
          return (
            <li key={i} className="flex gap-3 p-4 sm:p-5">
              <s.I className={cn("mt-0.5 h-5 w-5 shrink-0", s.cls)} aria-label={s.label} />
              <div className="min-w-0">
                <p className="font-semibold">{c.label}</p>
                <p className="mt-0.5 break-words text-sm text-ink-2">{c.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>

      {result.table && (
        <div className="scroll-x rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="px-5 pt-4 text-left font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">{result.table.caption}</caption>
            <thead>
              <tr className="border-b border-line">
                {result.table.head.map((h) => (
                  <th key={h} className="px-5 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.table.rows.map((r, i) => (
                <tr key={i} className="border-b border-line last:border-0">
                  {r.map((cell, j) => (
                    <td
                      key={j}
                      className={cn(
                        "max-w-[22rem] truncate px-5 py-3",
                        cell === "Bloqueado" || cell === "Error" ? "font-semibold text-bad" : cell === "Parcial" || cell === "Redirige" ? "font-semibold text-warn" : cell === "Permitido" || cell === "OK" ? "font-semibold text-ok" : "",
                      )}
                      title={cell}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.output && <OutputBlock filename={result.output.filename} content={result.output.content} />}

      <div className="flex flex-col items-start gap-4 rounded-2xl border border-line bg-lime p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl font-medium">¿Quieres que esto se revise solo cada mes, y que además arreglemos lo que afecta al contenido?</p>
        <Link href="/registro" className="shrink-0 rounded-lg border border-line bg-ink px-5 py-2.5 font-semibold text-paper hover:bg-ink-2">
          Prueba 3 días gratis
        </Link>
      </div>
    </div>
  );
}

export function OutputBlock({ filename, content }: { filename: string; content: string }) {
  const download = () => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-ink text-paper">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper/20 px-5 py-3">
        <span className="font-mono text-xs text-lime">{filename}</span>
        <div className="flex gap-2">
          <CopyButton text={content} dark />
          <button type="button" onClick={download} className="inline-flex items-center gap-1.5 rounded-full border border-paper/40 px-3 py-1.5 text-xs font-semibold hover:bg-paper/10">
            <Download className="h-3.5 w-3.5" aria-hidden /> Descargar
          </button>
        </div>
      </div>
      <pre className="max-h-[28rem] overflow-auto p-5 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap">{content}</pre>
    </div>
  );
}

function prettyUrl(u: string) {
  try {
    const x = new URL(u);
    return [x.host, ...x.pathname.split("/").filter(Boolean)].join(" › ");
  } catch {
    return u;
  }
}
