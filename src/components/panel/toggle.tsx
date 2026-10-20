"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

/** Interruptor accesible que envía "on"/"off" en un campo oculto del formulario. */
export function Toggle({ name, defaultChecked = false, label, hint, onChange }: { name?: string; defaultChecked?: boolean; label: string; hint?: string; onChange?: (v: boolean) => void }) {
  const [on, setOn] = useState(defaultChecked);
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p id={id} className="text-sm font-medium text-ink">
          {label}
        </p>
        {hint && <p className="text-xs text-ink-3">{hint}</p>}
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
        className={cn("relative h-6 w-11 shrink-0 rounded-full border border-ink transition", on ? "bg-lime" : "bg-paper-2")}
      >
        <span className={cn("absolute top-0.5 h-4.5 w-4.5 rounded-full bg-ink transition-all", on ? "left-[1.4rem]" : "left-0.5")} />
      </button>
      {name && <input type="hidden" name={name} value={on ? "on" : "off"} />}
    </div>
  );
}
