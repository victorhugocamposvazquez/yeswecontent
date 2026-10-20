import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
import { products } from "@/lib/marketing/products";
import { tools } from "@/lib/marketing/tools";
import { listPublishedCases } from "@/lib/marketing/cases";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl.replace(/\/$/, "");
  const now = new Date();
  const entry = (path: string, priority = 0.6, changeFrequency: "weekly" | "monthly" = "monthly") => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });
  const cases = await listPublishedCases();
  return [
    entry("/", 1, "weekly"),
    entry("/precios", 0.9),
    entry("/agencias", 0.8),
    entry("/herramientas", 0.8, "weekly"),
    entry("/casos", 0.7),
    entry("/blog", 0.5, "weekly"),
    entry("/afiliados", 0.4),
    entry("/registro", 0.5),
    entry("/legal/privacidad", 0.2),
    entry("/legal/terminos", 0.2),
    ...products.map((p) => entry(`/producto/${p.slug}`, 0.8)),
    ...tools.filter((t) => t.kind !== "soon").map((t) => entry(`/herramientas/${t.slug}`, t.kind === "signup" ? 0.4 : 0.7)),
    ...cases.map((c) => entry(`/casos/${c.slug}`, 0.5)),
  ];
}
