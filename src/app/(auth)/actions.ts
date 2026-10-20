"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isDemo, siteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
  message?: string;
}

/** Solo rutas internas: evita redirecciones abiertas. */
function safeNext(v: FormDataEntryValue | null, fallback: string) {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : fallback;
}

async function origin() {
  const h = await headers();
  const o = h.get("origin");
  if (o && /^https?:\/\//.test(o)) return o;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) return `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`;
  return siteUrl;
}

const callback = async (next: string) => `${await origin()}/auth/callback?next=${encodeURIComponent(next)}`;

const email = z.string().trim().toLowerCase().email("Ese email no parece válido.");
const password = z.string().min(8, "La contraseña necesita al menos 8 caracteres.").max(72, "La contraseña es demasiado larga.");

function translate(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Email o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Confirma tu email antes de entrar. Revisa tu bandeja de entrada.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Ya existe una cuenta con ese email. Prueba a entrar.";
  if (m.includes("rate limit") || m.includes("too many")) return "Demasiados intentos. Espera unos minutos.";
  if (m.includes("weak") || m.includes("password should")) return "Elige una contraseña más segura.";
  return "No hemos podido completar la operación. Inténtalo de nuevo.";
}

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const next = safeNext(form.get("next"), "/panel");
  if (isDemo) redirect(next);
  const parsed = z.object({ email, password: z.string().min(1, "Escribe tu contraseña.") }).safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const sb = await createClient();
  const { error } = await sb.auth.signInWithPassword(parsed.data);
  if (error) return { error: translate(error.message) };
  redirect(next);
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const next = safeNext(form.get("next"), "/onboarding");
  if (isDemo) redirect(next);
  const parsed = z
    .object({ name: z.string().trim().min(2, "Dinos cómo te llamas.").max(120), email, password, terms: z.literal("on", { message: "Acepta los términos para continuar." }) })
    .safeParse({ name: form.get("name"), email: form.get("email"), password: form.get("password"), terms: form.get("terms") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const sb = await createClient();
  const { data, error } = await sb.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.name }, emailRedirectTo: await callback(next) },
  });
  if (error) return { error: translate(error.message) };
  if (data.session) redirect(next);
  return { message: `Te hemos enviado un email a ${parsed.data.email}. Haz clic en el enlace para activar tu cuenta.` };
}

export async function sendMagicLink(_: AuthState, form: FormData): Promise<AuthState> {
  const next = safeNext(form.get("next"), "/panel");
  if (isDemo) redirect(next);
  const parsed = email.safeParse(form.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const sb = await createClient();
  const { error } = await sb.auth.signInWithOtp({ email: parsed.data, options: { emailRedirectTo: await callback(next), shouldCreateUser: true } });
  if (error) return { error: translate(error.message) };
  return { message: `Enlace enviado a ${parsed.data}. Ábrelo desde este mismo navegador.` };
}

export async function signInWithGoogle(form: FormData): Promise<void> {
  const next = safeNext(form.get("next"), "/panel");
  if (isDemo) redirect(next);
  const sb = await createClient();
  const { data, error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: await callback(next) } });
  if (error || !data.url) redirect(`/entrar?error=oauth`);
  redirect(data.url);
}

export async function requestReset(_: AuthState, form: FormData): Promise<AuthState> {
  if (isDemo) return { message: "Modo demo: en producción te llegaría un email con un enlace para cambiar la contraseña." };
  const parsed = email.safeParse(form.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const sb = await createClient();
  await sb.auth.resetPasswordForEmail(parsed.data, { redirectTo: await callback("/nueva-clave") });
  // Respuesta neutra: no revelamos si el email existe.
  return { message: "Si hay una cuenta con ese email, te llegará un enlace en unos minutos." };
}

export async function updatePassword(_: AuthState, form: FormData): Promise<AuthState> {
  if (isDemo) redirect("/panel");
  const parsed = z
    .object({ password, confirm: z.string() })
    .refine((d) => d.password === d.confirm, { message: "Las contraseñas no coinciden." })
    .safeParse({ password: form.get("password"), confirm: form.get("confirm") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const sb = await createClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return { error: "El enlace ha caducado. Pide uno nuevo desde «¿Olvidaste tu contraseña?»." };
  const { error } = await sb.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: translate(error.message) };
  redirect("/panel");
}
