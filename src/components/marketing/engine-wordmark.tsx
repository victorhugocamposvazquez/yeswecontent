import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Logotipo completo (icono + nombre con el aspecto de cada marca) de los motores donde posicionamos.
 * Escala con el font-size del contenedor: el nombre ocupa ~0,9 em y el icono ~0,85 em.
 * Marcas de sus respectivos titulares (nota legal en el pie). La fuente geométrica llega por --font-geo.
 */

const geo: CSSProperties = { fontFamily: "var(--font-geo), system-ui, sans-serif" };
const googleLetters: [string, string][] = [
  ["G", "#4285F4"],
  ["o", "#EA4335"],
  ["o", "#FBBC05"],
  ["g", "#4285F4"],
  ["l", "#34A853"],
  ["e", "#EA4335"],
];

type Spec = { icon?: string; text: string; style: CSSProperties; className?: string };
const specs: Record<string, Spec> = {
  Google: { text: "Google", style: { ...geo, fontWeight: 500, letterSpacing: "-0.02em" } },
  ChatGPT: { icon: "/logos/color/chatgpt.svg", text: "ChatGPT", style: { ...geo, fontWeight: 600, color: "#000000", letterSpacing: "-0.02em" } },
  Gemini: { icon: "/logos/color/gemini.svg", text: "Gemini", style: { ...geo, fontWeight: 500, color: "#444746", letterSpacing: "-0.01em" } },
  Perplexity: { icon: "/logos/color/perplexity.svg", text: "Perplexity", style: { ...geo, fontWeight: 500, color: "#20808D", letterSpacing: "-0.015em" } },
  Claude: { icon: "/logos/color/claude.svg", text: "Claude", style: { fontFamily: "var(--font-serif), Georgia, serif", fontWeight: 400, color: "#000000", letterSpacing: "0" } },
  Reddit: { icon: "/logos/color/reddit.svg", text: "reddit", style: { ...geo, fontWeight: 600, color: "#FF4500", letterSpacing: "-0.02em" } },
  Quora: { icon: "/logos/color/quora.svg", text: "Quora", style: { fontFamily: "var(--font-serif), Georgia, serif", fontWeight: 400, color: "#B92B27" } },
};

export function EngineWordmark({ name, className, decorative = false }: { name: string; className?: string; decorative?: boolean }) {
  const s = specs[name];
  if (!s) return null;
  return (
    <span className={cn("inline-flex items-center gap-[0.22em] whitespace-nowrap align-middle leading-none", className)} role={decorative ? undefined : "img"} aria-label={decorative ? undefined : name} aria-hidden={decorative || undefined}>
      {s.icon && <Image src={s.icon} alt="" width={64} height={64} className="h-[0.9em] w-[0.9em] shrink-0 select-none" draggable={false} />}
      <span className="text-[0.95em] leading-none" style={s.style}>
        {name === "Google"
          ? googleLetters.map(([ch, color], i) => (
              <span key={i} style={{ color }}>
                {ch}
              </span>
            ))
          : s.text}
      </span>
    </span>
  );
}
