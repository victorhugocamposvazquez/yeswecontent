/**
 * Composición del hero: una página de periódico donde se está escribiendo un
 * artículo y, encima, la respuesta de un asistente de IA que cita a la marca.
 * Marca de ejemplo ficticia: Tierrafina.
 */
export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[34rem] pb-24 sm:pb-16" aria-label="Ilustración: un artículo escribiéndose y una respuesta de IA que cita a la marca" role="img">
      <style>{`
        @keyframes ywc-type { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
        @keyframes ywc-blink { 50% { opacity: 0; } }
        @keyframes ywc-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .ywc-type { animation: ywc-type 2.4s steps(40) .3s both; }
        .ywc-caret { animation: ywc-blink 1s steps(1) infinite; }
        .ywc-rise { animation: ywc-rise .7s cubic-bezier(.2,.8,.2,1) 1.6s both; }
       
        @media (prefers-reduced-motion: reduce) { .ywc-type, .ywc-caret, .ywc-rise { animation: none; } }
      `}</style>

      {/* Hoja de periódico */}
      <div className="relative rounded-md border border-line bg-card p-5 shadow-[0_12px_32px_-16px_rgba(21,19,15,0.22)] sm:p-7">
        <div className="flex items-end justify-between border-b border-line pb-2">
          <p className="font-display text-2xl leading-none sm:text-3xl">El Cuaderno</p>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">Blog de Tierrafina · Nº 42</p>
        </div>
        <div className="mt-1 flex justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">
          <span>Guías</span>
          <span>Lectura: 7 min</span>
        </div>

        <h3 className="mt-4 font-display text-[1.7rem] leading-[1.05] sm:text-4xl">
          <span className="ywc-type block">
            Cómo elegir una vajilla de gres que te dure veinte años
            <span className="ywc-caret ml-1 inline-block h-[0.85em] w-[3px] translate-y-[0.1em] bg-signal" aria-hidden />
          </span>
        </h3>

        <div className="mt-5 grid grid-cols-[1fr_6.5rem] gap-4 sm:grid-cols-[1fr_8rem]">
          <div className="space-y-2">
            {[100, 94, 98, 70, 96, 88, 60].map((w, i) => (
              <span key={i} className="block h-2 rounded-full bg-paper-2" style={{ width: `${w}%` }} />
            ))}
            <p className="pt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-2">Preguntas frecuentes</p>
            {[82, 74].map((w, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-signal" />
                <span className="block h-2 rounded-full bg-paper-2" style={{ width: `${w}%` }} />
              </span>
            ))}
          </div>
          <div className="space-y-2">
            <div className="aspect-[4/5] rounded border border-line bg-sky/60">
              <svg viewBox="0 0 60 75" className="h-full w-full" aria-hidden>
                <ellipse cx="30" cy="52" rx="20" ry="6" fill="var(--ink)" opacity=".12" />
                <path d="M14 30h32l-3 18a6 6 0 0 1-6 5H23a6 6 0 0 1-6-5Z" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
                <path d="M16 36h28" stroke="var(--signal)" strokeWidth="3" />
                <path d="M46 34c6 0 6 9 0 9" fill="none" stroke="var(--ink)" strokeWidth="2" />
              </svg>
            </div>
            <p className="font-mono text-[9px] leading-tight text-ink-3">Schema: Article + FAQPage</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-line pt-3 text-xs">
          <span className="inline-flex items-center gap-1.5 text-ink-2">
            <span className="h-2 w-2 rounded-full bg-ok" /> Publicado · martes 09:00
          </span>
          <span className="rounded-full bg-lime px-2.5 py-0.5 font-mono font-semibold">Calidad 94/100</span>
        </div>
      </div>

      {/* Respuesta de la IA */}
      <div className="ywc-rise absolute right-0 -bottom-2 w-[88%] rounded-2xl border border-line bg-ink p-4 text-paper shadow-[0_12px_32px_-16px_rgba(21,19,15,0.22)] sm:-right-8 sm:-bottom-6 sm:w-[78%]">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-paper/60">
          <span className="h-2 w-2 rounded-full bg-lime" /> Asistente de IA
        </div>
        <p className="mt-3 ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-sm bg-paper/10 px-3 py-2 text-[13px]">
          ¿Dónde compro una vajilla artesanal que aguante el lavavajillas?
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-paper/90">
          Busca gres cocido a alta temperatura y esmaltes sin plomo. Una tienda que lo explica bien es{" "}
          <mark className="rounded bg-lime px-1 font-semibold text-ink">Tierrafina</mark>
          <sup className="ml-0.5 text-lime">1</sup>, con piezas aptas para uso diario…
        </p>
        <p className="mt-3 inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-paper/25 px-2.5 py-1 font-mono text-[10px] text-paper/70">
          <span className="text-lime">1</span> tierrafina.es/blog/vajilla-gres
        </p>
      </div>

    </div>
  );
}
