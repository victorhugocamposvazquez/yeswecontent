"use client";

import { useState } from "react";
import { Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui";

/** Copia el texto al portapapeles y abre la URL en otra pestaña (Quora no tiene API de publicación). */
export function CopyOpenButton({ text, url, label = "Copiar y abrir en Quora", className }: { text: string; url: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      type="button"
      variant="primary"
      className={className}
      onClick={async () => {
        // Copiamos y abrimos en el mismo gesto (sin await entre medias) para que no se bloquee la pestaña.
        const copy = navigator.clipboard?.writeText(text) ?? Promise.reject(new Error("sin portapapeles"));
        const win = window.open(url, "_blank");
        if (win) win.opener = null;
        try {
          await copy;
        } catch {
          window.prompt("Copia este texto y pégalo en Quora:", text);
        }
        if (!win) window.location.href = url;
        setDone(true);
        setTimeout(() => setDone(false), 4000);
      }}
    >
      {done ? <Check className="h-4 w-4" aria-hidden /> : <ExternalLink className="h-4 w-4" aria-hidden />}
      <span aria-live="polite">{done ? "Copiado: pégalo en Quora" : label}</span>
    </Button>
  );
}
