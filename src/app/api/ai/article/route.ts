import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSite, listContentItems } from "@/lib/data";
import { isDemo } from "@/lib/env";
import { listInternalCandidates } from "@/lib/links";
import { requireUser } from "@/lib/panel/auth";
import { generateArticleWithEngine } from "@/lib/panel/generate";

export const maxDuration = 300;

const input = z.object({
  content_item_id: z.string().optional(),
  title: z.string().optional(),
  keyword: z.string().optional(),
  intent: z.enum(["informational", "commercial", "transactional", "navigational"]).nullable().optional(),
  cluster: z.string().nullable().optional(),
  /** Generar también portada e imágenes (por defecto solo en demo, donde no cuesta nada). */
  images: z.boolean().optional(),
});

/**
 * POST { content_item_id } o { title, keyword } → artículo en Markdown con meta,
 * FAQ, JSON-LD y puntuación de calidad, usando la voz de marca del sitio activo.
 */
export async function POST(req: Request) {
  const { error } = await requireUser();
  if (error) return error;
  const parsed = input.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });
  const site = await getCurrentSite();
  if (!site) return NextResponse.json({ error: "No hay ningún sitio activo." }, { status: 404 });

  let item = parsed.data.title && parsed.data.keyword
    ? { title: parsed.data.title, keyword: parsed.data.keyword, intent: parsed.data.intent ?? null, cluster: parsed.data.cluster ?? null }
    : null;
  if (!item && parsed.data.content_item_id) {
    const found = (await listContentItems(site.id)).find((c) => c.id === parsed.data.content_item_id);
    if (found) item = found;
  }
  if (!item) return NextResponse.json({ error: "Indica un tema del plan o un título y una palabra clave." }, { status: 400 });

  // Vista previa del motor completo. Los enlaces de la red solo se simulan en demo:
  // fuera de demo se insertan y registran al guardar el artículo (writeNow).
  const article = await generateArticleWithEngine(item, site, {
    internalCandidates: await listInternalCandidates(site.id),
    images: parsed.data.images ?? isDemo,
    backlinks: isDemo,
  });
  return NextResponse.json(article);
}
