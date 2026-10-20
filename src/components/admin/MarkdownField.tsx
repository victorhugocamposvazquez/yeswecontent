"use client";

import { useId, useState } from "react";
import { Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s: string) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g, '<a href="$2" class="underline">$1</a>');

/** Vista previa mínima de Markdown (títulos, listas, párrafos, negrita, enlaces). Escapa HTML. */
function render(md: string) {
  const out: string[] = [];
  let list: "ul" | "ol" | null = null;
  const close = () => {
    if (list) out.push(`</${list}>`);
    list = null;
  };
  for (const raw of md.split("\n")) {
    const line = raw.trimEnd();
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    const ul = /^[-*]\s+(.*)$/.exec(line);
    const ol = /^\d+\.\s+(.*)$/.exec(line);
    if (h) {
      close();
      const lvl = h[1].length + 1;
      out.push(`<h${lvl} class="font-semibold tracking-tight ${lvl <= 2 ? "text-xl" : "text-lg"} mt-4 mb-1">${inline(h[2])}</h${lvl}>`);
    } else if (ul || ol) {
      const kind = ul ? "ul" : "ol";
      if (list !== kind) {
        close();
        out.push(`<${kind} class="${kind === "ul" ? "list-disc" : "list-decimal"} pl-5 space-y-1 my-2">`);
        list = kind;
      }
      out.push(`<li>${inline((ul ?? ol)![1])}</li>`);
    } else if (line.startsWith("> ")) {
      close();
      out.push(`<blockquote class="border-l-2 border-signal pl-3 italic text-ink-2 my-2">${inline(line.slice(2))}</blockquote>`);
    } else if (!line.trim()) {
      close();
    } else {
      close();
      out.push(`<p class="my-2">${inline(line)}</p>`);
    }
  }
  close();
  return out.join("");
}

export function MarkdownField({ name, defaultValue = "", rows = 14, label, required }: { name: string; defaultValue?: string; rows?: number; label: string; required?: boolean }) {
  const [value, setValue] = useState(defaultValue);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const id = useId();
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-ink-2">
          {label}
        </label>
        <div role="tablist" aria-label="Modo del editor" className="flex rounded-full bg-paper-2 p-0.5 text-xs">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn("min-h-9 rounded-full px-3 py-1 font-medium sm:min-h-0", tab === t ? "bg-card text-ink shadow-sm" : "text-ink-3")}
            >
              {t === "write" ? "Escribir" : "Vista previa"}
            </button>
          ))}
        </div>
      </div>
      <Textarea
        id={id}
        name={name}
        rows={rows}
        value={value}
        required={required}
        onChange={(e) => setValue(e.target.value)}
        className={cn("font-mono text-[13px] leading-relaxed", tab === "preview" && "hidden")}
      />
      {tab === "preview" && (
        <div
          className="min-h-40 rounded-xl border border-line bg-card px-4 py-3 text-sm leading-relaxed"
          // Contenido escapado en render(); solo se generan etiquetas propias.
          dangerouslySetInnerHTML={{ __html: value.trim() ? render(value) : '<p class="text-ink-3">Nada que previsualizar todavía.</p>' }}
        />
      )}
      <p className="mt-1 text-xs text-ink-3">Markdown: ## título, **negrita**, - listas, [enlace](https://…).</p>
    </div>
  );
}
