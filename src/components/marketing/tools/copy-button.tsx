"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyButton({ text, dark = false, label = "Copiar" }: { text: string; dark?: boolean; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          setDone(false);
        }
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
        dark ? "border border-paper/40 hover:bg-paper/10" : "border border-line bg-card hover:bg-paper-2",
      )}
    >
      {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {done ? "Copiado" : label}
    </button>
  );
}
