/** Renderizado mínimo de Markdown (títulos, párrafos, listas, negrita, enlaces). Sin HTML crudo. */
import type { ReactNode } from "react";

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*)|(\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[2]) out.push(<strong key={k++}>{m[2]}</strong>);
    else out.push(<a key={k++} href={m[5]} className="underline decoration-signal decoration-2 underline-offset-2">{m[4]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.trim().split(/\n{2,}/);
  return (
    <div className="space-y-5 text-lg leading-relaxed text-ink-2">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (/^#{1,3} /.test(b)) {
          const level = b.match(/^#+/)![0].length;
          const text = b.replace(/^#+ /, "");
          return level <= 2 ? (
            <h2 key={i} className="pt-4 font-display text-4xl leading-tight text-ink">{inline(text)}</h2>
          ) : (
            <h3 key={i} className="pt-2 text-xl font-semibold text-ink">{inline(text)}</h3>
          );
        }
        if (lines.every((l) => /^[-*] /.test(l)))
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-6 marker:text-signal">
              {lines.map((l, j) => <li key={j}>{inline(l.replace(/^[-*] /, ""))}</li>)}
            </ul>
          );
        if (lines.every((l) => /^> /.test(l)))
          return (
            <blockquote key={i} className="border-l-4 border-signal pl-5 font-display text-2xl text-ink">
              {inline(lines.map((l) => l.slice(2)).join(" "))}
            </blockquote>
          );
        return <p key={i}>{inline(lines.join(" "))}</p>;
      })}
    </div>
  );
}
