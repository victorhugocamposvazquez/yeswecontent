/**
 * Imágenes de los artículos: portada, 1–3 imágenes interiores con alt text y
 * una infografía SVG opcional. Se suben a Supabase Storage (bucket `articles`);
 * en modo demo se sirven desde /api/images/render sin llamadas externas.
 */
import "server-only";
import { hasClaude, isDemo } from "@/lib/env";
import { askClaudeJSON } from "@/lib/panel/claude";
import { fromBlocks, isClosingSection, isProseParagraph, toBlocks, type Block } from "@/lib/panel/blocks";
import type { ArticleImage } from "@/lib/types";
import { extractInfographic, infographicSvg } from "./infographic";
import { claudeImagePrompt, coverSpec, inlineSpec, type ImageSite, type ImageSpec } from "./prompts";
import { generateImage, hasOpenAIImages } from "./providers";
import { renderUrl } from "./render-url";
import { absoluteUrl, fileStem, uploadArticleImage } from "./storage";

export { generateImage, hasOpenAIImages } from "./providers";
export { absoluteUrl } from "./storage";
export { renderUrl } from "./render-url";
export type { ImageSite } from "./prompts";

export interface ArticleImageInput {
  siteId: string;
  site: ImageSite;
  title: string;
  keyword: string;
  cluster?: string | null;
  slug: string;
  body_md: string;
}

export interface ArticleImagesResult {
  cover_url: string | null;
  images: ArticleImage[];
  body_md: string;
}

const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`#>]/g, "").replace(/\s+/g, " ").trim();
const mdImage = (img: Pick<ArticleImage, "alt" | "url">) => `![${img.alt.replace(/[[\]]/g, "")}](${img.url})`;

/** Elige secciones ## repartidas por el artículo (sin la introducción ni el cierre). */
function pickSections(blocks: Block[], n: number, avoid?: string) {
  const all = blocks.map((b, i) => ({ b, i })).filter(({ b }) => b.type === "heading" && b.level === 2 && !isClosingSection(b.section));
  // Evita la sección donde irá la infografía (si hay alternativas).
  const heads = avoid && all.filter(({ b }) => b.section !== avoid).length >= Math.min(n, 1) ? all.filter(({ b }) => b.section !== avoid) : all;
  if (!heads.length || n <= 0) return [];
  const pool = heads.length > n ? heads.slice(1) : heads;
  const picked = new Set<number>();
  for (let k = 0; k < Math.min(n, pool.length); k++) picked.add(Math.min(pool.length - 1, Math.floor((k * pool.length) / Math.min(n, pool.length))));
  return [...picked].map((k) => {
    const { b, i } = pool[k];
    const next = blocks.slice(i + 1).find((x) => x.type === "heading");
    const end = next ? blocks.indexOf(next) : blocks.length;
    const para = blocks.slice(i + 1, end).find((x) => x.type === "paragraph");
    return { section: b.section, context: plain(para?.raw ?? "") };
  });
}

async function refineWithClaude(a: ArticleImageInput, cover: ImageSpec, inline: ImageSpec[], sections: { section: string; context: string }[]) {
  if (!hasClaude || isDemo) return;
  try {
    const raw = await askClaudeJSON<{ cover?: { prompt?: string; alt?: string }; inline?: { prompt?: string; alt?: string }[] }>({
      prompt: claudeImagePrompt(a, sections, a.site),
      maxTokens: 1500,
    });
    if (raw.cover?.prompt) cover.prompt = `${raw.cover.prompt} No text, no letters, no logos.`;
    if (raw.cover?.alt) cover.alt = raw.cover.alt;
    raw.inline?.forEach((r, i) => {
      if (!inline[i]) return;
      if (r.prompt) inline[i].prompt = `${r.prompt} No text, no letters, no logos.`;
      if (r.alt) inline[i].alt = r.alt;
    });
  } catch {
    // Nos quedamos con las plantillas.
  }
}

/** Genera (o dibuja) una imagen y devuelve su URL pública. */
export async function materialize(a: Pick<ArticleImageInput, "siteId" | "site" | "slug">, spec: ImageSpec, seed = Date.now().toString(36)): Promise<ArticleImage> {
  const base = { kind: spec.kind, alt: spec.alt, prompt: spec.prompt, ...(spec.section ? { section: spec.section } : {}) } as const;
  const fallback = renderUrl({ kind: spec.kind, title: spec.title, kicker: spec.kicker, site: a.site.name, palette: a.site.visual_style?.palette, seed });
  if (isDemo) return { ...base, url: fallback, provider: "demo" };
  const img = await generateImage(spec.prompt, {
    aspect: spec.kind === "cover" ? "16:9" : "4:3",
    title: spec.title,
    kicker: spec.kicker,
    siteName: a.site.name,
    palette: a.site.visual_style?.palette,
    kind: spec.kind,
    seed,
  });
  const url = await uploadArticleImage(img.bytes, { siteId: a.siteId, name: `${fileStem(a.slug, spec.kind)}.${img.ext}`, contentType: img.contentType });
  if (url) return { ...base, url, provider: img.provider };
  return { ...base, url: absoluteUrl(fallback)!, provider: "editorial" };
}

/** Infografía SVG a partir de la lista o las cifras clave del artículo. */
export async function makeInfographic(a: ArticleImageInput): Promise<(ArticleImage & { anchorBlock?: string }) | null> {
  const data = extractInfographic(a.title, a.body_md);
  if (!data) return null;
  const alt = `Infografía: ${data.title.replace(/[:.]+$/, "")} — ${data.items.slice(0, 3).map((i) => i.replace(/[:.].*$/, "").toLowerCase()).join(", ")}`.slice(0, 220);
  const base = { kind: "infographic" as const, alt, provider: "infographic" as const, section: data.section || undefined, anchorBlock: data.anchorBlock };
  const fallback = renderUrl({ kind: "infographic", title: data.title, site: a.site.name, palette: a.site.visual_style?.palette, items: data.items });
  if (isDemo) return { ...base, url: fallback, provider: "demo" };
  const svg = infographicSvg(data, { palette: a.site.visual_style?.palette, siteName: a.site.name });
  const url = await uploadArticleImage(new TextEncoder().encode(svg), { siteId: a.siteId, name: `${fileStem(a.slug, "infografia")}.svg`, contentType: "image/svg+xml" });
  return { ...base, url: url ?? absoluteUrl(fallback)! };
}

/** Inserta la imagen tras el primer párrafo de su sección (o tras un bloque concreto). */
export function insertImage(md: string, img: ArticleImage, afterBlock?: string): string {
  const blocks = toBlocks(md);
  const block: Block = { type: "image", raw: mdImage(img), section: img.section ?? "" };
  let at = -1;
  if (afterBlock) at = blocks.findIndex((b) => b.raw === afterBlock);
  if (at < 0 && img.section) {
    const h = blocks.findIndex((b) => b.type === "heading" && b.section === img.section);
    if (h >= 0) {
      const nextHead = blocks.findIndex((b, i) => i > h && b.type === "heading");
      const end = nextHead < 0 ? blocks.length : nextHead;
      const para = blocks.findIndex((b, i) => i > h && i < end && b.type === "paragraph");
      at = para >= 0 ? para : h;
    }
  }
  if (at < 0) {
    // Sin sección: tras el segundo párrafo real, nunca antes de la respuesta directa.
    const paras = blocks.map((b, i) => ({ b, i })).filter(({ b }) => isProseParagraph(b));
    at = paras[1]?.i ?? paras[0]?.i ?? blocks.length - 1;
  }
  blocks.splice(at + 1, 0, block);
  return fromBlocks(blocks);
}

/** Sustituye una imagen del cuerpo (por URL) por otra. */
export function replaceImage(md: string, oldUrl: string, img: Pick<ArticleImage, "alt" | "url">): string {
  const re = new RegExp(`!\\[[^\\]]*\\]\\(${oldUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`);
  return re.test(md) ? md.replace(re, mdImage(img)) : md;
}

/** Portada + imágenes interiores + infografía, ya insertadas en el Markdown. */
export async function generateArticleImages(a: ArticleImageInput, opts: { inline?: number; infographic?: boolean } = {}): Promise<ArticleImagesResult> {
  const n = Math.max(0, Math.min(3, opts.inline ?? a.site.seo_settings?.images?.inline ?? 2));
  const wantInfographic = opts.infographic ?? a.site.seo_settings?.images?.infographic ?? true;
  // Quita imágenes generadas antes (si se regenera sobre el mismo texto).
  let body = a.body_md.replace(/^!\[[^\]]*\]\([^)\s]+\)\s*$/gm, "").replace(/\n{3,}/g, "\n\n");

  const infoSection = wantInfographic ? extractInfographic(a.title, body)?.section : undefined;
  const sections = pickSections(toBlocks(body), n, infoSection);
  const cover = coverSpec(a, a.site);
  const inline = sections.map((s) => inlineSpec(a, s.section, s.context, a.site));
  if (hasOpenAIImages()) await refineWithClaude(a, cover, inline, sections);

  const seed = Date.now().toString(36);
  const settled = await Promise.allSettled([materialize(a, cover, seed), ...inline.map((s, i) => materialize(a, s, `${seed}${i}`))]);
  const made = settled.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  const coverImg = made.find((m) => m.kind === "cover") ?? null;
  const inlineImgs = made.filter((m) => m.kind === "inline");
  for (const img of inlineImgs) body = insertImage(body, img);

  const images: ArticleImage[] = [...(coverImg ? [coverImg] : []), ...inlineImgs];
  if (wantInfographic) {
    try {
      const info = await makeInfographic({ ...a, body_md: body });
      if (info) {
        const { anchorBlock, ...img } = info;
        body = insertImage(body, img, anchorBlock);
        images.push(img);
      }
    } catch (e) {
      console.warn("[images] infografía fallida:", e instanceof Error ? e.message : e);
    }
  }
  return { cover_url: coverImg?.url ?? null, images, body_md: body };
}

/** Vuelve a generar una imagen concreta (portada, interior o infografía). */
export async function regenerateImage(a: ArticleImageInput, current: ArticleImage | null, kind: ArticleImage["kind"], section?: string): Promise<ArticleImage | null> {
  const seed = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  if (kind === "infographic") {
    const info = await makeInfographic(a);
    if (!info) return null;
    const { anchorBlock: _anchor, ...img } = info;
    void _anchor;
    return img;
  }
  if (kind === "cover") {
    const spec = coverSpec(a, a.site);
    if (current?.prompt) spec.prompt = current.prompt;
    if (current?.alt) spec.alt = current.alt;
    return materialize(a, spec, seed);
  }
  const sec = section ?? current?.section ?? pickSections(toBlocks(a.body_md), 1)[0]?.section ?? a.title;
  const ctx = pickSections(toBlocks(a.body_md), 3).find((s) => s.section === sec)?.context ?? "";
  const spec = inlineSpec(a, sec, ctx, a.site);
  if (current?.prompt) spec.prompt = current.prompt;
  if (current?.alt) spec.alt = current.alt;
  return materialize(a, spec, seed);
}
