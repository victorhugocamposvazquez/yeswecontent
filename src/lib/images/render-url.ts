/**
 * URL de la ruta pública /api/images/render, que dibuja al vuelo la portada
 * editorial o la infografía. Se usa en modo demo y como respaldo si Storage falla.
 */
export interface RenderParams {
  kind: "cover" | "inline" | "infographic";
  title: string;
  kicker?: string;
  site?: string;
  palette?: string | null;
  seed?: string;
  items?: string[];
}

export function renderUrl(p: RenderParams): string {
  const q = new URLSearchParams();
  q.set("kind", p.kind);
  q.set("title", p.title.slice(0, 140));
  if (p.kicker) q.set("kicker", p.kicker.slice(0, 40));
  if (p.site) q.set("site", p.site.slice(0, 60));
  if (p.palette) q.set("palette", p.palette.slice(0, 80));
  if (p.seed) q.set("seed", p.seed.slice(0, 24));
  if (p.items?.length) q.set("items", p.items.slice(0, 7).map((i) => i.replace(/\|/g, "/").slice(0, 140)).join("|"));
  return `/api/images/render?${q.toString()}`;
}
