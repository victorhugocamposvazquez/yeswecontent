"use server";

import { z } from "zod";
import { recordLead } from "@/lib/marketing/leads";

export interface ContactState {
  ok?: boolean;
  error?: string;
}

const schema = z.object({
  name: z.string().trim().min(2, "Dinos cómo te llamas.").max(120),
  email: z.string().trim().email("Ese email no parece válido.").max(254),
  agency: z.string().trim().max(160).optional(),
  website: z.string().trim().max(300).optional(),
  clients: z.string().trim().max(20).optional(),
  message: z.string().trim().max(2000).optional(),
});

export async function requestAgencyCall(_: ContactState, form: FormData): Promise<ContactState> {
  // Campo trampa para bots
  if (form.get("company_fax")) return { ok: true };
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa el formulario." };
  const d = parsed.data;
  const note = [d.name, d.agency, d.clients ? `${d.clients} clientes` : null, d.message].filter(Boolean).join(" · ");
  await recordLead({ tool: "agencias", email: d.email, url: d.website || note.slice(0, 500) });
  return { ok: true };
}
