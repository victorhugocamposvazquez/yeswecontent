"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CircleAlert, CircleCheck, CircleX, Download, Info, Loader2, Search } from "lucide-react";
import { ScoreRing } from "@/components/charts";
import { Badge, Button, ButtonLink, Card, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { CheckStatus, ToolResult } from "@/lib/marketing/tools";
import { CopyButton } from "./copy-button";

const statusIcon: Record<CheckStatus, { I: typeof CircleCheck; cls: string; label: string }> = {
  pass: { I: CircleCheck, cls: "text-ok", label: "Correcto" },
  warn: { I: CircleAlert, cls: "text-warn", label: "Mejorable" },
  fail: { I: CircleX, cls: "text-bad", label: "Problema" },
  info: { I: Info, cls: "text-ink-3", label: "Información" },
};

const STICKY_TOP = "top-16";
const HEADER_SCROLL_MARGIN = "scroll-mt-[4.25rem]";

function scrollToResult(el: HTMLElement | null) {
  if (!el) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function AuditScopeDetails() {
  return (
    <details className="mt-3 text-sm">
      <summary className="inline-flex min-h-11 cursor-pointer items-center font-medium text-ink-2 transition-colors duration-150 hover:text-ink sm:min-h-0">
        ¿Gratis vs servicio completo?
      </summary>
      <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-line bg-paper-2 p-3.5 sm:grid-cols-2 sm:p-4">
        <div>
          <p className="text-sm font-semibold tracking-tight">Gratis · solo preparación</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">Nota sobre robots, sitemap, etiquetas, schema y señales para IA.</p>
        </div>
        <div className="rounded-lg border border-signal/25 bg-signal-soft/40 p-3">
          <p className="text-sm font-semibold tracking-tight">Con YesWeContent</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">Contenido en tu CMS, backlinks, auditoría completa, social y seguimiento en IA.</p>
        </div>
      </div>
    </details>
  );
}

export function ToolRunner({
  slug,
  cta = "Analizar",
  initialUrl,
  compact = false,
}: {
  slug: string;
  cta?: string;
  initialUrl?: string;
  /** En auditoría: formulario arriba, sin bloque explicativo encima */
  compact?: boolean;
}) {
  const isAudit = slug === "auditoria-ia";
  const [url, setUrl] = useState(initialUrl ?? "");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ToolResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const autorun = useRef(false);
  const showResults = loading || !!error || !!result;
  const pinned = showResults;

  const run = useCallback(
    async (target: string) => {
      setLoading(true);
      setError(null);
      setResult(null);
      scrollToResult(resultRef.current);
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

  useEffect(() => {
    if (result) scrollToResult(scoreRef.current ?? resultRef.current);
  }, [result]);

  return (
    <div id="analizador" className={HEADER_SCROLL_MARGIN}>
      <div
        className={cn(
          "surface z-30 shadow-[var(--shadow-md)]",
          pinned && cn("sticky", STICKY_TOP, "border border-line bg-paper/95 shadow-[var(--shadow-md)] backdrop-blur-md supports-[backdrop-filter]:bg-paper/90"),
        )}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (url.trim()) void run(url.trim());
          }}
          className={cn("p-4", pinned ? "py-3 sm:p-4" : compact ? "sm:p-5" : "sm:p-6")}
        >
          <Label htmlFor={`url-${slug}`} className={cn(pinned && "sr-only")}>
            {isAudit ? "URL de tu web o tienda online" : "URL de tu sitio"}
          </Label>
          {pinned && (
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-3">{loading ? "Analizando ahora" : "Sitio analizado"}</p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden />
              <Input
                id={`url-${slug}`}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                inputMode="url"
                autoComplete="url"
                placeholder={isAudit ? "https://tuweb.com o tutienda.com" : "https://tuweb.com"}
                className="h-11 pl-10"
              />
            </div>
            <Button type="submit" size="lg" disabled={loading} className="h-11 shrink-0">
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {loading ? "Analizando…" : pinned ? "Reanalizar" : cta}
            </Button>
          </div>
          {!pinned && isAudit && compact && <AuditScopeDetails />}
          {!pinned && (
            <details className="mt-3 text-sm">
              <summary className="inline-flex min-h-11 cursor-pointer items-center text-ink-3 transition-colors duration-150 hover:text-ink sm:min-h-0">¿Quieres que te enviemos el informe? (opcional)</summary>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" autoComplete="email" aria-label="Email para recibir el informe" className="mt-2 h-11 max-w-sm" />
              <p className="mt-1 text-xs text-ink-3">Solo lo usaremos para enviarte el resultado y algún consejo. Sin spam.</p>
            </details>
          )}
          {!pinned && isAudit && !compact && <AuditScopeDetails />}
        </form>
      </div>

      {showResults && (
        <div
          ref={resultRef}
          id="resultado"
          aria-live="polite"
          className={cn("surface -mt-px rounded-t-none border border-t-0 border-line bg-paper-2/80 px-4 py-5 sm:px-6 sm:py-6", HEADER_SCROLL_MARGIN)}
        >
          {loading && (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-line-2 bg-card p-5 text-sm text-ink-2">
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-signal" aria-hidden />
              <div>
                <p className="font-semibold text-ink">{isAudit ? "Analizando tu sitio…" : "Analizando…"}</p>
                <p className="mt-0.5">El informe empieza justo debajo. Suele tardar menos de 10 segundos.</p>
              </div>
            </div>
          )}
          {error && (
            <p role="alert" className="rounded-xl border border-bad/30 bg-bad-soft p-5 text-sm font-medium text-bad">
              {error}
            </p>
          )}
          {result && <ResultView result={result} scoreRef={scoreRef} />}
        </div>
      )}
    </div>
  );
}

function ResultView({ result, scoreRef }: { result: ToolResult; scoreRef: React.RefObject<HTMLDivElement | null> }) {
  const isAudit = result.tool === "auditoria-ia";

  return (
    <div className="space-y-5">
      <div ref={scoreRef} className={cn(HEADER_SCROLL_MARGIN, "rounded-2xl border-2 border-signal/30 bg-card p-5 shadow-[var(--shadow-sm)] sm:p-6")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-signal">Resultado del análisis</p>
          {isAudit && (
            <Badge tone="neutral" className="bg-paper-2">
              Solo diagnóstico gratuito
            </Badge>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
          {typeof result.score === "number" && (
            <div className="shrink-0 self-center sm:self-auto">
              <ScoreRing score={result.score} size={112} label="/ 100" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-[11px] text-ink-3">{result.url}</p>
            <p className="text-pretty mt-1 text-xl font-semibold leading-snug tracking-tight sm:text-2xl">{result.summary}</p>
            {typeof result.score === "number" && (
              <Badge tone={result.score >= 85 ? "ok" : result.score >= 65 ? "warn" : "bad"} dot className="mt-3">
                {result.score >= 85 ? "Buena base técnica" : result.score >= 65 ? "Base mejorable" : "Priorizar arreglos técnicos"}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {isAudit && (
        <Card className="flex flex-col gap-4 border-signal/20 bg-lime-soft p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="max-w-xl space-y-2">
            <p className="text-[15px] font-semibold tracking-tight">A partir de aquí empieza YesWeContent</p>
            <p className="text-sm leading-relaxed text-ink-2">
              Este informe no genera artículos ni enlaces: te orienta. En la prueba y en el plan hacemos el trabajo continuo — contenido automatizado, red de backlinks, auditoría en profundidad, social e informes de visibilidad en IA.
            </p>
          </div>
          <ButtonLink href="/registro" variant="ink" className="shrink-0">
            Probar 3 días gratis
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
        </Card>
      )}

      {result.preview?.kind === "serp" && (
        <Card className="p-6">
          <p className="mb-3 text-[13px] font-medium text-ink-3">Vista previa aproximada</p>
          <p className="truncate text-sm text-[#202124]">{prettyUrl(result.preview.url)}</p>
          <p className="mt-1 line-clamp-1 text-xl text-[#1a0dab]">{result.preview.title}</p>
          <p className="mt-1 line-clamp-2 max-w-[600px] text-sm text-[#4d5156]">{result.preview.description}</p>
        </Card>
      )}

      {result.preview?.kind === "card" && (
        <Card className="max-w-lg overflow-hidden">
          {result.preview.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={result.preview.image} alt="" className="aspect-[1.91/1] w-full border-b border-line object-cover" />
          ) : (
            <div className="grid aspect-[1.91/1] w-full place-items-center border-b border-line bg-paper-2 text-sm text-ink-3">Sin imagen</div>
          )}
          <div className="p-4">
            <p className="text-xs text-ink-3">{result.preview.site}</p>
            <p className="mt-1 font-semibold tracking-tight">{result.preview.title}</p>
            <p className="mt-1 line-clamp-2 text-sm text-ink-2">{result.preview.description}</p>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <p className="text-[15px] font-semibold tracking-tight">Detalle de comprobaciones</p>
          <div className="flex gap-1.5">
            {(["pass", "warn", "fail"] as const).map((k) => {
              const n = result.checks.filter((c) => c.status === k).length;
              if (!n) return null;
              return (
                <Badge key={k} tone={k === "pass" ? "ok" : k === "warn" ? "warn" : "bad"} className="tabular px-2">
                  {n} {statusIcon[k].label.toLowerCase()}
                </Badge>
              );
            })}
          </div>
        </div>
        <ul className="divide-y divide-line">
          {result.checks.map((c, i) => {
            const s = statusIcon[c.status];
            return (
              <li key={i} className="flex gap-3 p-4 sm:p-5">
                <s.I className={cn("mt-0.5 h-5 w-5 shrink-0", s.cls)} aria-label={s.label} />
                <div className="min-w-0">
                  <p className="font-semibold tracking-tight">{c.label}</p>
                  <p className="mt-0.5 break-words text-sm leading-relaxed text-ink-2">{c.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {result.table && (
        <div className="scroll-x rounded-2xl border border-line bg-card shadow-[var(--shadow-xs)]">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="px-5 pt-4 text-left text-[13px] font-medium text-ink-3">{result.table.caption}</caption>
            <thead>
              <tr className="border-b border-line bg-paper-2 text-[13px] text-ink-3">
                {result.table.head.map((h) => (
                  <th key={h} className="px-5 py-2.5 font-medium">
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

      {!isAudit && (
        <Card className="flex flex-col items-start gap-4 bg-lime-soft p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl space-y-1">
            <p className="text-[15px] font-semibold tracking-tight">¿Quieres que esto se revise solo cada mes?</p>
            <p className="text-sm leading-relaxed text-ink-2">En YesWeContent lo revisamos en la auditoría del panel y lo atamos al plan de contenidos que publicamos por ti.</p>
          </div>
          <ButtonLink href="/registro" variant="ink" className="shrink-0">
            Probar 3 días gratis
          </ButtonLink>
        </Card>
      )}
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
    <div className="overflow-hidden rounded-2xl border border-line bg-ink text-paper shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper/15 px-4 py-2.5">
        <span className="font-mono text-xs text-lime">{filename}</span>
        <div className="flex gap-2">
          <CopyButton text={content} dark />
          <button type="button" onClick={download} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-paper/25 px-3 text-xs font-semibold transition-colors duration-150 hover:bg-paper/10">
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
