import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl.replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/panel", "/admin", "/onboarding", "/api/", "/auth/", "/nueva-clave"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
