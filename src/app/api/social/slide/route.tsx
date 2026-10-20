import { renderSlide } from "@/lib/social/render-slide";
import { verifySlide } from "@/lib/social/slides";

export const runtime = "nodejs";

/**
 * Diapositiva de carrusel en PNG 1080×1080 (Instagram/Facebook la descargan por URL).
 * /api/social/slide?t=<texto>&b=<marca>&i=<índice>&n=<total>&s=<firma>
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const text = (sp.get("t") ?? "").slice(0, 280);
  const brand = (sp.get("b") ?? "").slice(0, 60);
  const index = Math.max(0, Number(sp.get("i")) || 0);
  const total = Math.max(1, Number(sp.get("n")) || 1);
  if (!text || !verifySlide({ text, brand, index, total }, sp.get("s"))) return new Response("Firma no válida", { status: 403 });
  return renderSlide({ text, brand, index, total });
}
