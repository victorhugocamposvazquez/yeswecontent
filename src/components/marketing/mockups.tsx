/**
 * Miniaturas fieles del producto para la web pública. Marcado real (no imágenes),
 * construidas con los mismos primitivos del panel. Marca de ejemplo ficticia: Tierrafina.
 */
import { BarChart3, CalendarDays, CircleAlert, CircleCheck, CircleX, FileText, Home, Link2, Network, Plus, ScanSearch, Settings, Share2, Sparkles, Send } from "lucide-react";
import type { CSSProperties } from "react";
import { AreaChart, Progress, ScoreRing, Sparkline } from "@/components/charts";
import { Badge, Logo } from "@/components/ui";
import { cn } from "@/lib/utils";
import { EngineLogo, Window } from "./primitives";

const models = ["ChatGPT", "Claude", "Gemini", "Perplexity"];

/* ───────── Panel completo (hero) ───────── */

const nav = [
  { I: Home, l: "Resumen", on: true },
  { I: CalendarDays, l: "Plan" },
  { I: FileText, l: "Artículos" },
  { I: Send, l: "Publicación" },
  { I: Link2, l: "Enlaces" },
  { I: Sparkles, l: "Visibilidad IA" },
  { I: ScanSearch, l: "Auditoría" },
  { I: Share2, l: "Social" },
  { I: Settings, l: "Ajustes" },
];

const kpis = [
  { l: "Clics orgánicos", v: "12.480", d: "+18%", t: [30, 34, 31, 40, 46, 44, 52, 58] },
  { l: "Impresiones", v: "318k", d: "+24%", t: [20, 26, 25, 31, 38, 41, 47, 55] },
  { l: "Menciones en IA", v: "27", d: "+9", t: [4, 6, 5, 9, 12, 14, 19, 27] },
  { l: "Artículos publicados", v: "42", d: "+5 esta semana", t: [10, 14, 19, 23, 28, 33, 37, 42] },
];

const aiRows = [
  { m: "ChatGPT", v: 72, n: "13/18" },
  { m: "Claude", v: 61, n: "11/18" },
  { m: "Gemini", v: 50, n: "9/18" },
  { m: "Perplexity", v: 83, n: "15/18" },
];

const upcoming = [
  { d: "Mar 21", t: "Cómo elegir una vajilla de gres que dure veinte años", s: "Programado", tone: "ok" as const },
  { d: "Jue 23", t: "Esmaltes sin plomo: lo que debes mirar antes de comprar", s: "En revisión", tone: "warn" as const },
  { d: "Lun 27", t: "Regalos de cerámica para una boda: 12 ideas", s: "Borrador", tone: "neutral" as const },
];

export function PanelMockup({ className }: { className?: string }) {
  return (
    <Window title="app.yeswecontent.com/panel" className={cn("text-left", className)}>
      <div className="flex">
        <aside className="hidden w-52 shrink-0 border-r border-line bg-paper-2 p-3 md:block" aria-hidden>
          <div className="px-2 pt-1">
            <Logo className="scale-90 origin-left" />
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-line bg-card px-2.5 py-2 text-xs">
            <span className="grid h-5 w-5 place-items-center rounded bg-signal text-[9px] font-bold text-white">T</span>
            <span className="truncate font-medium">tierrafina.es</span>
          </div>
          <ul className="mt-3 space-y-0.5">
            {nav.map(({ I, l, on }) => (
              <li key={l} className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12.5px]", on ? "bg-card font-semibold text-ink shadow-[var(--shadow-xs)]" : "text-ink-2")}>
                <I className="h-3.5 w-3.5" />
                {l}
              </li>
            ))}
          </ul>
        </aside>

        <div className="min-w-0 flex-1 bg-paper-2 p-3 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[15px] font-semibold tracking-tight">Resumen</p>
              <p className="text-[11px] text-ink-3">Últimos 30 días · tierrafina.es</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-lg border border-line-2 bg-card px-2.5 py-1 text-[11px] font-medium sm:inline-flex">30 días</span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-signal px-2.5 py-1 text-[11px] font-semibold text-white">
                <Plus className="h-3 w-3" /> Nuevo artículo
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.l} className="rounded-xl border border-line bg-card p-3 shadow-[var(--shadow-xs)]">
                <p className="truncate text-[11px] font-medium text-ink-3">{k.l}</p>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <p className="tabular text-xl font-semibold leading-none tracking-tight">{k.v}</p>
                  <Sparkline data={k.t} className="h-5 w-14" />
                </div>
                <Badge tone="ok" className="mt-2 px-1.5 text-[10px] leading-4">
                  {k.d}
                </Badge>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-xl border border-line bg-card shadow-[var(--shadow-xs)]">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <p className="text-[13px] font-semibold">Clics orgánicos</p>
                <span className="inline-flex items-center gap-1 text-[11px] text-ink-3">
                  <BarChart3 className="h-3 w-3" /> Search Console
                </span>
              </div>
              <div className="px-3 pt-3 pb-1">
                <AreaChart id="hero-area" data={[120, 150, 140, 190, 230, 210, 260, 310, 290, 350, 420, 460]} labels={["may", "jun", "jul", "ago", "sep", "oct"]} height={150} className="hidden h-36 sm:block" />
                <AreaChart id="hero-area-m" data={[120, 150, 140, 190, 230, 210, 260, 310, 290, 350, 420, 460]} height={110} className="h-24 sm:hidden" />
              </div>
            </div>
            <div className="rounded-xl border border-line bg-card shadow-[var(--shadow-xs)]">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <p className="text-[13px] font-semibold">Visibilidad en IA</p>
                <Badge tone="signal" className="px-1.5 text-[10px] leading-4">
                  18 preguntas
                </Badge>
              </div>
              <ul className="space-y-2.5 px-4 py-3">
                {aiRows.map((r) => (
                  <li key={r.m} className="grid grid-cols-[auto_5rem_1fr_2.5rem] items-center gap-2 text-[12px]">
                    <EngineLogo name={r.m} size={16} />
                    <span className="truncate font-medium">{r.m}</span>
                    <Progress value={r.v} tone="ink" className="h-1" />
                    <span className="tabular text-right text-ink-3">{r.n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-line bg-card shadow-[var(--shadow-xs)]">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <p className="text-[13px] font-semibold">Próximos artículos</p>
              <span className="text-[11px] text-ink-3">Ver plan</span>
            </div>
            <ul className="divide-y divide-line">
              {upcoming.map((u) => (
                <li key={u.t} className="flex items-center gap-3 px-4 py-2 text-[12px]">
                  <span className="w-12 shrink-0 font-mono text-[10.5px] text-ink-3">{u.d}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{u.t}</span>
                  <Badge tone={u.tone} dot className="max-sm:hidden px-2 text-[10px] leading-4">
                    {u.s}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Window>
  );
}

/* ───────── Calendario del plan de contenidos ───────── */

const clusters = { cuidado: "bg-signal-soft text-signal", compra: "bg-lime-soft text-ink", regalo: "bg-sky-soft text-ink" } as const;
const calendar: Record<number, { t: string; c: keyof typeof clusters }[]> = {
  2: [{ t: "Esmaltes sin plomo", c: "cuidado" }],
  4: [{ t: "Gres vs porcelana", c: "compra" }],
  6: [{ t: "Regalos de boda", c: "regalo" }],
  9: [{ t: "Cuidar el barro", c: "cuidado" }],
  11: [{ t: "Vajilla para 12", c: "compra" }],
  13: [{ t: "Tazas de autor", c: "regalo" }],
  16: [{ t: "Lavavajillas sí/no", c: "cuidado" }],
  18: [{ t: "Precio justo", c: "compra" }],
  20: [{ t: "Amigo invisible", c: "regalo" }],
  23: [{ t: "Quitar manchas", c: "cuidado" }],
  25: [{ t: "Platos a medida", c: "compra" }],
  27: [{ t: "Navidad artesana", c: "regalo" }],
};

export function CalendarMockup({ className }: { className?: string }) {
  const days = ["L", "M", "X", "J", "V", "S", "D"];
  return (
    <Window title="Plan de contenidos · noviembre" className={className}>
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[15px] font-semibold tracking-tight">Noviembre · 20 temas</p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(clusters) as (keyof typeof clusters)[]).map((c) => (
              <span key={c} className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-medium capitalize", clusters[c])}>
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-ink-3">
          {days.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: 28 }).map((_, i) => {
            const d = i + 1;
            const items = calendar[d] ?? [];
            return (
              <div key={d} className={cn("min-h-[3.25rem] rounded-md border border-line p-1 sm:min-h-[3.75rem]", d % 7 === 6 || d % 7 === 0 ? "bg-paper-2" : "bg-card")}>
                <span className="tabular block text-[10px] text-ink-3">{d}</span>
                {items.map((it) => (
                  <span key={it.t} className={cn("mt-0.5 block truncate rounded px-1 py-0.5 text-[9.5px] font-medium sm:text-[10.5px]", clusters[it.c])} title={it.t}>
                    {it.t}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[11px] text-ink-3">
          <span>3 clústeres · 12 publicaciones · 8 actualizaciones</span>
          <Badge tone="ok" dot className="px-2 text-[10px] leading-4">
            Plan aprobado
          </Badge>
        </div>
      </div>
    </Window>
  );
}

/* ───────── Editor con nota de calidad ───────── */

export function EditorMockup({ className, score = 91 }: { className?: string; score?: number }) {
  const checks = [
    ["Legibilidad", 94],
    ["Cobertura del tema", 88],
    ["Estructura", 95],
    ["Señales SEO", 90],
  ] as const;
  return (
    <Window title="Borrador #128 · redactor" right={<Badge tone="ok" dot className="px-2 text-[10px] leading-4">Guardado</Badge>} className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_12rem]">
        <div className="p-4 sm:p-6">
          <p className="font-mono text-[10px] text-ink-3">Blog · Clínica Azahar · 6 min</p>
          <h3 className="mt-2 text-[clamp(1.1rem,2vw,1.4rem)] font-semibold leading-tight tracking-tight">¿Frío o calor para el dolor de espalda? Depende de cuándo empezó</h3>
          <div className="mt-3 rounded-lg border-l-2 border-signal bg-paper-2 px-3 py-2 text-[12px] leading-relaxed">
            <span className="font-semibold text-signal">Respuesta corta. </span>
            Si el dolor apareció hace menos de 48 horas tras un esfuerzo, frío. Si es una molestia que arrastras desde hace semanas, calor.
          </div>
          <p className="mt-3 text-[13px] font-semibold">Por qué el frío funciona en las primeras horas</p>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-2">
            El frío reduce el flujo de sangre y calma la inflamación inicial. Si quieres entender qué pasa en una{" "}
            <span className="font-medium text-ink underline decoration-signal decoration-2 underline-offset-2">contractura lumbar</span>, te lo contamos en detalle.
          </p>
          <div className="mt-3 space-y-1.5" aria-hidden>
            {[100, 92, 76].map((w, i) => (
              <span key={i} className="block h-1.5 rounded-full bg-paper-3" style={{ width: `${w}%` }} />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["FAQ · 3", "Schema FAQPage", "4 enlaces internos", "Imagen con alt"].map((c) => (
              <Badge key={c} className="px-2 text-[10px] leading-4">
                {c}
              </Badge>
            ))}
          </div>
        </div>
        <aside className="border-t border-line bg-paper-2 p-4 sm:border-t-0 sm:border-l">
          <p className="text-[11px] font-medium text-ink-3">Nota de calidad</p>
          <div className="mt-2 flex items-center gap-3 sm:block">
            <ScoreRing score={score} size={84} label="/ 100" />
          </div>
          <dl className="mt-3 space-y-2">
            {checks.map(([k, v]) => (
              <div key={k}>
                <div className="flex justify-between text-[11px]">
                  <dt className="text-ink-2">{k}</dt>
                  <dd className="tabular font-medium">{v}</dd>
                </div>
                <Progress value={v} tone={v >= 90 ? "ok" : "warn"} className="mt-1 h-1" />
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </Window>
  );
}

/* ───────── Matriz de visibilidad en IA ───────── */

const prompts = [
  { q: "mejor tienda de cerámica artesanal online", r: ["#2", "#3", null, "fuente"] },
  { q: "vajilla de gres apta para lavavajillas", r: ["#1", "#2", "#4", "#1"] },
  { q: "regalo hecho a mano para una boda", r: [null, "#5", null, null] },
  { q: "cómo cuidar piezas de barro esmaltado", r: ["fuente", "#1", "#2", "fuente"] },
];

export function AiMatrixMockup({ className }: { className?: string }) {
  return (
    <Window title="Visibilidad en IA · 18 preguntas · hoy" className={className}>
      <div className="scroll-x">
        <table className="w-full min-w-[520px] text-left text-[12px]">
          <caption className="sr-only">Ejemplo de seguimiento de menciones en asistentes de IA</caption>
          <thead>
            <tr className="border-b border-line bg-paper-2 text-[11px] text-ink-3">
              <th className="px-4 py-2.5 font-medium">Pregunta seguida</th>
              {models.map((m) => (
                <th key={m} className="px-2 py-2.5 text-center font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <EngineLogo name={m} size={14} /> {m}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {prompts.map((p, row) => (
              <tr key={p.q} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 font-medium">«{p.q}»</td>
                {p.r.map((r, i) => (
                  <td key={i} className="sx-piece-up px-2 py-2.5 text-center" style={{ "--i": row * 2 + i * 3 } as CSSProperties}>
                    {r === null ? (
                      <span className="inline-flex items-center text-ink-3">
                        <CircleX className="h-3.5 w-3.5" aria-hidden /> <span className="sr-only">No aparece</span>
                      </span>
                    ) : r === "fuente" ? (
                      <Badge tone="lime" className="px-2 text-[10px] leading-4">
                        fuente
                      </Badge>
                    ) : (
                      <Badge tone="ink" className="tabular px-2 text-[10px] leading-4">
                        {r}
                      </Badge>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-paper-2 px-4 py-2 text-[11px] text-ink-3">
        <span>#n = posición en la respuesta · ejemplo con una marca ficticia</span>
        <span className="inline-flex items-center gap-1 text-ok">
          <CircleCheck className="h-3.5 w-3.5" /> +3 menciones esta semana
        </span>
      </div>
    </Window>
  );
}

/* ───────── Auditoría técnica y GEO ───────── */

export function AuditMockup({ className }: { className?: string }) {
  const items: { s: "pass" | "warn" | "fail"; l: string; d: string }[] = [
    { s: "pass", l: "robots.txt y sitemap", d: "Accesibles y coherentes" },
    { s: "pass", l: "Datos estructurados", d: "Article y FAQPage válidos" },
    { s: "warn", l: "Velocidad en móvil", d: "LCP 3,1 s · optimizar imágenes" },
    { s: "fail", l: "llms.txt", d: "No existe · lo generamos" },
    { s: "warn", l: "Títulos duplicados", d: "6 páginas de categoría" },
  ];
  const Icon = { pass: CircleCheck, warn: CircleAlert, fail: CircleX };
  const cls = { pass: "text-ok", warn: "text-warn", fail: "text-bad" };
  return (
    <Window title="Auditoría · tierrafina.es · octubre" className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-[11rem_1fr]">
        <div className="flex items-center gap-4 border-b border-line bg-paper-2 p-4 sm:flex-col sm:items-start sm:border-r sm:border-b-0">
          <ScoreRing score={84} size={92} label="/ 100" />
          <div className="space-y-2 text-[11px] sm:w-full">
            {[
              ["Técnica", 92, "ok"],
              ["Contenido", 80, "warn"],
              ["Preparación IA", 76, "warn"],
            ].map(([k, v, t]) => (
              <div key={k as string}>
                <div className="flex justify-between">
                  <span className="text-ink-2">{k}</span>
                  <span className="tabular font-medium">{v}</span>
                </div>
                <Progress value={v as number} tone={t as "ok" | "warn"} className="mt-1 h-1" />
              </div>
            ))}
          </div>
        </div>
        <ul className="divide-y divide-line">
          {items.map((it) => {
            const I = Icon[it.s];
            return (
              <li key={it.l} className="flex items-center gap-3 px-4 py-2.5 text-[12px]">
                <I className={cn("h-4 w-4 shrink-0", cls[it.s])} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{it.l}</span>
                  <span className="block truncate text-[11px] text-ink-3">{it.d}</span>
                </span>
                {it.s !== "pass" && (
                  <Badge tone="signal" className="max-sm:hidden px-2 text-[10px] leading-4">
                    Arreglar
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </Window>
  );
}

/* ───────── Red de enlaces (grafo SVG) ───────── */

export function NetworkGraphMockup({ className }: { className?: string }) {
  const nodes = [
    { x: 200, y: 150, r: 30, label: "tu web", main: true },
    { x: 72, y: 62, r: 18, label: "cerámica" },
    { x: 330, y: 56, r: 20, label: "decoración" },
    { x: 356, y: 200, r: 16, label: "regalos" },
    { x: 60, y: 236, r: 20, label: "hogar" },
    { x: 212, y: 278, r: 15, label: "artesanía" },
    { x: 150, y: 24, r: 10, label: "" },
    { x: 384, y: 124, r: 9, label: "" },
    { x: 18, y: 150, r: 9, label: "" },
    { x: 310, y: 280, r: 10, label: "" },
  ];
  const edges = [
    [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [2, 3], [4, 5], [1, 4], [3, 5], [6, 1], [6, 2], [7, 2], [7, 3], [8, 1], [8, 4], [9, 3], [9, 5],
  ];
  return (
    <Window title="Red de enlaces · este mes" className={className}>
      <div className="grid-bg bg-paper-2 p-3 sm:p-5">
        <svg viewBox="0 0 400 300" className="h-auto w-full" role="img" aria-label="Diagrama de la red de enlaces entre webs afines">
          {edges.map(([a, b], i) => (
            <line
              key={i}
              className="sx-piece-line"
              style={{ "--i": i } as CSSProperties}
              x1={nodes[a].x}
              y1={nodes[a].y}
              x2={nodes[b].x}
              y2={nodes[b].y}
              stroke={a === 0 ? "var(--signal)" : "var(--line-2)"}
              strokeWidth={a === 0 ? 2 : 1.25}
              strokeDasharray={a === 0 ? undefined : "3 4"}
            />
          ))}
          {nodes.map((n, i) => (
            <g key={i} className="sx-piece" style={{ "--i": i * 1.5 } as CSSProperties}>
              <circle cx={n.x} cy={n.y} r={n.r + 4} fill={n.main ? "var(--signal)" : "var(--ink)"} opacity={n.main ? 0.12 : 0.04} />
              <circle cx={n.x} cy={n.y} r={n.r} fill={n.main ? "var(--signal)" : "var(--card)"} stroke={n.main ? "var(--signal)" : "var(--line-2)"} strokeWidth="1.5" />
              {n.label && (
                <text
                  x={n.x}
                  y={n.main ? n.y + 4 : n.y + n.r + 13}
                  textAnchor="middle"
                  fontSize={n.main ? 12 : 10.5}
                  fontWeight={n.main ? 600 : 500}
                  fill={n.main ? "#fff" : "var(--ink-2)"}
                  fontFamily="var(--font-body), system-ui, sans-serif"
                >
                  {n.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
      <div className="grid grid-cols-3 divide-x divide-line border-t border-line text-center text-[11px]">
        {[
          ["Recibidos", "7"],
          ["Dados", "5"],
          ["Pendientes de revisar", "2"],
        ].map(([k, v]) => (
          <div key={k} className="px-2 py-2.5">
            <p className="tabular text-base font-semibold leading-none">{v}</p>
            <p className="mt-1 truncate text-ink-3">{k}</p>
          </div>
        ))}
      </div>
    </Window>
  );
}

/* ───────── Social: carrusel y agente de Reddit ───────── */

export function SocialMockup({ className }: { className?: string }) {
  const slides = ["¿Gres o porcelana?", "La prueba del lavavajillas", "3 señales de un buen esmalte", "Dónde comprar"];
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr]", className)}>
      <Window title="Carrusel · Instagram y Facebook" className="sm:col-span-2">
        <div className="p-4">
          <div className="flex gap-2 overflow-hidden" aria-hidden>
            {slides.map((s, i) => (
              <div key={s} className={cn("flex aspect-[4/5] w-28 shrink-0 flex-col justify-between rounded-lg border border-line p-2.5 text-[11px] font-semibold leading-tight", i === 0 ? "bg-signal text-white" : i === 3 ? "bg-ink text-paper" : "bg-paper-2 text-ink")}>
                <span className="font-mono text-[9px] opacity-70">{String(i + 1).padStart(2, "0")}/08</span>
                <span>{s}</span>
              </div>
            ))}
            <div className="flex aspect-[4/5] w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-line-2 text-ink-3">…</div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-3">
            <span>8 diapositivas a partir del último artículo</span>
            <Badge tone="ok" dot className="px-2 text-[10px] leading-4">
              Listo para publicar
            </Badge>
          </div>
        </div>
      </Window>
      <Window title="Agente de Reddit · r/Ceramics">
        <div className="p-4 text-[12px]">
          <p className="font-semibold">«¿Qué esmalte es seguro para tazas de uso diario?»</p>
          <p className="mt-2 border-l-2 border-signal pl-2.5 leading-relaxed text-ink-2">Lo importante es que el esmalte esté certificado sin plomo y que la pieza esté vitrificada. Escribimos una guía con las pruebas que hacemos en el taller…</p>
          <div className="mt-3 flex items-center justify-between">
            <EngineLogo name="Reddit" size={16} />
            <Badge tone="warn" className="px-2 text-[10px] leading-4">
              Borrador
            </Badge>
          </div>
        </div>
      </Window>
      <Window title="Agente de Quora">
        <div className="p-4 text-[12px]">
          <p className="font-semibold">«¿Merece la pena la cerámica artesanal frente a la industrial?»</p>
          <p className="mt-2 leading-relaxed text-ink-2">Respuesta lista para revisar, con enlace a tu comparativa.</p>
          <div className="mt-3 flex items-center justify-between">
            <EngineLogo name="Quora" size={16} />
            <Badge tone="ok" className="px-2 text-[10px] leading-4">
              Para revisar
            </Badge>
          </div>
        </div>
      </Window>
    </div>
  );
}

/* ───────── Cola de publicación ───────── */

export function QueueMockup({ className }: { className?: string }) {
  const rows = [
    { t: "Cómo elegir una vajilla de gres", cms: "WordPress", d: "Mar 21 · 09:00", s: "Programado", tone: "ok" as const },
    { t: "Esmaltes sin plomo", cms: "WordPress", d: "Jue 23 · 09:00", s: "En revisión", tone: "warn" as const },
    { t: "Regalos de cerámica para boda", cms: "Shopify", d: "Lun 27 · 10:00", s: "Borrador", tone: "neutral" as const },
    { t: "Cuidar piezas de barro esmaltado", cms: "WordPress", d: "Mié 29 · 09:00", s: "Programado", tone: "ok" as const },
  ];
  return (
    <Window title="Cola de publicación" right={<span className="text-[11px] text-ink-3">Mar · Jue · 09:00</span>} className={className}>
      <ul className="divide-y divide-line">
        {rows.map((r) => (
          <li key={r.t} className="flex items-center gap-3 px-4 py-2.5 text-[12px]">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-paper-2 text-[10px] font-bold text-ink-2">{r.cms[0]}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{r.t}</span>
              <span className="block text-[11px] text-ink-3">
                {r.cms} · {r.d}
              </span>
            </span>
            <Badge tone={r.tone} dot className="px-2 text-[10px] leading-4">
              {r.s}
            </Badge>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-line bg-paper-2 px-4 py-2 text-[11px] text-ink-3">
        <span>Maquetación, imagen de portada y enlaces internos incluidos</span>
        <CircleCheck className="h-3.5 w-3.5 text-ok" aria-hidden />
      </div>
    </Window>
  );
}

/* ───────── Enlazado interno ───────── */

export function InternalLinksMockup({ className }: { className?: string }) {
  const links = [
    { a: "contractura lumbar", to: "/blog/contractura-lumbar", ok: true },
    { a: "pedir cita", to: "/fisioterapia-valencia", ok: true },
    { a: "ejercicios de espalda", to: "/blog/ejercicios-espalda", ok: false },
  ];
  return (
    <Window title="Enlazado interno · artículo #128" className={className}>
      <div className="p-4 text-[12px]">
        <p className="text-[13px] font-semibold tracking-tight">Sugerencias para este artículo</p>
        <ul className="mt-3 space-y-2">
          {links.map((l) => (
            <li key={l.a} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
              <Link2 className="h-3.5 w-3.5 shrink-0 text-signal" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate">
                  «<span className="font-medium underline decoration-signal decoration-2 underline-offset-2">{l.a}</span>»
                </span>
                <span className="block truncate font-mono text-[10px] text-ink-3">{l.to}</span>
              </span>
              <Badge tone={l.ok ? "ok" : "neutral"} className="px-2 text-[10px] leading-4">
                {l.ok ? "Añadido" : "Sugerido"}
              </Badge>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-ink-3">
          <Network className="h-3.5 w-3.5" aria-hidden /> 31 enlaces internos añadidos este mes
        </div>
      </div>
    </Window>
  );
}

/* ───────── Portal de agencia ───────── */

export function AgencyPortalMockup({ className }: { className?: string }) {
  const clients = [
    ["Clínica Azahar", "8 artículos · +3 menciones IA", "ok"],
    ["Rutas Norte", "12 artículos · 3 idiomas", "ok"],
    ["Pedalea", "Pendiente de aprobar plan", "warn"],
    ["LegalClaro", "6 artículos · auditoría 84", "ok"],
  ] as const;
  return (
    <Window title="portal.tuagencia.com" className={className}>
      <div className="flex items-center justify-between border-b border-line bg-ink px-4 py-2.5 text-paper">
        <span className="text-[13px] font-semibold tracking-tight">Tu Agencia</span>
        <span className="h-5 w-5 rounded-full bg-lime" aria-hidden />
      </div>
      <ul className="divide-y divide-line">
        {clients.map(([n, d, s]) => (
          <li key={n} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[12px]">
            <span className="min-w-0">
              <span className="block truncate font-medium">{n}</span>
              <span className="block truncate text-[11px] text-ink-3">{d}</span>
            </span>
            <Badge tone={s === "ok" ? "ok" : "warn"} dot className="px-2 text-[10px] leading-4">
              {s === "ok" ? "Al día" : "Atención"}
            </Badge>
          </li>
        ))}
      </ul>
      <p className="border-t border-line bg-paper-2 px-4 py-2 text-[11px] text-ink-3">Ejemplo ilustrativo · marca blanca</p>
    </Window>
  );
}

/** Mockup por producto para /producto/[slug] y la portada. */
export function ProductMockup({ slug, className }: { slug: string; className?: string }) {
  switch (slug) {
    case "agente-seo":
      return <PanelMockup className={className} />;
    case "redactor-ia":
      return <EditorMockup className={className} />;
    case "plan-de-contenidos":
      return <CalendarMockup className={className} />;
    case "autopublicacion":
    case "shopify":
      return <QueueMockup className={className} />;
    case "enlazado-interno":
      return <InternalLinksMockup className={className} />;
    case "red-de-enlaces":
      return <NetworkGraphMockup className={className} />;
    case "visibilidad-ia":
      return <AiMatrixMockup className={className} />;
    case "auditoria-geo":
      return <AuditMockup className={className} />;
    case "social":
      return <SocialMockup className={className} />;
    default:
      return null;
  }
}
