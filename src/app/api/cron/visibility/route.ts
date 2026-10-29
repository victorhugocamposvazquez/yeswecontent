import { NextResponse } from "next/server";
import { isDemo } from "@/lib/env";
import { isAuthorizedCron } from "@/lib/panel/auth";
import { runVisibilityCheck, type Brand } from "@/lib/panel/visibility";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const domainOf = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
};

/** Cron diario (05:00 UTC): pregunta cada prompt activo a los modelos y guarda ai_checks. */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (isDemo || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ ok: true, demo: true, checked: 0 });

  const sb = createServiceClient();
  const limit = Number(process.env.VISIBILITY_BATCH ?? 200);
  const { data: prompts, error } = await sb.from("ai_prompts").select("id, prompt, site_id, sites(name, url)").eq("active", true).limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const siteIds = [...new Set((prompts ?? []).map((p) => p.site_id as string))];
  const { data: comps } = siteIds.length ? await sb.from("competitors").select("site_id, url, name").in("site_id", siteIds) : { data: [] };

  let inserted = 0;
  const startedAt = Date.now();
  for (const p of prompts ?? []) {
    if (Date.now() - startedAt > 270_000) break; // margen antes del límite de la función
    const site = (Array.isArray(p.sites) ? p.sites[0] : p.sites) as { name: string; url: string } | null;
    if (!site) continue;
    const brand: Brand = {
      name: site.name,
      domain: domainOf(site.url),
      competitors: (comps ?? []).filter((c) => c.site_id === p.site_id).map((c) => ({ name: c.name ?? domainOf(c.url), domain: domainOf(c.url) })),
    };
    const results = await runVisibilityCheck(p.prompt as string, brand, undefined, { siteId: p.site_id as string, purpose: "visibility" });
    // No guardamos resultados simulados: solo los de modelos con clave configurada.
    const rows = results
      .filter((r) => !r.stubbed)
      .map((r) => ({
        prompt_id: p.id,
        model: r.model,
        mentioned: r.mentioned,
        position: r.position,
        cited_urls: r.cited_urls,
        competitors_mentioned: r.competitors_mentioned,
        answer_excerpt: r.answer_excerpt,
      }));
    if (rows.length) {
      const { error: insErr } = await sb.from("ai_checks").insert(rows);
      if (!insErr) inserted += rows.length;
    }
  }
  return NextResponse.json({ ok: true, prompts: prompts?.length ?? 0, inserted });
}
