import { NextResponse, type NextRequest } from "next/server";
import { PREVIEW_COOKIE, getAgencyClient, getAgencyContext } from "@/lib/clientes/data";

/**
 * /clientes/previsualizar?as=<siteId>: la agencia ve el portal como ese cliente.
 * Solo owner/editor de la agencia dueña del sitio. Fija una cookie de sesión.
 */
export async function GET(req: NextRequest) {
  const as = req.nextUrl.searchParams.get("as") ?? "";
  const ctx = await getAgencyContext();
  if (ctx === "login") return NextResponse.redirect(new URL(`/entrar?next=${encodeURIComponent(`/clientes/previsualizar?as=${as}`)}`, req.url));
  if (!ctx || ctx.role === "viewer") return NextResponse.redirect(new URL("/agencia/clientes?error=permiso", req.url));
  const found = await getAgencyClient(ctx.agency.id, as);
  if (!found) return NextResponse.redirect(new URL("/agencia/clientes?error=cliente", req.url));
  const res = NextResponse.redirect(new URL("/clientes", req.url));
  res.cookies.set(PREVIEW_COOKIE, found.site.id, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 4 });
  return res;
}
