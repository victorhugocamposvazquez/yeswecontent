"use client";

/**
 * Efectos ligados al scroll de la web pública. Sin dependencias: IntersectionObserver para saber
 * qué está en pantalla y un único rAF por frame mientras lo está. Solo se animan opacity y
 * transform (y el ancho de un clipPath en SVG), así que no hay recálculos de layout.
 * Con prefers-reduced-motion todo aparece en su estado final.
 */
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { Check, Globe, PenLine, Send, Sparkles, TrendingUp } from "lucide-react";
import { cn, num } from "@/lib/utils";
import { EngineLogo } from "./primitives";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Measure = (r: DOMRect, vh: number) => number;

/**
 * Progreso 0–1 de un elemento según cruza la pantalla: 0 cuando su borde superior toca `start`
 * (fracción del alto de la ventana) y 1 cuando su borde inferior llega a `end`. `measure` permite
 * otra cuenta (p. ej. secciones fijas). El valor no salta con cada evento de scroll: se acerca al
 * real con una interpolación por frame, así la rueda del ratón o el trackpad se sienten suaves.
 */
function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  onProgress: (p: number) => void,
  { start = 0.9, end = 0.55, measure, smooth: smoothIn = 0.14, track = false }: { start?: number; end?: number; measure?: Measure; smooth?: number; track?: boolean } = {},
) {
  const cb = useRef(onProgress);
  cb.current = onProgress;
  const m = useRef(measure);
  m.current = measure;

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Con reduced motion solo se siguen (sin interpolar) las secciones que dependen del scroll para
    // enseñar su contenido, como los pasos fijos; el resto se queda en su estado final.
    const reduced = reducedMotion();
    if (reduced && !track) {
      cb.current(1);
      return;
    }
    const smooth = reduced ? 1 : smoothIn;
    const target = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (m.current) return clamp(m.current(r, vh));
      const from = vh * start;
      const to = vh * end - r.height;
      return clamp((from - r.top) / Math.max(from - to, 1));
    };
    let frame = 0;
    let visible = false;
    let cur = target();
    let goal = cur;
    const tick = () => {
      frame = 0;
      goal = target();
      const d = goal - cur;
      cur = Math.abs(d) < 0.0005 ? goal : cur + d * smooth;
      cb.current(cur);
      if (cur !== goal) frame = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (visible && !frame) frame = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) wake();
    });
    io.observe(el);
    cb.current(cur);
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
    };
  }, [ref, start, end, smoothIn, track]);
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

  useScrollProgress(ref, (p) => ref.current?.style.setProperty("--p", p.toFixed(4)), { start: 0.9, end: 0.45 });

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
    { start: 0.95, end: 0.4 },
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

function CountUp({ to, run, duration = 2000 }: { to: number; run: boolean; duration?: number }) {
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
          <li key={e.m} className="flex h-9 items-center gap-2.5 rounded-lg border border-line px-3 text-[13px]" style={{ "--d": `${400 + i * 280}ms` } as CSSProperties}>
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

/** Escalonado: los hijos directos (con --i) aparecen uno tras otro al entrar en pantalla. */
export function Stagger({ children, className, as: Tag = "div", label }: { children: ReactNode; className?: string; as?: "div" | "ul" | "ol"; label?: string }) {
  const [ref, on] = useInView<HTMLElement>(0.25);
  return (
    <Tag ref={ref as RefObject<HTMLDivElement & HTMLUListElement & HTMLOListElement>} className={cn("sx-stagger", className)} data-on={on || undefined} aria-label={label}>
      {children}
    </Tag>
  );
}

/** Desplazamiento vertical suave mientras el elemento cruza la pantalla (paralaje ligero). */
export function Parallax({ children, className, amount = 48 }: { children: ReactNode; className?: string; amount?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollProgress(
    ref,
    (p) => {
      if (ref.current) ref.current.style.transform = `translate3d(0, ${((0.5 - p) * amount).toFixed(2)}px, 0)`;
    },
    { measure: (r, vh) => (vh - r.top) / (vh + r.height), smooth: 0.1 },
  );
  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}

/** Captura del panel que llega inclinada y se endereza al empezar a bajar (hero). */
export function TiltIn({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  useScrollProgress(
    ref,
    (p) => {
      const k = easeOut(p);
      if (inner.current) inner.current.style.transform = `rotateX(${((1 - k) * 16).toFixed(2)}deg) scale(${(0.93 + 0.07 * k).toFixed(4)}) translateZ(0)`;
    },
    { measure: (r, vh) => (vh * 0.95 - r.top) / (vh * 0.55), smooth: 0.1 },
  );
  return (
    <div ref={ref} className={cn("[perspective:1400px]", className)}>
      <div ref={inner} className="origin-[50%_0%] will-change-transform">
        {children}
      </div>
    </div>
  );
}

/* ───────── Cómo funciona: pasos fijos que avanzan con el scroll ───────── */

export type Step = { n: string; title: string; text: string };

const HEADER = 64;

/** Opacidad de un elemento que aparece cuando el progreso local del panel (--sp) llega a k/total. */
const at = (k: number, total: number) => ({ "--k": k, "--t": total }) as CSSProperties;

function PanelRead() {
  const facts = [
    ["Vendes", "Vajillas y cerámica de gres hechas a mano"],
    ["Tu tono", "Cercano, de taller, sin tecnicismos"],
    ["Compites con", "3 tiendas y 2 marketplaces"],
    ["Temas que puedes ganar", "Cuidado · Compra · Regalo"],
  ];
  return (
    <div className="flex h-full flex-col p-4 sm:p-6">
      <p className="text-[12px] font-medium text-ink-3">Tu web</p>
      <div className="mt-1.5 flex h-11 items-center gap-2 rounded-xl border border-line-2 bg-card px-3 text-[14px] shadow-[var(--shadow-xs)]">
        <Globe className="h-4 w-4 shrink-0 text-ink-3" aria-hidden />
        <span className="relative">
          https://tierrafina.es
          <span aria-hidden className="sx-type absolute inset-y-0 -right-0.5 left-0 origin-right bg-card" />
        </span>
        <span className="sx-at ml-auto rounded-md bg-signal px-2 py-1 text-[11px] font-semibold text-white" style={at(1, 6)}>
          Analizando…
        </span>
      </div>
      <ul className="mt-4 grid flex-1 content-start gap-2">
        {facts.map(([k, v], i) => (
          <li key={k} className="sx-at flex items-center gap-3 rounded-xl border border-line bg-paper-2 px-3 py-2.5" style={at(i + 2, 6)}>
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ok-soft text-ok">
              <Check className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] text-ink-3">{k}</span>
              <span className="block truncate text-[13px] font-medium">{v}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PanelPlan() {
  const topics = [
    { t: "Cómo elegir una vajilla de gres", v: "2,4k", d: "Baja", c: "bg-lime-soft" },
    { t: "Gres o porcelana: diferencias", v: "1,9k", d: "Media", c: "bg-sky-soft" },
    { t: "Regalos de cerámica para bodas", v: "880", d: "Baja", c: "bg-signal-soft" },
    { t: "¿El gres va al lavavajillas?", v: "1,3k", d: "Baja", c: "bg-lime-soft" },
    { t: "Esmaltes sin plomo: qué mirar", v: "720", d: "Media", c: "bg-sky-soft" },
  ];
  return (
    <div className="flex h-full flex-col p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold">Plan de noviembre · 12 artículos</p>
        <span className="text-[11px] text-ink-3">búsquedas/mes · dificultad</span>
      </div>
      <ul className="mt-3 grid flex-1 content-start gap-1.5">
        {topics.map((x, i) => (
          <li key={x.t} className="sx-at flex items-center gap-3 rounded-lg border border-line bg-card px-3 py-2 text-[12.5px] shadow-[var(--shadow-xs)]" style={at(i + 1, 7)}>
            <span className={cn("h-6 w-1.5 shrink-0 rounded-full", x.c)} />
            <span className="min-w-0 flex-1 truncate font-medium">{x.t}</span>
            <span className="tabular shrink-0 text-ink-2">{x.v}</span>
            <span className="hidden w-12 shrink-0 text-right text-ink-3 sm:block">{x.d}</span>
            <span className="sx-check grid h-5 w-5 shrink-0 place-items-center rounded-full border border-line-2 text-white" style={at(i + 1.5, 7)}>
              <Check className="h-3 w-3" aria-hidden />
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[11px] text-ink-3">Quita, añade o cambia el orden</span>
        <span className="sx-at rounded-lg bg-ink px-3 py-1.5 text-[12px] font-semibold text-paper" style={at(6.5, 7)}>
          Plan aprobado ✓
        </span>
      </div>
    </div>
  );
}

function PanelGrow() {
  const timeline = [
    { I: PenLine, t: "Artículo escrito con tu voz", s: "Nota de calidad 91/100" },
    { I: Send, t: "Publicado en tu WordPress", s: "Jueves 9:00 · con FAQ y schema" },
    { I: TrendingUp, t: "Entra en el top 3 de Google", s: "«vajilla de gres» · #3" },
    { I: Sparkles, t: "Perplexity te cita como fuente", s: "«¿Dónde comprar gres artesanal?»" },
  ];
  return (
    <div className="flex h-full flex-col p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold">Esta semana en tierrafina.es</p>
        <span className="tabular text-[11px] text-ink-3">
          clics <span className="sx-at font-semibold text-ok" style={at(4, 6)}>+38 %</span>
        </span>
      </div>
      <div aria-hidden className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-3">
        <span className="sx-bar block h-full origin-left rounded-full bg-signal" />
      </div>
      <ol className="relative mt-4 grid flex-1 content-start gap-2.5">
        {timeline.map(({ I, t, s }, i) => (
          <li key={t} className="sx-at flex items-center gap-3" style={at(i + 1, 5.5)}>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-signal-soft text-signal">
              <I className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold">{t}</span>
              <span className="block truncate text-[11.5px] text-ink-3">{s}</span>
            </span>
            <Check className="h-4 w-4 shrink-0 text-ok" aria-hidden />
          </li>
        ))}
      </ol>
    </div>
  );
}

export type StepPanel = { url: string; node: ReactNode };

const homePanels: StepPanel[] = [
  { url: "app.yeswecontent.com/alta", node: <PanelRead /> },
  { url: "app.yeswecontent.com/plan", node: <PanelPlan /> },
  { url: "app.yeswecontent.com/resumen", node: <PanelGrow /> },
];

/**
 * Los tres pasos se quedan fijos en pantalla mientras haces scroll: a la izquierda avanza el
 * paso activo y a la derecha la pantalla del producto va completándose elemento a elemento.
 */
export function ScrollSteps({ steps, panels = homePanels, className }: { steps: Step[]; panels?: StepPanel[]; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const n = steps.length;

  useScrollProgress(
    wrap,
    (p) => {
      const el = stage.current;
      if (!el) return;
      el.style.setProperty("--pp", p.toFixed(4));
      for (let k = 0; k < n; k++) el.style.setProperty(`--sp${k}`, clamp(p * n * 1.08 - k).toFixed(4));
      const idx = Math.min(n - 1, Math.floor(p * n * 1.0001));
      setActive((a) => (a === idx ? a : idx));
    },
    {
      measure: (r, vh) => (HEADER - r.top) / Math.max(r.height - (vh - HEADER), 1),
      smooth: 0.16,
      track: true,
    },
  );

  return (
    <div ref={wrap} className={cn("sx-steps relative mt-10 md:mt-14", className)} style={{ height: `${n * 95 + 20}svh` }}>
      <div ref={stage} className="sx-steps-stage sticky top-16 flex h-[calc(100svh-4rem)] items-center">
        <div className="grid w-full grid-cols-1 items-center gap-5 md:grid-cols-[0.85fr_1.15fr] md:gap-12">
          {/* Pasos */}
          <div className="order-2 md:order-1">
            <div aria-hidden className="mb-4 flex gap-1.5 md:hidden">
              {steps.map((s, k) => (
                <span key={s.n} className="h-1 flex-1 overflow-hidden rounded-full bg-paper-3">
                  <span className="sx-seg block h-full origin-left rounded-full bg-signal" style={{ "--s": `var(--sp${k}, 1)` } as CSSProperties} />
                </span>
              ))}
            </div>
            <ol className="sx-step-list relative grid md:gap-2 md:pl-6">
              <span aria-hidden className="absolute top-2 bottom-2 left-0 hidden w-0.5 overflow-hidden rounded-full bg-paper-3 md:block">
                <span className="sx-rail block h-full origin-top bg-signal" />
              </span>
              {steps.map((s, k) => (
                <li key={s.n} className="sx-step col-start-1 row-start-1 md:col-auto md:row-auto md:py-3" data-active={active === k || undefined} aria-current={active === k ? "step" : undefined}>
                  <span className="tabular text-sm font-semibold text-signal">{s.n}</span>
                  <h3 className="mt-1.5 text-xl font-semibold tracking-tight md:text-2xl">{s.title}</h3>
                  <p className="mt-2 max-w-md text-[15px] leading-relaxed text-ink-2">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Pantalla del producto */}
          <div className="order-1 md:order-2">
            <div className="window relative">
              <div className="window-bar">
                <i />
                <i />
                <i />
                <span className="relative ml-2 h-4 flex-1 text-[11px] text-ink-3">
                  {panels.map((x, k) => (
                    <span key={x.url} className="sx-url absolute inset-0 truncate" data-active={active === k || undefined}>
                      {x.url}
                    </span>
                  ))}
                </span>
              </div>
              <div className="relative h-[300px] bg-paper-2 sm:h-[360px] md:h-[400px]">
                {panels.map(({ node }, k) => (
                  <div
                    key={k}
                    className="sx-panel absolute inset-0"
                    data-active={active === k || undefined}
                    data-past={active > k || undefined}
                    style={{ "--sp": `var(--sp${k}, 1)` } as CSSProperties}
                    aria-hidden={active !== k}
                  >
                    {node}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Solo marca data-on al entrar en pantalla; los hijos con clases sx-* deciden cómo aparecer. */
export function Watch({ children, className, threshold = 0.3 }: { children: ReactNode; className?: string; threshold?: number }) {
  const [ref, on] = useInView<HTMLDivElement>(threshold);
  return (
    <div ref={ref} className={cn("sx-watch", className)} data-on={on || undefined}>
      {children}
    </div>
  );
}

/**
 * Escaparate con la captura fija (escritorio): los textos con [data-sx-text="i"] pasan con el
 * scroll y la captura [data-sx-media="i"] del que está en el centro de la pantalla se queda
 * delante. En móvil no hace nada: cada texto va seguido de su captura.
 */
export function StickyShowcase({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const texts = Array.from(root.querySelectorAll<HTMLElement>("[data-sx-text]"));
    const media = Array.from(root.querySelectorAll<HTMLElement>("[data-sx-media]"));
    const set = (i: string) => {
      for (const el of [...texts, ...media]) {
        const mine = (el.dataset.sxText ?? el.dataset.sxMedia) === i;
        if (mine) el.setAttribute("data-active", "");
        else el.removeAttribute("data-active");
      }
    };
    set("0");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) set((e.target as HTMLElement).dataset.sxText!);
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    texts.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("sx-showcase", className)}>
      {children}
    </div>
  );
}

/**
 * Lista de pasos con un raíl que se llena con el scroll; cada paso se enciende cuando el raíl
 * llega a él. Los pasos son los hijos directos de la lista (li).
 */
export function ScrollRail({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLOListElement>(null);
  useScrollProgress(
    ref,
    (p) => {
      const el = ref.current;
      if (!el) return;
      el.style.setProperty("--pp", p.toFixed(4));
      const items = el.querySelectorAll<HTMLElement>(":scope > li");
      items.forEach((li, i) => {
        if (p >= (i + 0.35) / items.length || p >= 0.999) li.setAttribute("data-lit", "");
        else li.removeAttribute("data-lit");
      });
    },
    { start: 0.8, end: 0.6, smooth: 0.12 },
  );
  return (
    <ol ref={ref} className={cn("sx-rail-list relative", className)}>
      <span aria-hidden className="sx-rail-track pointer-events-none absolute top-6 bottom-6 left-[2.75rem] w-0.5 overflow-hidden rounded-full bg-line">
        <span className="sx-rail block h-full origin-top bg-signal" />
      </span>
      {children}
    </ol>
  );
}

/** Cuenta hacia arriba el primer número de un texto (p. ej. "+340 %") al entrar en pantalla. */
export function CountUpText({ text, className }: { text: string; className?: string }) {
  const [ref, on] = useInView<HTMLSpanElement>(0.5);
  const m = text.match(/^(\D*)(\d[\d.]*)(.*)$/);
  const target = m ? Number(m[2].replace(/\./g, "")) : 0;
  useEffect(() => {
    const el = ref.current;
    if (!el || !on || !m || reducedMotion()) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = easeOut(clamp((t - t0) / 1800));
      el.textContent = `${m[1]}${num(Math.round(target * k))}${m[3]}`;
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, text]);
  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}

/* ───────── Logos de buscadores y asistentes flotando alrededor de una frase ───────── */

// x/y en % del contenedor; d = profundidad (cuánto se desplaza con el scroll); s = tamaño.
// Van por los bordes para no tapar nunca el texto. Los marcados con m también salen en móvil.
const floaters = [
  { name: "Google", x: 9, y: 12, d: 1.2, s: 52, m: true },
  { name: "ChatGPT", x: 88, y: 10, d: 0.8, s: 48, m: true },
  { name: "Claude", x: 3, y: 58, d: 0.6, s: 40 },
  { name: "Gemini", x: 93, y: 52, d: 1.4, s: 44 },
  { name: "Perplexity", x: 14, y: 90, d: 1, s: 44, m: true },
  { name: "Gemini", x: 46, y: 4, d: 0.5, s: 32 },
  { name: "Claude", x: 80, y: 86, d: 1.1, s: 48, m: true },
  { name: "Google", x: 60, y: 94, d: 0.7, s: 32 },
  { name: "Perplexity", x: 72, y: 4, d: 0.9, s: 30 },
  { name: "ChatGPT", x: 30, y: 95, d: 1.3, s: 34 },
];

export function FloatingEngines({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLSpanElement | null)[]>([]);
  useScrollProgress(
    ref,
    (p) => {
      // En móvil hay menos aire alrededor del texto: menos recorrido.
      const amp = window.innerWidth < 768 ? 36 : 90;
      items.current.forEach((el, i) => {
        if (el) el.style.transform = `translate3d(0, ${((0.5 - p) * amp * floaters[i].d).toFixed(1)}px, 0)`;
      });
    },
    { measure: (r, vh) => (vh - r.top) / (vh + r.height), smooth: 0.08 },
  );
  return (
    <div ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {floaters.map((f, i) => (
        <span
          key={i}
          ref={(el) => void (items.current[i] = el)}
          className={cn("absolute will-change-transform", !f.m && "max-md:hidden")}
          style={{ left: `${f.x}%`, top: `${f.y}%` }}
        >
          <span
            className="sx-float grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl border border-line bg-card shadow-[var(--shadow-md)] max-md:scale-75"
            style={{ width: f.s, height: f.s, "--dur": `${7 + (i % 4) * 1.7}s`, "--delay": `${-i * 1.3}s` } as CSSProperties}
          >
            <EngineLogo name={f.name} size={Math.round(f.s * 0.52)} alt="" />
          </span>
        </span>
      ))}
    </div>
  );
}
