import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSite } from "@/lib/data";
import { requireUser } from "@/lib/panel/auth";
import { listCompetitors } from "@/lib/panel/data";
import { MODELS, runVisibilityCheck } from "@/lib/panel/visibility";

export const maxDuration = 120;

const input = z.object({
  prompt: z.string().min(3).max(500),
  models: z.array(z.enum(["chatgpt", "claude", "gemini", "perplexity"])).optional(),
  brand: z.object({ name: z.string(), domain: z.string(), competitors: z.array(z.object({ name: z.string(), domain: z.string().optional() })).default([]) }).optional(),
});

const domainOf = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
};

/**
 * POST { prompt } → por modelo: ¿menciona la marca?, posición, competidores y extracto.
 * Claude es real con ANTHROPIC_API_KEY; ChatGPT/Gemini/Perplexity con sus claves
 * (OPENAI_API_KEY, GEMINI_API_KEY, PERPLEXITY_API_KEY); sin clave → simulado (`stubbed: true`).
 */
export async function POST(req: Request) {
  const { error } = await requireUser();
  if (error) return error;
  const parsed = input.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Escribe una pregunta de entre 3 y 500 caracteres." }, { status: 400 });

  let brand = parsed.data.brand;
  let usageSite: { siteId: string; workspaceId: string } | undefined;
  if (!brand) {
    const site = await getCurrentSite();
    if (!site) return NextResponse.json({ error: "No hay ningún sitio activo." }, { status: 404 });
    const comps = await listCompetitors(site.id);
    brand = { name: site.name, domain: domainOf(site.url), competitors: comps.map((c) => ({ name: c.name ?? domainOf(c.url), domain: domainOf(c.url) })) };
    usageSite = { siteId: site.id, workspaceId: site.workspace_id };
  }
  const results = await runVisibilityCheck(parsed.data.prompt, brand, parsed.data.models ?? MODELS, usageSite ? { ...usageSite, purpose: "visibility" } : { purpose: "visibility" });
  return NextResponse.json({ prompt: parsed.data.prompt, results });
}
