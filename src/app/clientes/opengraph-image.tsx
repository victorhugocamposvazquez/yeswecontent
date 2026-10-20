import { ImageResponse } from "next/og";
import { getPortalBrand, inkFor } from "@/lib/clientes/data";

/** Imagen al compartir un enlace del portal: con la marca de la agencia. */
export const alt = "Portal de clientes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const brand = await getPortalBrand();
  const ink = inkFor(brand.color);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: brand.color,
          color: ink,
          padding: 72,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, opacity: 0.8 }}>Portal de clientes</div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 700, letterSpacing: -2 }}>{brand.name}</div>
      </div>
    ),
    size,
  );
}
