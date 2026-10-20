"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui";

export function CopyButton({ text, label = "Copiar", variant = "outline", className }: { text: string; label?: string; variant?: "primary" | "ink" | "ghost" | "outline"; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={async () => {
        const value = text.startsWith("/") ? `${window.location.origin}${text}` : text;
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          window.prompt("Copia este texto:", value);
        }
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }}
    >
      {done ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      <span aria-live="polite">{done ? "Copiado" : label}</span>
    </Button>
  );
}
