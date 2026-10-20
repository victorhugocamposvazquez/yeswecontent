import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSite, listContentItems } from "@/lib/data";
import { requireUser } from "@/lib/panel/auth";
import { generatePlan } from "@/lib/panel/generate";

export const maxDuration = 120;

const input = z.object({
  count: z.coerce.number().int().min(1).max(60).default(12),
  month: z.string().optional(),
  site: z
    .object({ name: z.string(), url: z.string(), niche: z.string().nullable().default(null), audience: z.string().nullable().default(null), description: z.string().nullable().default(null), language: z.string().default("es") })
    .optional(),
});

/** POST { count, month?, site? } → { items: [{title, keyword, cluster, intent, search_volume, difficulty}] } */
export async function POST(req: Request) {
  const { error } = await requireUser();
  if (error) return error;
  const parsed = input.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });
  const current = parsed.data.site ? null : await getCurrentSite();
  const site = parsed.data.site ?? current;
  if (!site) return NextResponse.json({ error: "No hay ningún sitio activo." }, { status: 404 });
  const existing = current ? (await listContentItems(current.id)).map((c) => c.title) : [];
  const month = parsed.data.month ?? new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(new Date());
  const result = await generatePlan(site, parsed.data.count, existing, month);
  return NextResponse.json(result);
}
