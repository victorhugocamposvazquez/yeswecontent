/** Registro opcional de leads (herramientas, agencias). En modo demo no hace nada. */
import "server-only";
import { isDemo } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";

export async function recordLead(lead: { tool: string; url?: string | null; email?: string | null }) {
  if (isDemo || !process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
  try {
    const { error } = await createServiceClient()
      .from("leads")
      .insert({ tool: lead.tool.slice(0, 60), url: lead.url?.slice(0, 2048) ?? null, email: lead.email?.slice(0, 254) ?? null });
    return !error;
  } catch {
    return false;
  }
}
