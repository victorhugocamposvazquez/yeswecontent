/**
 * Infografía en SVG: una tarjeta de datos a partir de la lista o las cifras
 * clave de un artículo. Sin dependencias y apta para cualquier CMS.
 */
import { toBlocks } from "@/lib/panel/blocks";
import { parsePalette } from "./palette";

export interface InfographicData {
  title: string;
  items: string[];
  /** Sección del artículo de la que sale (para colocarla justo después). */
  section: string;
  /** Texto exacto del bloque de lista (para insertarla detrás). */
  anchorBlock?: string;
}

const clean = (s: string) =>
  s
    .replace(/^\s*([-*+]|\d+[.)])\s+/, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Busca la mejor lista (3–7 elementos) o, si no hay, frases con cifras. */
export function extractInfographic(title: string, md: string): InfographicData | null {
  const blocks = toBlocks(md);
  const lists = blocks
    .map((b, i) => ({ b, i }))
    .filter(({ b }) => b.type === "list")
    .map(({ b, i }) => {
      const items = b.raw
        .split("\n")
        .filter((l) => /^\s*([-*+]|\d+[.)])\s+/.test(l))
        .map(clean)
        .filter((x) => x.length > 2);
      const hasNumbers = items.filter((x) => /\d/.test(x)).length;
      return { b, i, items, weight: (items.length >= 3 && items.length <= 7 ? 10 : 0) + hasNumbers * 2 + Math.min(items.join(" ").length / 80, 4) };
    })
    .filter((l) => l.items.length >= 3)
    .sort((a, b) => b.weight - a.weight);

  if (lists.length) {
    const best = lists[0];
    return { title: best.b.section || title, items: best.items.slice(0, 7), section: best.b.section, anchorBlock: best.b.raw };
  }

  const stats = md
    .replace(/\n/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map(clean)
    .filter((s) => /\d+([.,]\d+)?\s?(%|€|euros|años|horas|minutos|grados|cm|kg|veces)/i.test(s) && s.length < 160);
  if (stats.length >= 3) return { title: `${title}: datos clave`, items: stats.slice(0, 5), section: "" };
  return null;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function wrap(text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Devuelve el SVG (1200 px de ancho, alto según contenido). */
export function infographicSvg(data: Pick<InfographicData, "title" | "items">, opts: { palette?: string | null; siteName?: string } = {}): string {
  const p = parsePalette(opts.palette);
  const W = 1200;
  const pad = 72;
  const titleLines = wrap(data.title, 34).slice(0, 3);
  let y = pad + 40;
  const parts: string[] = [];
  parts.push(`<text x="${pad}" y="${y}" font-size="22" font-weight="700" letter-spacing="4" fill="${p.accent}">EN DATOS</text>`);
  y += 30;
  for (const l of titleLines) {
    y += 56;
    parts.push(`<text x="${pad}" y="${y}" font-size="48" font-weight="700" fill="${p.ink}">${esc(l)}</text>`);
  }
  y += 40;
  data.items.slice(0, 7).forEach((item, i) => {
    const lines = wrap(item, 62).slice(0, 3);
    const h = Math.max(96, 40 + lines.length * 36);
    parts.push(`<rect x="${pad}" y="${y}" width="${W - pad * 2}" height="${h - 16}" rx="20" fill="#ffffff" fill-opacity="0.75"/>`);
    parts.push(`<circle cx="${pad + 52}" cy="${y + (h - 16) / 2}" r="30" fill="${i % 2 ? p.accent2 : p.accent}"/>`);
    parts.push(`<text x="${pad + 52}" y="${y + (h - 16) / 2 + 11}" text-anchor="middle" font-size="30" font-weight="700" fill="${i % 2 ? p.ink : "#ffffff"}">${i + 1}</text>`);
    lines.forEach((l, j) => {
      const ty = y + (h - 16) / 2 - ((lines.length - 1) * 36) / 2 + j * 36 + 10;
      parts.push(`<text x="${pad + 112}" y="${ty}" font-size="28" fill="${p.ink}">${esc(l)}</text>`);
    });
    y += h;
  });
  y += 24;
  if (opts.siteName) parts.push(`<text x="${pad}" y="${y + 20}" font-size="22" fill="${p.ink}" fill-opacity="0.6">${esc(opts.siteName)}</text>`);
  const H = y + 20 + pad;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Helvetica, Arial, sans-serif" role="img" aria-label="${esc(data.title)}">
<rect width="${W}" height="${H}" fill="${p.background}"/>
<rect width="${W}" height="14" fill="${p.accent}"/>
<circle cx="${W - 60}" cy="80" r="140" fill="${p.accent2}" fill-opacity="0.35"/>
${parts.join("\n")}
</svg>`;
}
