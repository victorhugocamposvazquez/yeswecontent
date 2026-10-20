import { editorialImage, type Aspect } from "@/lib/images/editorial";
import { infographicSvg } from "@/lib/images/infographic";

export const runtime = "nodejs";

const cap = (v: string | null, n: number) => (v ?? "").slice(0, n);

/**
 * GET /api/images/render?kind=cover|inline|infographic&title=…&palette=…&site=…&seed=…&items=a|b|c
 * Dibuja la portada editorial (PNG) o la infografía (SVG) sin servicios externos.
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const kind = sp.get("kind") ?? "cover";
  const title = cap(sp.get("title"), 140) || "Artículo";
  const palette = cap(sp.get("palette"), 80);
  const site = cap(sp.get("site"), 60);
  const headers = { "cache-control": "public, max-age=31536000, immutable" };

  if (kind === "infographic") {
    const items = cap(sp.get("items"), 1200)
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 7);
    const svg = infographicSvg({ title, items: items.length ? items : ["Sin datos"] }, { palette, siteName: site });
    return new Response(svg, { headers: { ...headers, "content-type": "image/svg+xml; charset=utf-8", "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'" } });
  }

  const aspect = (["16:9", "4:3", "1:1"].includes(sp.get("aspect") ?? "") ? sp.get("aspect") : "16:9") as Aspect;
  const img = editorialImage({ title, kicker: cap(sp.get("kicker"), 40) || undefined, siteName: site, palette, kind: kind === "inline" ? "inline" : "cover", aspect, seed: cap(sp.get("seed"), 24) });
  return new Response(img.body, { headers: { ...headers, "content-type": "image/png" } });
}
