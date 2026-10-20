"use server";

import { revalidatePath } from "next/cache";
import { getAgencyClient, getAgencyContext, nextInvoiceNumber, type AgencyContext } from "@/lib/clientes/data";
import type { InvoiceStatus, WhiteLabel } from "@/lib/clientes/types";
import { isDemo, siteUrl } from "@/lib/env";
import { DEMO_NOTE, type ActionState } from "@/lib/panel/action-types";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const ok = (message: string): ActionState => ({ ok: true, message: isDemo ? `${message} ${DEMO_NOTE}` : message, at: Date.now() });
const fail = (message: string): ActionState => ({ ok: false, message, at: Date.now() });
const str = (fd: FormData, k: string, max = 500) => String(fd.get(k) ?? "").trim().slice(0, max);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normUrl = (raw: string) => {
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!u.hostname.includes(".")) return null;
    return `${u.protocol}//${u.hostname}`;
  } catch {
    return null;
  }
};
/** "690", "690,50" o "1.290,00" → céntimos. */
const cents = (raw: string) => {
  const clean = raw.replace(/[€\s]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = Number(clean);
  return Number.isFinite(n) && n >= 0 && n < 1_000_000 ? Math.round(n * 100) : null;
};

async function editor(): Promise<AgencyContext> {
  const ctx = await getAgencyContext();
  if (ctx === "login") throw new Error("Tu sesión ha caducado. Vuelve a entrar.");
  if (!ctx) throw new Error("Esta cuenta no pertenece a ninguna agencia.");
  if (ctx.role === "viewer") throw new Error("Tu rol en la agencia es de solo lectura.");
  return ctx;
}

async function run(fn: () => Promise<ActionState>): Promise<ActionState> {
  try {
    return await fn();
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Algo ha fallado. Inténtalo de nuevo.");
  }
}

/* ───────── alta de cliente ───────── */

export async function addAgencyClient(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const ctx = await editor();
    const name = str(fd, "name", 120);
    const url = normUrl(str(fd, "url", 300));
    const email = str(fd, "email", 200).toLowerCase();
    const price = cents(str(fd, "price") || "0");
    if (name.length < 2) return fail("Escribe el nombre del cliente.");
    if (!url) return fail("La web no parece válida. Prueba con tuempresa.es");
    if (!EMAIL.test(email)) return fail("El email del cliente no es válido.");
    if (price == null) return fail("El precio no es válido.");
    if (isDemo) return ok(`${name} añadido. Le hemos enviado la invitación a ${email}.`);
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return fail("Falta SUPABASE_SERVICE_ROLE_KEY para crear clientes e invitar.");

    const db = createServiceClient();
    const { data: site, error: siteErr } = await db
      .from("sites")
      .insert({ workspace_id: ctx.agency.id, name, url, onboarding_step: "done" })
      .select("id")
      .single();
    if (siteErr || !site) return fail("No hemos podido crear el sitio del cliente.");
    const { error: acErr } = await db.from("agency_clients").insert({
      site_id: site.id,
      agency_workspace_id: ctx.agency.id,
      client_name: name,
      client_email: email,
      price_cents: price,
      visibility_mode: str(fd, "visibility_mode") === "completo" ? "completo" : "resultados",
    });
    if (acErr) {
      await db.from("sites").delete().eq("id", site.id);
      return fail("No hemos podido guardar la ficha del cliente.");
    }

    // Invitación: crea (o reutiliza) el usuario y lo ata al sitio con rol cliente.
    let userId: string | null = null;
    const { data: inv } = await db.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/clientes`,
      data: { company: name },
    });
    if (inv?.user) userId = inv.user.id;
    else {
      const { data: prof } = await db.from("profiles").select("id").ilike("email", email).maybeSingle();
      userId = prof?.id ?? null;
    }
    if (userId) await db.from("workspace_members").upsert({ workspace_id: ctx.agency.id, user_id: userId, role: "client" }, { onConflict: "workspace_id,user_id", ignoreDuplicates: true });
    await db.from("client_site_members").insert({ site_id: site.id, user_id: userId, email, role: "admin", status: "invited" });

    revalidatePath("/agencia/clientes");
    return ok(userId ? `${name} añadido. Invitación enviada a ${email}.` : `${name} añadido, pero no pudimos enviar la invitación a ${email}.`);
  });
}

/* ───────── ajustes del cliente ───────── */

export async function saveAgencyClientSettings(siteId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const ctx = await editor();
    const price = cents(str(fd, "price"));
    if (price == null) return fail("El precio no es válido.");
    const booking = str(fd, "booking_url", 300);
    if (booking && !/^https:\/\//.test(booking)) return fail("El enlace de reserva debe empezar por https://");
    const patch = {
      visibility_mode: str(fd, "visibility_mode") === "completo" ? "completo" : "resultados",
      price_cents: price,
      booking_url: booking || null,
      client_email: str(fd, "client_email", 200).toLowerCase() || undefined,
    };
    if (patch.client_email && !EMAIL.test(patch.client_email)) return fail("El email de facturación no es válido.");
    if (isDemo) return ok("Ajustes del cliente guardados.");
    const sb = await createClient();
    const { error } = await sb.from("agency_clients").update(patch).eq("site_id", siteId).eq("agency_workspace_id", ctx.agency.id);
    if (error) return fail("No hemos podido guardar los ajustes.");
    revalidatePath(`/agencia/clientes/${siteId}`);
    revalidatePath("/agencia/clientes");
    return ok("Ajustes del cliente guardados.");
  });
}

/* ───────── facturas ───────── */

export async function createClientInvoice(siteId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const ctx = await editor();
    const found = await getAgencyClient(ctx.agency.id, siteId);
    if (!found) return fail("No encontramos ese cliente.");
    const amount = cents(str(fd, "amount"));
    if (!amount) return fail("Indica el importe de la factura.");
    const concept = str(fd, "concept", 200) || "Servicio mensual de contenidos";
    const days = Math.min(90, Math.max(0, Number(str(fd, "due_days") || 15)));
    const status: InvoiceStatus = str(fd, "status") === "sent" ? "sent" : "draft";
    const number = await nextInvoiceNumber(ctx.agency);
    if (isDemo) return ok(`Factura ${number} creada${status === "sent" ? " y enviada" : " como borrador"}.`);
    const issued = new Date();
    const sb = await createClient();
    const { error } = await sb.from("client_invoices").insert({
      workspace_id: ctx.agency.id,
      site_id: siteId,
      number,
      concept,
      amount_cents: amount,
      currency: found.client.currency,
      status,
      issued_at: issued.toISOString().slice(0, 10),
      due_at: new Date(issued.getTime() + days * 86_400_000).toISOString().slice(0, 10),
      pdf_url: str(fd, "pdf_url", 500) || null,
    });
    if (error) return fail("No hemos podido crear la factura.");
    // TODO: enviar email al cliente con el enlace a /clientes/facturas cuando status = sent.
    revalidatePath(`/agencia/clientes/${siteId}`);
    return ok(`Factura ${number} creada${status === "sent" ? " y visible para el cliente" : " como borrador"}.`);
  });
}

export async function setClientInvoiceStatus(siteId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const ctx = await editor();
    const id = str(fd, "invoice_id", 64);
    const status = str(fd, "status") as InvoiceStatus;
    if (!["draft", "sent", "paid", "void"].includes(status)) return fail("Estado no válido.");
    const label = { draft: "borrador", sent: "enviada", paid: "pagada", void: "anulada" }[status];
    if (isDemo) return ok(`Factura marcada como ${label}.`);
    const sb = await createClient();
    const { error } = await sb.from("client_invoices").update({ status }).eq("id", id).eq("site_id", siteId).eq("workspace_id", ctx.agency.id);
    if (error) return fail("No hemos podido actualizar la factura.");
    revalidatePath(`/agencia/clientes/${siteId}`);
    return ok(`Factura marcada como ${label}.`);
  });
}

/* ───────── mensajes ───────── */

export async function sendAgencyMessage(siteId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const ctx = await editor();
    const body = str(fd, "body", 4000);
    if (!body) return fail("Escribe tu respuesta.");
    if (isDemo) return ok("Respuesta enviada al cliente.");
    const sb = await createClient();
    const { error } = await sb.from("client_messages").insert({ site_id: siteId, author_id: ctx.user.id, author_name: ctx.user.name, author_side: "agency", body });
    if (error) return fail("No hemos podido enviar la respuesta.");
    revalidatePath(`/agencia/clientes/${siteId}`);
    return ok("Respuesta enviada al cliente.");
  });
}

/* ───────── marca blanca de la agencia ───────── */

export async function saveWhiteLabel(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const ctx = await editor();
    const color = str(fd, "primary_color", 7);
    if (!/^#[0-9a-f]{6}$/i.test(color)) return fail("El color debe ser un hexadecimal, por ejemplo #2f5bea.");
    const logo = str(fd, "logo_url", 500);
    if (logo && !/^https:\/\//.test(logo)) return fail("La URL del logotipo debe empezar por https://");
    const domain = str(fd, "custom_domain", 253).toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const support = str(fd, "support_email", 200).toLowerCase();
    if (support && !EMAIL.test(support)) return fail("El email de soporte no es válido.");
    const white_label: WhiteLabel = {
      ...ctx.agency.white_label,
      brand_name: str(fd, "brand_name", 80) || undefined,
      primary_color: color,
      logo_url: logo || undefined,
      custom_domain: domain || undefined,
      support_email: support || undefined,
    };
    if (isDemo) return ok("Marca blanca guardada.");
    const sb = await createClient();
    const { error } = await sb.from("workspaces").update({ white_label }).eq("id", ctx.agency.id);
    if (error) return fail("No hemos podido guardar la marca blanca.");
    revalidatePath("/agencia", "layout");
    return ok("Marca blanca guardada.");
  });
}
