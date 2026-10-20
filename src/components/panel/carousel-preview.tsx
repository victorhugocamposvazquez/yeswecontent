"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const THEMES = ["bg-signal text-white", "bg-card text-ink", "bg-lime text-ink", "bg-ink text-paper"];

/** Vista previa de un carrusel cuadrado (Instagram/Facebook) con navegación. */
export function CarouselPreview({ slides, brand, channel }: { slides: string[]; brand: string; channel: string }) {
  const [i, setI] = useState(0);
  const last = slides.length - 1;
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-2 flex items-center gap-2 text-xs">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-[10px] font-bold text-paper" aria-hidden>
          {brand.slice(0, 2).toUpperCase()}
        </span>
        <span className="font-semibold">{brand.toLowerCase().replace(/\s+/g, "")}</span>
        <span className="ml-auto capitalize text-ink-3">{channel}</span>
      </div>
      <div className="relative aspect-square overflow-hidden rounded-xl border border-line" aria-roledescription="carrusel" aria-label={`Diapositiva ${i + 1} de ${slides.length}`}>
        <div className={cn("grain flex h-full flex-col justify-between p-6", THEMES[i === 0 ? 0 : i === last ? 3 : (i % 2) + 1])}>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-70">
            {i + 1}/{slides.length}
          </span>
          <p className={cn("font-semibold tracking-tight leading-tight", i === 0 ? "text-2xl" : "text-xl")}>{slides[i]}</p>
          <span className="text-xs opacity-70">{i === last ? "Guárdalo · Compártelo" : "Desliza →"}</span>
        </div>
        {i > 0 && (
          <button type="button" onClick={() => setI(i - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-card/90 p-1.5 shadow" aria-label="Diapositiva anterior">
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {i < last && (
          <button type="button" onClick={() => setI(i + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-card/90 p-1.5 shadow" aria-label="Diapositiva siguiente">
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="mt-2 flex justify-center gap-1" aria-hidden>
        {slides.map((_, j) => (
          <span key={j} className={cn("h-1.5 w-1.5 rounded-full", j === i ? "bg-signal" : "bg-line")} />
        ))}
      </div>
    </div>
  );
}
