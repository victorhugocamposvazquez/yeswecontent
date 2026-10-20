import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isDemo } from "@/lib/env";

export async function middleware(request: NextRequest) {
  if (isDemo) return NextResponse.next();
  return updateSession(request);
}

export const config = {
  matcher: ["/panel/:path*", "/admin/:path*", "/onboarding/:path*", "/entrar", "/registro"],
};
