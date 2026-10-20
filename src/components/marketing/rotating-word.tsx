"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ROTATING_ENGINES } from "@/lib/marketing/social-proof";
import { EngineWordmark } from "./engine-wordmark";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Motor que rota cada ~2,2 s con su logotipo completo (icono + nombre con el aspecto de la marca).
 * Decorativo: el titular completo va en sr-only. Cada logotipo se posiciona en absoluto dentro de un
 * recorte de altura fija cuyo ancho se anima al del logotipo activo; los inactivos quedan con
 * opacity 0 + visibility hidden, así nunca se ve el anterior detrás del nuevo en anchos estrechos.
 */
export function RotatingWord({ className }: { className?: string }) {
  const [i, setI] = useState(0);
  const [widths, setWidths] = useState<number[]>([]);
  const items = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % ROTATING_ENGINES.length), 2200);
    return () => window.clearInterval(id);
  }, []);

  useIsoLayoutEffect(() => {
    const measure = () => setWidths(items.current.map((el) => el?.scrollWidth ?? 0));
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    items.current.forEach((el) => el && ro?.observe(el));
    window.addEventListener("resize", measure);
    if (document.fonts?.ready) document.fonts.ready.then(measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const max = widths.length ? Math.max(...widths) : 0;
  const width = widths[i] || max;

  return (
    <span
      aria-hidden
      className={cn("relative inline-block h-[1.12em] w-max overflow-hidden align-bottom transition-[width] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none", className)}
      style={width ? { width } : undefined}
    >
      {ROTATING_ENGINES.map((w, k) => {
        const state = k === i ? "now" : k === (i - 1 + ROTATING_ENGINES.length) % ROTATING_ENGINES.length ? "prev" : "next";
        return (
          <span
            key={w.name}
            ref={(el) => {
              items.current[k] = el;
            }}
            className={cn(
              "absolute inset-y-0 left-0 flex w-max items-center transition-[opacity,transform,visibility] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none",
              state === "now" && "visible translate-y-0 opacity-100",
              state === "prev" && "invisible -translate-y-[60%] opacity-0",
              state === "next" && "invisible translate-y-[60%] opacity-0",
            )}
          >
            <EngineWordmark name={w.name} decorative />
          </span>
        );
      })}
      {/* Antes de medir, reserva el ancho del logotipo más largo. */}
      {!width && (
        <span className="invisible block h-0 overflow-hidden">
          <EngineWordmark name="Perplexity" decorative />
        </span>
      )}
    </span>
  );
}
