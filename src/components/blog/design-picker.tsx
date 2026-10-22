"use client";

import { BLOG_COLORS, BLOG_LOOKS, type BlogColorId, type BlogLook } from "@/lib/headless/looks";
import { cn } from "@/lib/utils";

export function DesignPicker({
  look,
  color,
  onLook,
  onColor,
}: {
  look: BlogLook;
  color: BlogColorId;
  onLook: (look: BlogLook) => void;
  onColor: (color: BlogColorId) => void;
}) {
  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-2">Elige un estilo</legend>
        <div className="grid grid-cols-2 gap-2">
          {BLOG_LOOKS.map((l) => {
            const swatch = BLOG_COLORS.find((c) => c.id === color) ?? BLOG_COLORS[0];
            const dark = l.id === "oscuro" || color === "noche";
            return (
              <button
                key={l.id}
                type="button"
                aria-pressed={look === l.id}
                onClick={() => onLook(l.id)}
                className={cn("rounded-xl border p-3 text-left transition-colors", look === l.id ? "border-signal ring-1 ring-signal" : "border-line bg-card hover:bg-paper-2")}
              >
                <span
                  className="mb-2 flex h-10 items-end rounded-lg px-2 pb-1.5"
                  style={{ background: dark ? "#141413" : swatch.background, border: "1px solid rgba(0,0,0,.06)" }}
                >
                  <span className="h-1.5 w-10 rounded-full" style={{ background: swatch.accent }} />
                </span>
                <span className={cn("block text-[13px] font-semibold", l.font === "serif" && "font-serif")}>{l.label}</span>
                <span className="mt-0.5 block text-xs text-ink-3">{l.hint}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-2">Color</legend>
        <div className="flex flex-wrap gap-2">
          {BLOG_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={color === c.id}
              aria-label={c.label}
              title={c.label}
              onClick={() => onColor(c.id)}
              className={cn("h-9 w-9 rounded-full border-2", color === c.id ? "border-ink" : "border-transparent")}
              style={{ background: c.id === "noche" ? "#141413" : c.accent, boxShadow: "inset 0 0 0 2px white" }}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
