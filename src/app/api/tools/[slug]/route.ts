import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ToolError } from "@/lib/marketing/analyze";
import { serverTools } from "@/lib/marketing/run-tools";
import { recordLead } from "@/lib/marketing/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const body = z.object({
  url: z.string().trim().min(1).max(2048),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
});

// Límite sencillo por IP (best effort, por instancia).
const hits = new Map<string, { n: number; reset: number }>();
const LIMIT = 20;
const WINDOW = 60_000;
function limited(ip: string) {
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    hits.set(ip, { n: 1, reset: now + WINDOW });
    return false;
  }
  h.n++;
  return h.n > LIMIT;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const run = serverTools[slug];
  if (!run) return NextResponse.json({ error: "Herramienta no encontrada." }, { status: 404 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anon";
  if (limited(ip)) return NextResponse.json({ error: "Has hecho muchas consultas seguidas. Espera un minuto y vuelve a probar." }, { status: 429 });

  let input: z.infer<typeof body>;
  try {
    input = body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Escribe una URL válida (y, si quieres, un email válido)." }, { status: 400 });
  }

  try {
    const result = await run(input.url);
    // Registro opcional del lead; no bloquea ni falla la respuesta.
    void recordLead({ tool: slug, url: result.url, email: input.email || null });
    return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    if (e instanceof ToolError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(`[tools/${slug}]`, e);
    return NextResponse.json({ error: "Algo ha fallado al analizar esa web. Prueba de nuevo en un momento." }, { status: 500 });
  }
}
