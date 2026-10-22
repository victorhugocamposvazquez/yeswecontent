import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isDemo } from "@/lib/env";
import { HOSTED_HEADER, hostedBlogPath, normalizeHost, resolveSiteIdForBlogSlug, resolveSiteIdForHost } from "@/lib/headless/hosts";

const PRIVATE = /^\/(panel|admin|onboarding|clientes|agencia|entrar|registro)(\/|$)/;

export async function middleware(request: NextRequest) {
  // Alias que funciona sin DNS propio: /b/tienda y /b/tienda/articulo
  const pretty = request.nextUrl.pathname.match(/^\/b\/([a-z0-9][a-z0-9-]{0,40})(\/.*)?$/);
  if (pretty) {
    const siteId = await resolveSiteIdForBlogSlug(pretty[1]);
    if (siteId) {
      const path = hostedBlogPath(siteId, pretty[2] || "/");
      if (path) {
        const url = request.nextUrl.clone();
        url.pathname = path;
        const headers = new Headers(request.headers);
        headers.set("x-ywc-blog-base", `/b/${pretty[1]}`);
        return NextResponse.rewrite(url, { request: { headers } });
      }
    }
  }

  // Dominios de clientes (blog.cliente.com) y subdominios nuestros (tienda.blogs.yeswecontent.com).
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
