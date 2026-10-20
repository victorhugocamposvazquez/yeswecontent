"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ROTATING_ENGINES } from "@/lib/marketing/social-proof";
import { BrandLogo } from "./brand-logo";

/** Motor que rota cada ~2 s con su logotipo. Decorativo: el texto completo va en sr-only en el titular. */
export function RotatingWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % ROTATING_ENGINES.length), 2000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span aria-hidden className="relative inline-grid overflow-hidden pb-[0.1em] align-bottom">
      {ROTATING_ENGINES.map((w, k) => {
        const state = k === i ? "now" : k === (i - 1 + ROTATING_ENGINES.length) % ROTATING_ENGINES.length ? "prev" : "next";
        return (
          <span
            key={w.name}
            className={cn(
              "col-start-1 row-start-1 inline-flex items-center justify-center gap-[0.25em] sm:justify-start whitespace-nowrap text-signal transition-all duration-500 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none",
              state === "now" && "translate-y-0 opacity-100",
              state === "prev" && "-translate-y-full opacity-0",
              state === "next" && "translate-y-full opacity-0",
            )}
          >
            <BrandLogo src={w.logo} className="h-[0.8em] w-[0.8em] text-ink" />
            <span>{w.name}</span>
          </span>
        );
      })}
    </span>
  );
}
