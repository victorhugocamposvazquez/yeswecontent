/** Casos de éxito públicos (solo publicados). Sin cookies: apto para generación estática. */
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { isDemo } from "@/lib/env";
import { caseStudies } from "@/lib/demo";
import type { CaseStudy } from "@/lib/types";

function publicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
}

export async function listPublishedCases(): Promise<CaseStudy[]> {
  if (isDemo) return caseStudies.filter((c) => c.published);
  try {
    const { data } = await publicClient().from("case_studies").select("*").eq("published", true).order("created_at");
    return (data as CaseStudy[] | null) ?? [];
  } catch {
    return [];
  }
}

export async function getPublishedCase(slug: string): Promise<CaseStudy | null> {
  const all = await listPublishedCases();
  return all.find((c) => c.slug === slug) ?? null;
}

/** Multiplicador redondeado para titulares ("×3,9"). */
export function growth(c: CaseStudy): string | null {
  if (!c.metric_before || !c.metric_after) return null;
  return `×${(c.metric_after / c.metric_before).toLocaleString("es-ES", { maximumFractionDigits: 1 })}`;
}
