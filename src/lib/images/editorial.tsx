/**
 * Portada editorial de marca renderizada con next/og (sin claves ni servicios
 * externos). Título + paleta del sitio + formas geométricas con semilla.
 */
import { ImageResponse } from "next/og";
import { parsePalette } from "./palette";

export type Aspect = "16:9" | "4:3" | "1:1";
export type EditorialKind = "cover" | "inline";

export const EDITORIAL_SIZES: Record<Aspect, { width: number; height: number }> = {
  "16:9": { width: 1200, height: 675 },
  "4:3": { width: 1200, height: 900 },
  "1:1": { width: 1080, height: 1080 },
};

export interface EditorialInput {
  title: string;
  kicker?: string;
  siteName?: string;
  palette?: string | null;
  kind?: EditorialKind;
  aspect?: Aspect;
  seed?: string;
}

/** Hash FNV-1a → generador pseudoaleatorio estable. */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function editorialImage(input: EditorialInput): ImageResponse {
  const { width, height } = EDITORIAL_SIZES[input.aspect ?? "16:9"];
  const p = parsePalette(input.palette);
  const r = rng(`${input.title}|${input.seed ?? ""}|${input.kind ?? "cover"}`);
  const isCover = (input.kind ?? "cover") === "cover";
  const title = input.title.length > 110 ? `${input.title.slice(0, 107)}…` : input.title;
  const fontSize = isCover ? (title.length > 70 ? 54 : title.length > 40 ? 64 : 76) : title.length > 60 ? 46 : 56;
  const variant = Math.floor(r() * 3);
  const big = Math.round(height * (0.7 + r() * 0.35));
  const small = Math.round(height * (0.22 + r() * 0.15));

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: p.background, color: p.ink, fontFamily: "sans-serif", overflow: "hidden" }}>
        {/* Formas */}
        {variant === 0 && <div style={{ position: "absolute", right: -big * 0.25, top: -big * 0.15, width: big, height: big, borderRadius: big, background: p.accent, display: "flex" }} />}
        {variant === 1 && <div style={{ position: "absolute", right: width * 0.06, bottom: 0, width: big * 0.62, height: big, borderTopLeftRadius: big, borderTopRightRadius: big, background: p.accent, display: "flex" }} />}
        {variant === 2 && <div style={{ position: "absolute", right: 0, top: 0, width: width * 0.38, height: "100%", background: p.accent, display: "flex" }} />}
        <div style={{ position: "absolute", right: width * (0.08 + r() * 0.2), bottom: height * (0.08 + r() * 0.25), width: small, height: small, borderRadius: small, background: p.accent2, display: "flex" }} />
        <div style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: 12, background: p.ink, display: "flex" }} />

        {/* Texto */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: isCover ? 72 : 60, width: "62%", height: "100%", position: "relative" }}>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, textTransform: "uppercase", fontWeight: 700, color: p.ink, opacity: 0.75 }}>{input.kicker ?? (isCover ? "Guía" : "En detalle")}</div>
          <div style={{ display: "flex", fontSize, lineHeight: 1.06, letterSpacing: -1.5, fontWeight: 700, color: p.ink, background: variant === 2 ? p.background : "transparent", padding: variant === 2 ? "8px 0" : 0 }}>{title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, fontWeight: 600 }}>
            <div style={{ width: 18, height: 18, borderRadius: 18, background: p.accent, display: "flex" }} />
            {input.siteName ?? ""}
          </div>
        </div>
      </div>
    ),
    { width, height },
  );
}

export async function editorialBytes(input: EditorialInput): Promise<Uint8Array> {
  return new Uint8Array(await editorialImage(input).arrayBuffer());
}
