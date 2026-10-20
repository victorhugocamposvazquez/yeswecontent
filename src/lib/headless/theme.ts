/** Tema del blog alojado a partir del estilo visual del sitio ("terracota y crema", "#0f766e"…). */
import type { HostedBlogConfig } from "./content";

export interface BlogTheme { accent: string; background: string; surface: string; text: string; muted: string; line: string; serif: boolean }

const NAMED: Record<string, string> = {
  terracota: "#b4532a", teja: "#b4532a", barro: "#9a5b3c", óxido: "#a3471f", oxido: "#a3471f",
  crema: "#faf6ef", hueso: "#f7f3ea", marfil: "#fbf8f1", arena: "#efe6d6", beige: "#f1e9dc", blanco: "#ffffff",
  negro: "#111111", carbón: "#1f1f1f", carbon: "#1f1f1f", grafito: "#2b2b2b", gris: "#6b7280",
  verde: "#2f6b4f", oliva: "#6b7a2f", salvia: "#7c9a7e", menta: "#3aa58a", bosque: "#24543c",
  azul: "#1f4fbf", marino: "#1b2f5c", cielo: "#3b8fd6", turquesa: "#0e9aa7", petróleo: "#0f5463", petroleo: "#0f5463",
  rojo: "#c02f2f", granate: "#7f1d2d", coral: "#e5634d", rosa: "#d9467a", naranja: "#e8692b", mostaza: "#c9971c",
  amarillo: "#d9a400", dorado: "#b8892c", morado: "#6d3fb8", lavanda: "#8b7bd8", violeta: "#6d3fb8", chocolate: "#5b3a29",
};

const LIGHT = new Set(["crema", "hueso", "marfil", "arena", "beige", "blanco"]);

const luminance = (hex: string) => {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const isHex = (s?: string): s is string => !!s && /^#[0-9a-f]{6}$/i.test(s);

export function blogTheme(visual: { style?: string; palette?: string } | null | undefined, hosted?: HostedBlogConfig | null): BlogTheme {
  const palette = (visual?.palette ?? "").toLowerCase();
  const words = palette.split(/[^a-záéíóúñ#0-9]+/i).filter(Boolean);
  const hexes = palette.match(/#[0-9a-f]{6}/gi) ?? [];
  const colors = words.filter((w) => NAMED[w] && !LIGHT.has(w)).map((w) => NAMED[w]);
  const lights = words.filter((w) => LIGHT.has(w)).map((w) => NAMED[w]);

  let accent = hosted?.theme?.accent ?? hexes.find((h) => luminance(h) < 0.4) ?? colors[0] ?? "#1f4fbf";
  if (!isHex(accent)) accent = "#1f4fbf";
  let background = hosted?.theme?.background ?? hexes.find((h) => luminance(h) > 0.85) ?? lights[0] ?? "#ffffff";
  if (!isHex(background)) background = "#ffffff";
  const dark = luminance(background) < 0.2;
  const text = isHex(hosted?.theme?.text) ? hosted!.theme.text! : dark ? "#f5f5f4" : "#1c1917";
  const style = (visual?.style ?? "").toLowerCase();
  const serif = hosted?.theme?.font ? hosted.theme.font === "serif" : /editorial|clásic|clasic|artesan|cálid|calid|elegan/.test(style + palette);

  return {
    accent,
    background,
    surface: dark ? "#ffffff0f" : "#ffffffcc",
    text,
    muted: dark ? "#a8a29e" : "#57534e",
    line: dark ? "#ffffff1f" : "#1c19171a",
    serif,
  };
}
