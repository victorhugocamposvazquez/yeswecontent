import { NextResponse } from "next/server";
import { z } from "zod";
import { isPublicHttpUrl, requireUser } from "@/lib/panel/auth";
import { analyzeSite } from "@/lib/panel/generate";

export const maxDuration = 60;

/** POST { url } → datos del negocio deducidos de su página de inicio. */
export async function POST(req: Request) {
  const { error } = await requireUser();
  if (error) return error;
  const body = z.object({ url: z.string().min(3) }).safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Indica una URL." }, { status: 400 });
  const url = isPublicHttpUrl(body.data.url);
  if (!url) return NextResponse.json({ error: "Esa dirección no parece una web pública." }, { status: 400 });
  const result = await analyzeSite(url);
  return NextResponse.json(result);
}
