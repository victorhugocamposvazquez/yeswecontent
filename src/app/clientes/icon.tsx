import { ImageResponse } from "next/og";
import { getPortalBrand, inkFor } from "@/lib/clientes/data";

/** Favicon de marca blanca: inicial de la agencia sobre su color (sustituye al de yeswecontent). */
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const brand = await getPortalBrand();
  const letter = (brand.name.trim()[0] ?? "·").toUpperCase();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: brand.color,
          color: inkFor(brand.color),
          borderRadius: 14,
          fontSize: 40,
          fontWeight: 700,
          fontFamily: "Arial, sans-serif",
        }}
      >
        {letter}
      </div>
    ),
    size,
  );
}
