/**
 * Convierte la paleta en texto libre de sites.visual_style.palette
 * ("terracota y crema", "verde salvia, arena") en colores concretos.
 */

const COLORS: [RegExp, string][] = [
  [/terracot|teja|barro|arcilla|terracotta|clay/, "#b8573a"],
  [/crema|cream|marfil|ivory|hueso/, "#f4ecdc"],
  [/arena|sand|beige|camel|tostado/, "#e2d3b5"],
  [/mostaza|mustard|ocre|ochre/, "#d29a2b"],
  [/dorad|gold|oro\b/, "#c9a227"],
  [/amarill|yellow/, "#f2c94c"],
  [/naranja|orange|mandarina/, "#ff7a3d"],
  [/coral|salm[oó]n/, "#ff7f6b"],
  [/rojo|red|granate|burdeos|vino|burgundy/, "#a3302b"],
  [/rosa|pink|fucsia/, "#e98aa7"],
  [/lila|lavanda|lavender|malva/, "#b7a6d8"],
  [/morado|violeta|purple|berenjena/, "#5b3e8c"],
  [/marino|navy|azul oscuro/, "#1f2f4f"],
  [/turquesa|teal|aguamarina/, "#2a9d8f"],
  [/celeste|cielo|sky|azul claro/, "#9fd3ff"],
  [/azul|blue|cobalto/, "#2f5fbf"],
  [/salvia|sage/, "#a7b89a"],
  [/oliva|olive|caqui|khaki/, "#6f7a3a"],
  [/menta|mint/, "#bfe6cf"],
  [/lima|lime|pistacho/, "#c8f03c"],
  [/verde|green|bosque|esmeralda/, "#2f6b4f"],
  [/marr[oó]n|brown|chocolate|caf[eé]|nogal|madera/, "#6b4a33"],
  [/gris|gray|grey|piedra|cemento/, "#8b8a86"],
  [/negro|black|carb[oó]n|tinta/, "#15130f"],
  [/blanco|white|nieve/, "#ffffff"],
];

/** Colores de marca de yeswecontent como último recurso. */
export const DEFAULT_PALETTE = ["#ff4f1f", "#f5f4f1", "#15130f", "#c8f03c"];

export interface Palette {
  /** Color protagonista (formas y bandas). */
  accent: string;
  /** Fondo claro. */
  background: string;
  /** Texto. */
  ink: string;
  /** Segundo acento. */
  accent2: string;
}

const luminance = (hex: string) => {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export function parsePalette(text?: string | null): Palette {
  const t = (text ?? "").toLowerCase();
  const hexes = [...t.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/g)].map((m) => (m[1].length === 3 ? `#${m[1].split("").map((c) => c + c).join("")}` : `#${m[1]}`));
  // Respeta el orden en que aparecen las palabras de color.
  const named = COLORS.map(([re, hex]) => ({ hex, at: t.search(re) }))
    .filter((c) => c.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map((c) => c.hex);
  const found = [...new Set([...hexes, ...named])];
  if (!found.length) return { accent: DEFAULT_PALETTE[0], background: DEFAULT_PALETTE[1], ink: DEFAULT_PALETTE[2], accent2: DEFAULT_PALETTE[3] };

  const byLight = [...found].sort((a, b) => luminance(b) - luminance(a));
  const light = byLight.find((c) => luminance(c) > 0.6);
  const background = light ?? "#f7f4ee";
  const rest = found.filter((c) => c !== background);
  const accent = rest.find((c) => luminance(c) > 0.04 && luminance(c) < 0.6) ?? rest[0] ?? DEFAULT_PALETTE[0];
  const accent2 = rest.find((c) => c !== accent) ?? (luminance(accent) > 0.3 ? "#15130f" : "#e8dcc4");
  const darkest = [...found].sort((a, b) => luminance(a) - luminance(b))[0];
  const ink = luminance(darkest) < 0.08 ? darkest : "#1d1a16";
  return { accent, background, ink, accent2 };
}
