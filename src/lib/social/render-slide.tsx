import "server-only";
import { ImageResponse } from "next/og";
import type { SlideParams } from "./slides";

const THEMES = [
  { bg: "#ff4f1f", fg: "#ffffff" },
  { bg: "#ffffff", fg: "#15130f" },
  { bg: "#c8f03c", fg: "#15130f" },
  { bg: "#15130f", fg: "#ffffff" },
];

/** Renderiza una diapositiva de carrusel (PNG 1080×1080). */
export function renderSlide({ text, brand, index, total }: SlideParams): ImageResponse {
  const last = index === total - 1;
  const theme = THEMES[index === 0 ? 0 : last ? 3 : (index % 2) + 1];
  const size = index === 0 ? (text.length > 90 ? 72 : 92) : text.length > 140 ? 54 : 68;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: theme.bg,
          color: theme.fg,
          padding: 88,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, letterSpacing: 6, textTransform: "uppercase", opacity: 0.75 }}>
          <span>{brand}</span>
          <span>
            {index + 1}/{total}
          </span>
        </div>
        <div style={{ display: "flex", fontSize: size, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2 }}>{text}</div>
        <div style={{ display: "flex", fontSize: 30, opacity: 0.75 }}>{last ? "Guárdalo · Compártelo" : "Desliza →"}</div>
      </div>
    ),
    { width: 1080, height: 1080, headers: { "cache-control": "public, max-age=31536000, immutable" } },
  );
}
