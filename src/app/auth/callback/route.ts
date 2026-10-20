import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { isDemo } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const safe = (v: string | null, fallback: string) => (v && v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : fallback);

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const next = safe(url.searchParams.get("next"), "/panel");
  if (isDemo) return NextResponse.redirect(new URL(next, url.origin));

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const sb = await createClient();

  if (code) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  } else if (tokenHash && type) {
    const { error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(type === "recovery" ? "/nueva-clave" : next, url.origin));
  }
  return NextResponse.redirect(new URL("/entrar?error=enlace", url.origin));
}
