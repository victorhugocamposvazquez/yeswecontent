import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isDemo } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/** Ajustes globales que gestiona el admin (tabla public.app_settings, clave "global"). */
export interface GlobalSettings {
  ai_provider?: string;
  ai_model?: string;
  generation_enabled?: boolean;
  maintenance_banner?: string;
}

export async function getGlobalSettings(client?: SupabaseClient): Promise<GlobalSettings> {
  if (isDemo) return {};
  try {
    const sb = client ?? (await createClient());
    const { data, error } = await sb.from("app_settings").select("value").eq("key", "global").maybeSingle();
    if (error || !data) return {};
    return (data.value ?? {}) as GlobalSettings;
  } catch {
    return {}; // La tabla puede no existir todavía.
  }
}
