import "server-only";
import { isDemo } from "@/lib/env";
import { demoProfile } from "@/lib/demo";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export type AdminIdentity = { id: string; email: string };

/**
 * Devuelve la identidad del admin que hace la petición, o null si no lo es.
 * En modo demo siempre hay un admin ficticio.
 */
export async function getAdmin(): Promise<AdminIdentity | null> {
  if (isDemo) return { id: demoProfile.id, email: demoProfile.email };
  const sb = await createClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  const { data } = await sb.from("profiles").select("role, email").eq("id", auth.user.id).single();
  if (data?.role !== "admin") return null;
  return { id: auth.user.id, email: data.email };
}

/** Exige admin y devuelve un cliente con service role. Lanza si no es admin. */
export async function adminDb() {
  const admin = await getAdmin();
  if (!admin) throw new Error("No autorizado");
  return { admin, db: createServiceClient() };
}
