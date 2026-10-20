import "server-only";
import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/env";

/** Vuelve a una ruta interna con el resultado del flujo (?oauth=google&estado=ok|error&motivo=…). */
export function backTo(path: string, provider: string, estado: "ok" | "error", motivo?: string) {
  const url = new URL(path, siteUrl);
  url.searchParams.set("oauth", provider);
  url.searchParams.set("estado", estado);
  if (motivo) url.searchParams.set("motivo", motivo.slice(0, 180));
  return NextResponse.redirect(url, { status: 303 });
}
