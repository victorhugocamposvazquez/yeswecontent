import { NextResponse } from "next/server";
import { z } from "zod";
import { scoreArticle } from "@/lib/panel/score";

const input = z.object({
  title: z.string(),
  body_md: z.string(),
  keyword: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  schema: z.boolean().optional(),
  min_words: z.number().optional(),
  internal_links: z.number().optional(),
});

/** POST artículo → { score, breakdown, tips, word_count }. Heurístico, sin IA. */
export async function POST(req: Request) {
  const parsed = input.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });
  return NextResponse.json(scoreArticle(parsed.data));
}
