import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isDemo } from "@/lib/env";
import { HOSTED_HEADER, hostedBlogPath, normalizeHost, resolveSiteIdForHost } from "@/lib/headless/hosts";

const PRIVATE = /^\/(panel|admin|onboarding|clientes|agencia|entrar|registro)(\/|$)/;

export async function middleware(request: NextRequest) {
  // Dominios de clientes (blog.cliente.com) → blog alojado de ese sitio.
  const host = request.headers.get("host");
  const blogSiteId = await resolveSiteIdForHost(host);
  if (blogSiteId) {
    const path = hostedBlogPath(blogSiteId, request.nextUrl.pathname);
    if (!path) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = path;
    const headers = new Headers(request.headers);
    headers.set(HOSTED_HEADER, normalizeHost(host));
    return NextResponse.rewrite(url, { request: { headers } });
  }

  if (!PRIVATE.test(request.nextUrl.pathname) || isDemo) return NextResponse.next();
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/|favicon.ico|icon.svg|logos/|embed.js).*)"],
};
