"use client";

/**
 * Efectos ligados al scroll de la web pública. Sin dependencias: IntersectionObserver para saber
 * qué está en pantalla y un único rAF por frame mientras lo está. Solo se animan opacity y
 * transform (y el ancho de un clipPath en SVG), así que no hay recálculos de layout.
 * Con prefers-reduced-motion todo aparece en su estado final.
 */
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { cn, num } from "@/lib/utils";
import { EngineLogo } from "./primitives";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Progreso 0–1 de un elemento según cruza la pantalla: 0 cuando su borde superior toca `start`
 * (fracción del alto de la ventana) y 1 cuando su borde inferior llega a `end`.
 */
function useScrollProgress(ref: RefObject<HTMLElement | null>, onProgress: (p: number) => void, { start = 0.9, end = 0.55 } = {}) {
  const cb = useRef(onProgress);
  cb.current = onProgress;

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion()) {
      cb.current(1);
      return;
    }
    let frame = 0;
    let visible = false;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const from = vh * start;
      const to = vh * end - r.height;
      cb.current(clamp((from - r.top) / Math.max(from - to, 1)));
    };
    const onScroll = () => {
      if (visible && !frame) frame = requestAnimationFrame(update);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) onScroll();
    });
    io.observe(el);
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref, start, end]);
}

/** true la primera vez que el elemento entra en pantalla (o enseguida con reduced motion). */
function useInView<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion() || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

/* ───────── Frases que se rellenan al hacer scroll ───────── */

export type StatementPart = string | { text: string; tone?: "accent" | "brand" };

/** "yeswe" + "content!" (o "can") en la itálica del logotipo. */
function Brandish({ text }: { text: string }) {
  const m = text.match(/^yeswe(.+)$/i);
  if (!m) return <>{text}</>;
  return (
    <>
      yeswe<span className="font-logo text-[1.08em] tracking-normal">{m[1]}</span>
    </>
  );
}

/**
 * Titular grande que pasa de gris a tinta palabra a palabra según avanza el scroll.
 * El texto completo está siempre en el DOM (SEO y lectores de pantalla); solo cambia la opacidad.
 */
export function ScrollStatement({ parts, className, as: Tag = "p" }: { parts: StatementPart[]; className?: string; as?: "p" | "h2" }) {
  const ref = useRef<HTMLElement>(null);
  const words: { w: string; tone?: "accent" | "brand" }[] = [];
  for (const part of parts) {
    const { text, tone } = typeof part === "string" ? { text: part, tone: undefined } : part;
    for (const w of text.split(/\s+/).filter(Boolean)) words.push({ w, tone });
  }

  useScrollProgress(ref, (p) => ref.current?.style.setProperty("--p", p.toFixed(4)), { start: 0.88, end: 0.5 });

  return (
    <Tag
      ref={ref as RefObject<HTMLParagraphElement>}
      className={cn("scroll-statement font-display text-[clamp(2rem,5.6vw,4.5rem)] leading-[1.06]", className)}
      style={{ "--n": words.length } as CSSProperties}
    >
      {words.map(({ w, tone }, i) => (
        <Fragment key={i}>
          <span
            className={cn("sx-word", tone === "accent" && "text-signal")}
            style={{ "--i": i } as CSSProperties}
          >
            {/^yeswe/i.test(w) ? <Brandish text={w} /> : w}
          </span>{" "}
        </Fragment>
      ))}
    </Tag>
  );
}

/* ───────── Search Console: antes y después ───────── */

// 52 semanas. Las 20 primeras, sin yeswecontent: plano con ruido. Después, crecimiento compuesto.
const WEEKS = 52;
const START = 20;
const noise = (i: number, s: number) => Math.sin(i * 12.9898 + s) * 43758.5453 - Math.floor(Math.sin(i * 12.9898 + s) * 43758.5453);
const clicks = Array.from({ length: WEEKS }, (_, i) => {
  const base = 70 + noise(i, 1) * 24;
  const g = i < START ? 0 : Math.pow(i - START, 1.75) * 2.2;
  return Math.round(base + g + (i >= START ? noise(i, 3) * 22 : 0));
});
const impressions = Array.from({ length: WEEKS }, (_, i) => {
  const base = 2600 + noise(i, 7) * 600;
  const g = i < START ? 0 : Math.pow(i - START, 1.6) * 75;
  return Math.round(base + g + (i >= START ? noise(i, 9) * 500 : 0));
});

const W = 640;
const H = 220;
const toPts = (data: number[], max: number) => data.map((v, i) => [(i / (data.length - 1)) * W, H * (1 - v / max)] as [number, number]);
const path = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
// Escalas distintas para que las dos líneas no se pisen: impresiones arriba, clics debajo.
const cPts = toPts(clicks, Math.max(...clicks) * 1.3);
const iPts = toPts(impressions, Math.max(...impressions) * 1.04);
const yAt = (pts: [number, number][], x: number) => {
  const f = clamp(x / W) * (pts.length - 1);
  const a = Math.floor(f);
  const b = Math.min(a + 1, pts.length - 1);
  return pts[a][1] + (pts[b][1] - pts[a][1]) * (f - a);
};
const startX = (START / (WEEKS - 1)) * W;
const sum = (a: number[], from: number, to: number) => a.slice(from, to).reduce((s, v) => s + v, 0);
// es-ES no agrupa los números de cuatro cifras; aquí sí, como en Search Console.
const int = (n: number) => new Intl.NumberFormat("es-ES", { useGrouping: "always", maximumFractionDigits: 0 } as Intl.NumberFormatOptions).format(Math.round(n));
const dec = (n: number) => n.toFixed(1).replace(".", ",");

const metrics = [
  { l: "Clics totales", before: sum(clicks, 0, 12), after: sum(clicks, WEEKS - 12, WEEKS), color: "var(--signal)", fmt: int },
  { l: "Impresiones", before: sum(impressions, 0, 12), after: sum(impressions, WEEKS - 12, WEEKS), color: "var(--ink)", fmt: (n: number) => `${dec(n / 1000)}k` },
  { l: "CTR medio", before: 2.6, after: 4.1, color: "var(--ink-3)", fmt: (n: number) => `${dec(n)} %` },
  { l: "Posición media", before: 31.4, after: 8.2, color: "var(--ink-3)", fmt: dec },
];

/**
 * Gráfico tipo Search Console: plano antes de empezar y en subida después. El tramo "con
 * yeswecontent" se dibuja según avanza el scroll y las cifras de arriba suben a la vez.
 */
export function GrowthChart({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const plot = useRef<HTMLDivElement>(null);
  const clip = useRef<SVGRectElement>(null);
  const dotC = useRef<HTMLSpanElement>(null);
  const dotI = useRef<HTMLSpanElement>(null);
  const vals = useRef<(HTMLSpanElement | null)[]>([]);
  const delta = useRef<HTMLSpanElement>(null);

  useScrollProgress(
    ref,
    (p) => {
      const pw = plot.current?.clientWidth ?? 0;
      const ph = plot.current?.clientHeight ?? 0;
      const k = easeOut(p);
      const x = startX + (W - startX) * k;
      clip.current?.setAttribute("width", (x + 1).toFixed(1));
      const place = (el: HTMLSpanElement | null, pts: [number, number][]) => {
        if (!el) return;
        el.style.left = el.style.top = "0";
        el.style.transform = `translate(${((x / W) * pw).toFixed(1)}px, ${((yAt(pts, x) / H) * ph).toFixed(1)}px)`;
      };
      place(dotC.current, cPts);
      place(dotI.current, iPts);
      metrics.forEach((m, i) => {
        const el = vals.current[i];
        if (el) el.textContent = m.fmt(m.before + (m.after - m.before) * k);
      });
      if (delta.current) {
        const o = clamp((p - 0.8) * 5);
        delta.current.style.opacity = String(o);
        delta.current.style.transform = `translateY(${((1 - o) * 8).toFixed(1)}px)`;
      }
    },
    { start: 0.95, end: 0.55 },
  );

  return (
    <div ref={ref} className={cn("window text-left", className)}>
      <div className="window-bar">
        <i />
        <i />
        <i />
        <span className="ml-2 truncate text-[11px] text-ink-3">Rendimiento en búsqueda · tierrafina.es · últimos 12 meses</span>
      </div>
      <div className="grid grid-cols-2 border-b border-line sm:grid-cols-4">
        {metrics.map((m, i) => (
          <div key={m.l} className={cn("min-w-0 border-line px-4 py-3 sm:px-5 sm:py-4", i % 2 === 0 && "border-r", i < 2 && "max-sm:border-b", i === 1 && "sm:border-r")}>
            <p className="flex items-center gap-1.5 truncate text-[11px] font-medium text-ink-3 sm:text-[12px]">
              <span aria-hidden className="h-2 w-2 shrink-0 rounded-sm" style={{ background: m.color }} />
              {m.l}
            </p>
            <p className="mt-1">
              <span ref={(el) => void (vals.current[i] = el)} className="tabular text-xl font-semibold tracking-tight sm:text-2xl">
                {m.fmt(m.after)}
              </span>
            </p>
            <p className="mt-0.5 truncate text-[11px] text-ink-3">antes: {m.fmt(m.before)}</p>
          </div>
        ))}
      </div>
      <div className="px-4 pt-10 pb-3 sm:px-6 sm:pt-12">
        <div ref={plot} className="relative h-[170px] sm:h-[230px]">
          <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" role="img" aria-label="Clics e impresiones planos durante 20 semanas y en crecimiento constante desde que empieza yeswecontent">
            <defs>
              <linearGradient id="gc-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--signal)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--signal)" stopOpacity={0} />
              </linearGradient>
              <clipPath id="gc-clip">
                <rect ref={clip} x="-4" y="-10" width={W + 8} height={H + 20} />
              </clipPath>
            </defs>
            {[0, 0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="var(--line)" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
            ))}
            <line x1="0" x2={W} y1={H} y2={H} stroke="var(--line-2)" vectorEffect="non-scaling-stroke" />
            <rect x={startX} y={0} width={W - startX} height={H} fill="var(--signal-soft)" opacity={0.6} />
            <line x1={startX} x2={startX} y1={0} y2={H} stroke="var(--signal)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
            <g clipPath="url(#gc-clip)">
              <path d={`${path(cPts)} L${W},${H} L0,${H} Z`} fill="url(#gc-fill)" />
              <path d={path(iPts)} fill="none" stroke="var(--ink)" strokeOpacity={0.5} strokeWidth={1.75} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              <path d={path(cPts)} fill="none" stroke="var(--signal)" strokeWidth={2.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </g>
          </svg>
          {/* Puntos y etiquetas en HTML: el SVG se estira y deformaría círculos y textos */}
          <span ref={dotI} aria-hidden className="absolute will-change-transform" style={{ left: "100%", top: `${(iPts[WEEKS - 1][1] / H) * 100}%` }}>
            <span className="absolute -top-[5px] -left-[5px] h-2.5 w-2.5 rounded-full border-2 border-ink/60 bg-card" />
          </span>
          <span ref={dotC} aria-hidden className="absolute will-change-transform" style={{ left: "100%", top: `${(cPts[WEEKS - 1][1] / H) * 100}%` }}>
            <span className="absolute -top-2.5 -left-2.5 h-5 w-5 rounded-full bg-signal/20" />
            <span className="absolute -top-[6px] -left-[6px] h-3 w-3 rounded-full border-2 border-signal bg-card" />
          </span>
          <span className="pointer-events-none absolute -top-8 inline-flex -translate-x-1/2 items-center rounded-full bg-signal px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-white shadow-[var(--shadow-sm)]" style={{ left: `${(startX / W) * 100}%` }}>
            Empieza yeswecontent
          </span>
          <span className="pointer-events-none absolute top-[38%] left-0 hidden max-w-[34%] text-[11px] leading-snug text-ink-3 sm:block">Sin plan de contenidos: publicar cuando se puede</span>
          <span ref={delta} className="pointer-events-none absolute top-[14%] left-[44%] inline-flex items-center gap-1 rounded-lg border border-line bg-card px-2 py-1 text-[11px] font-semibold text-ok shadow-[var(--shadow-sm)] sm:left-[48%] sm:text-[12px]">
            +{Math.round((metrics[0].after / metrics[0].before - 1) * 100)} % clics en 12 semanas
          </span>
        </div>
        <div aria-hidden className="mt-2 flex justify-between text-[11px] text-ink-3">
          {["nov", "ene", "mar", "may", "jul", "sep"].map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────── Ranking que sube en una página de resultados ───────── */

const serp = [
  { site: "ceramicadelsur.com", t: "Vajillas de gres: catálogo y precios" },
  { site: "decohogar.es", t: "Las 10 mejores vajillas de 2026" },
  { site: "mercadoartesano.es", t: "Vajilla artesanal hecha a mano" },
  { site: "foro-cocina.net", t: "¿Gres o porcelana para diario?" },
];

export function RankClimb({ className }: { className?: string }) {
  const [ref, on] = useInView<HTMLDivElement>(0.5);
  return (
    <div ref={ref} className={cn("surface overflow-hidden p-4 sm:p-5", className)} data-on={on || undefined}>
      <div className="flex items-center gap-2 rounded-full border border-line bg-paper-2 px-3 py-2 text-[13px]">
        <EngineLogo name="Google" size={15} alt="" />
        <span className="truncate">vajilla de gres artesanal</span>
      </div>
      <div className="mt-3 grid grid-cols-[1.75rem_1fr] gap-x-2">
        <ol aria-hidden className="tabular text-[12px] font-semibold text-ink-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <li key={n} className="flex h-[52px] items-center">
              #{n}
            </li>
          ))}
        </ol>
        <ul className="relative" aria-label="Tierrafina sube de la posición 5 a la 1">
          {serp.map((r) => (
            <li key={r.site} className="sx-serp-row flex h-[52px] flex-col justify-center border-b border-line">
              <span className="truncate text-[11px] text-ink-3">{r.site}</span>
              <span className="truncate text-[13px] font-medium text-[#1a4fd6]">{r.t}</span>
            </li>
          ))}
          <li className="sx-serp-me absolute inset-x-0 top-[208px] flex h-[52px] items-center gap-2 rounded-xl border border-signal/30 bg-signal-soft px-3 shadow-[var(--shadow-md)]">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] text-ink-2">tierrafina.es</span>
              <span className="block truncate text-[13px] font-semibold text-ink">Cómo elegir una vajilla de gres que dure</span>
            </span>
            <span className="sx-serp-badge shrink-0 rounded-md bg-ok px-1.5 py-0.5 text-[11px] font-semibold text-white">+4</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

/* ───────── Citas en asistentes de IA ───────── */

const engines = [
  { m: "ChatGPT", pos: 2 },
  { m: "Perplexity", pos: 1 },
  { m: "Gemini", pos: 3 },
  { m: "Claude", pos: 2 },
];

function CountUp({ to, run, duration = 1400 }: { to: number; run: boolean; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !run) return;
    if (reducedMotion()) {
      el.textContent = num(to);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = easeOut(clamp((t - t0) / duration));
      el.textContent = num(Math.round(to * k));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, run, duration]);
  return (
    <span ref={ref} className="tabular">
      {num(to)}
    </span>
  );
}

export function AiCitations({ className }: { className?: string }) {
  const [ref, on] = useInView<HTMLDivElement>(0.5);
  return (
    <div ref={ref} className={cn("surface p-4 sm:p-5", className)} data-on={on || undefined}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-ink-3">Citas en asistentes de IA · este mes</p>
          <p className="mt-1 text-[2.5rem] leading-none font-semibold tracking-tight">
            <CountUp to={27} run={on} />
          </p>
        </div>
        <span className="sx-pop mt-1 shrink-0 rounded-full bg-lime px-2 py-0.5 text-[11px] font-semibold">antes: 0</span>
      </div>
      <p className="mt-4 rounded-lg border border-line bg-paper-2 px-3 py-2 text-[12.5px] text-ink-2">«¿Dónde compro una vajilla de gres hecha a mano?»</p>
      <ul className="mt-3 space-y-2">
        {engines.map((e, i) => (
          <li key={e.m} className="flex h-9 items-center gap-2.5 rounded-lg border border-line px-3 text-[13px]" style={{ "--d": `${300 + i * 220}ms` } as CSSProperties}>
            <EngineLogo name={e.m} size={16} alt="" />
            <span className="flex-1 truncate font-medium">{e.m}</span>
            <span className="relative grid h-6 min-w-[7.5rem] justify-items-end">
              <span className="sx-before col-start-1 row-start-1 self-center text-[12px] text-ink-3">No aparece</span>
              <span className="sx-after col-start-1 row-start-1 inline-flex items-center gap-1 self-center rounded-md bg-ok-soft px-2 py-0.5 text-[12px] font-semibold text-ok">Te cita · #{e.pos}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Contenedor que aparece (opacidad + desplazamiento) la primera vez que entra en pantalla. */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const [ref, on] = useInView<HTMLDivElement>(0.2);
  return (
    <div ref={ref} className={cn("sx-reveal", className)} data-on={on || undefined} style={{ "--d": `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}
