/**
 * Conversor Markdown → HTML mínimo y seguro (escapa todo el HTML de entrada).
 * Cubre lo que generan nuestros artículos: títulos, listas, negrita, cursiva,
 * enlaces, código en línea, citas y párrafos.
 */

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function inline(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => {
    const safe = /^(https?:\/\/|\/|#)/i.test(href) ? href : "#";
    return `<a href="${safe}">${label}</a>`;
  });
  return out;
}

export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let list: "ul" | "ol" | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) html.push(`<p>${inline(para.join(" "))}</p>`);
    para = [];
  };
  const closeList = () => {
    if (list) html.push(`</${list}>`);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    const ul = /^\s*[-*]\s+(.*)$/.exec(line);
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const quote = /^>\s?(.*)$/.exec(line);

    if (!line.trim()) {
      flushPara();
      closeList();
    } else if (heading) {
      flushPara();
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
    } else if (ul || ol) {
      flushPara();
      const kind = ul ? "ul" : "ol";
      if (list !== kind) {
        closeList();
        html.push(`<${kind}>`);
        list = kind;
      }
      html.push(`<li>${inline((ul ?? ol)![1])}</li>`);
    } else if (quote) {
      flushPara();
      closeList();
      html.push(`<blockquote>${inline(quote[1])}</blockquote>`);
    } else {
      closeList();
      para.push(line.trim());
    }
  }
  flushPara();
  closeList();
  return html.join("\n");
}

/** Extrae la estructura de títulos (útil para el índice y la puntuación). */
export function headings(md: string): { level: number; text: string }[] {
  return md
    .split("\n")
    .map((l) => /^(#{1,4})\s+(.*)$/.exec(l.trim()))
    .filter((m): m is RegExpExecArray => !!m)
    .map((m) => ({ level: m[1].length, text: m[2] }));
}

/** Clase de tipografía para renderizar el HTML resultante sin plugin de prose. */
export const proseClass =
  "space-y-4 text-[15px] leading-relaxed text-ink-2 [&_a]:text-signal [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-lime [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:rounded [&_code]:bg-paper-2 [&_code]:px-1 [&_h1]:font-display [&_h1]:text-3xl [&_h1]:text-ink [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-ink [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink [&_li]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-1";
