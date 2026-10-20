/**
 * Enlazado interno: añade N enlaces (sites.seo_settings.internal_links) a los
 * artículos ya publicados del propio sitio, por relevancia.
 */
import { insertContextualLink, internalSentence } from "./insert";
import { articleVector, cosine, vector } from "./relevance";

export interface InternalCandidate {
  url: string; // ruta relativa (/blog/…) o URL completa del propio sitio
  title: string;
  keyword?: string | null;
  cluster?: string | null;
}

export interface InternalLinkResult {
  body_md: string;
  inserted: { url: string; anchor: string; title: string }[];
}

const toPath = (u: string) => {
  try {
    return new URL(u).pathname;
  } catch {
    return u;
  }
};

/** Enlaces internos que ya tiene el texto (rutas relativas). */
export const existingInternal = (md: string) => [...md.matchAll(/(?<!!)\[[^\]]+\]\((\/[^)\s]*)\)/g)].map((m) => m[1]);

export async function insertInternalLinks(
  article: { title: string; keyword?: string | null; cluster?: string | null; body_md: string; slug?: string },
  candidates: InternalCandidate[],
  count = 3,
): Promise<InternalLinkResult> {
  let body = article.body_md;
  const inserted: InternalLinkResult["inserted"] = [];
  const already = new Set(existingInternal(body));
  const need = Math.max(0, count - already.size);
  if (!need || !candidates.length) return { body_md: body, inserted };

  const av = articleVector(article);
  const ranked = candidates
    .map((c) => ({ ...c, path: toPath(c.url) }))
    .filter((c) => c.path && !already.has(c.path) && (!article.slug || !c.path.endsWith(`/${article.slug}`)) && c.title !== article.title)
    .map((c) => ({ c, score: cosine(av, vector([{ text: c.title, weight: 3 }, { text: c.keyword, weight: 4 }, { text: c.cluster, weight: 2 }])) + (c.cluster && c.cluster === article.cluster ? 0.15 : 0) }))
    .sort((a, b) => b.score - a.score);

  for (const { c } of ranked) {
    if (inserted.length >= need) break;
    const target = vector([{ text: c.title, weight: 3 }, { text: c.keyword, weight: 4 }]);
    // Si la palabra clave aparece en el texto se enlaza tal cual; si no, se añade una frase con el título.
    const anchorText = c.title.replace(/[.?!]+$/, "");
    const res = await insertContextualLink(body, {
      url: c.path,
      targetVector: target,
      phrase: c.keyword,
      sentence: () => internalSentence(anchorText, c.path),
    });
    if (res) {
      body = res.body_md;
      inserted.push({ url: c.path, anchor: res.anchor, title: c.title });
    }
  }
  return { body_md: body, inserted };
}
