"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

/** Interruptor accesible (36×20) que envía "on"/"off" en un campo oculto del formulario. */
export function Toggle({ name, defaultChecked = false, label, hint, onChange, className }: { name?: string; defaultChecked?: boolean; label: string; hint?: string; onChange?: (v: boolean) => void; className?: string }) {
  const [on, setOn] = useState(defaultChecked);
  const id = useId();
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <p id={id} className="text-sm font-medium text-ink">
          {label}
        </p>
        {hint && <p className="mt-0.5 text-xs text-ink-3">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={id}
        onClick={() => {
          setOn(!on);
          onChange?.(!on);
        }}
        className="-m-3 shrink-0 p-3"
      >
        <span className={cn("block h-5 w-9 rounded-full p-0.5 transition-colors duration-150", on ? "bg-signal" : "bg-line-2 hover:bg-ink-3/60")}>
          <span className={cn("block h-4 w-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-transform duration-150", on ? "translate-x-4" : "translate-x-0")} />
        </span>
      </button>
      {name && <input type="hidden" name={name} value={on ? "on" : "off"} />}
    </div>
  );
}
