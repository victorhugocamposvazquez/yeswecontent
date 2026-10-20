import Image from "next/image";
import { RATING } from "@/lib/marketing/social-proof";
import { cn } from "@/lib/utils";

/** Píldora de valoración al estilo de las reseñas de Google: icono G, cinco estrellas (la última parcial) y la nota. */
export function RatingPill({ className }: { className?: string }) {
  const fill = Math.max(0, Math.min(1, RATING.score - Math.floor(RATING.score)));
  const full = Math.floor(RATING.score);
  const label = `Valoración ${RATING.score.toLocaleString("es-ES")} de ${RATING.outOf} en Google`;
  return (
    <span className={cn("inline-flex h-11 items-center gap-2.5 rounded-full border border-line bg-card pr-4 pl-3 shadow-[var(--shadow-xs)]", className)} role="img" aria-label={label}>
      <Image src="/logos/color/google.svg" alt="" width={20} height={20} className="h-5 w-5 shrink-0" draggable={false} />
      <span className="flex gap-0.5" aria-hidden>
        {Array.from({ length: RATING.outOf }).map((_, i) => {
          const f = i < full ? 1 : i === full ? fill : 0;
          const id = `star-${i}`;
          return (
            <svg key={i} viewBox="0 0 24 24" className="h-4 w-4">
              <defs>
                <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
                  <stop offset={`${f * 100}%`} stopColor="#F4B400" />
                  <stop offset={`${f * 100}%`} stopColor="#E3E2DE" />
                </linearGradient>
              </defs>
              <path d="M12 2.5l2.9 6.1 6.7.8-4.9 4.6 1.3 6.6L12 17.3 6 20.6l1.3-6.6L2.4 9.4l6.7-.8L12 2.5z" fill={`url(#${id})`} />
            </svg>
          );
        })}
      </span>
      <span className="text-sm font-semibold text-ink" aria-hidden>
        Google <span className="tabular">{RATING.score.toLocaleString("es-ES")}/{RATING.outOf}</span>
      </span>
    </span>
  );
}
