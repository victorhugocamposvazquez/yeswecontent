/**
 * Red de intercambio de enlaces. Al generar un artículo (o antes de publicarlo)
 * elige 1–2 páginas de OTRAS webs de la red temáticamente afines y escribe un
 * enlace contextual dentro de un párrafo real. Respeta:
 *  - la participación (seo_settings.backlinks.opt_in) de ambas webs,
 *  - los anchors preferidos y los dominios excluidos de cada web,
 *  - los dominios vetados por el admin (app_settings 'banned_domains'),
 *  - el DR mínimo que pide quien recibe el enlace,
 *  - el libro de créditos (+1 por enlace dado, −1 por enlace recibido) y el
 *    cupo mensual del plan (plans.backlink_credits),
 *  - nunca enlaces recíprocos directos.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasClaude, isDemo } from "@/lib/env";
import { askClaudeJSON } from "@/lib/panel/claude";
import { languageLabel } from "@/lib/panel/prompts";
import { createServiceClient } from "@/lib/supabase/server";
import type { BacklinkPrefs, Site } from "@/lib/types";
import { demoNetworkPages, demoNetworkSites } from "./demo-network";
import { insertContextualLink, partnerSentence } from "./insert";
import { articleVector, cosine, sharedTerms, vector } from "./relevance";
import { WELCOME_CREDITS, type BacklinkPlacement, type NetworkPage, type NetworkSite } from "./types";

type DB = SupabaseClient;

export const domainOf = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return u.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();
  }
};
const prefsOf = (s: Pick<Site, "seo_settings">): BacklinkPrefs => (s.seo_settings?.backlinks ?? {}) as BacklinkPrefs;
const splitAnchors = (s?: string) =>
  (s ?? "")
    .split(/[,\n;]/)
    .map((x) => x.trim())
    .filter((x) => x.length >= 3 && x.split(/\s+/).length <= 7);
const domainIn = (d: string, list: string[]) => list.some((x) => d === x || d.endsWith(`.${x}`));
const monthStart = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
};

/** Cliente con service role: la red necesita leer webs de otros clientes. */
export const networkDb = (): DB | null => (!isDemo && process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : null);

export async function readBannedDomains(db: DB | null): Promise<string[]> {
  if (!db) return isDemo ? ["granjadeenlaces.xyz", "seo-barato.top"] : [];
  const { data } = await db.from("app_settings").select("value").eq("key", "banned_domains").maybeSingle();
  return Array.isArray(data?.value) ? (data.value as string[]).map((d) => d.toLowerCase()) : [];
}

/** Saldos por web (suma del libro; sin movimientos = créditos de bienvenida). */
export async function readBalances(db: DB, siteIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!siteIds.length) return out;
  const { data } = await db.from("backlink_credits").select("site_id, delta").in("site_id", siteIds);
  const seen = new Set<string>();
  for (const r of data ?? []) {
    seen.add(r.site_id);
    out.set(r.site_id, (out.get(r.site_id) ?? 0) + (r.delta as number));
  }
  for (const id of siteIds) if (!seen.has(id)) out.set(id, WELCOME_CREDITS);
  return out;
}

interface Network {
  sites: NetworkSite[];
  pages: NetworkPage[];
  banned: string[];
  /** Webs que ya enlazan a la de origen (para no devolver el enlace directamente). */
  linksToSource: Set<string>;
  /** Enlaces previos de la de origen a cada web. */
  givenTo: Map<string, number>;
}

async function loadNetwork(db: DB | null, source: Site): Promise<Network> {
  if (!db) {
    return {
      sites: demoNetworkSites.filter((s) => s.id !== source.id && domainOf(s.url) !== domainOf(source.url)),
      pages: demoNetworkPages,
      banned: await readBannedDomains(null),
      linksToSource: new Set(["n_cocina"]), // cocinadetemporada.com ya nos enlaza (demo)
      givenTo: new Map([["n_huerto", 1]]),
    };
  }
  const [{ data: sites }, { data: subs }, banned, { data: prior }] = await Promise.all([
    db.from("sites").select("id, url, name, niche, description, language, seo_settings, domain_rating, workspace_id").neq("id", source.id).limit(2000),
    db.from("subscriptions").select("site_id, status, plans(backlink_credits)").in("status", ["active", "trialing"]),
    readBannedDomains(db),
    db.from("backlink_links").select("source_site_id, target_site_id, status").or(`source_site_id.eq.${source.id},target_site_id.eq.${source.id}`).in("status", ["pending", "live"]),
  ]);
  const caps = new Map<string, number>();
  for (const s of subs ?? []) {
    const plan = (Array.isArray(s.plans) ? s.plans[0] : s.plans) as { backlink_credits?: number } | null;
    caps.set(s.site_id, Math.max(caps.get(s.site_id) ?? 0, plan?.backlink_credits ?? 0));
  }
  const sourceDomain = domainOf(source.url);
  const members = (sites ?? []).filter((s) => caps.has(s.id) && domainOf(s.url) !== sourceDomain);
  const ids = members.map((s) => s.id);
  const [balances, { data: monthly }, { data: articles }] = await Promise.all([
    readBalances(db, ids),
    ids.length ? db.from("backlink_links").select("target_site_id").in("target_site_id", ids).in("status", ["pending", "live"]).gte("created_at", monthStart()) : Promise.resolve({ data: [] as { target_site_id: string }[] }),
    ids.length
      ? db.from("articles").select("site_id, title, published_url, content_items(keyword, cluster)").in("site_id", ids).eq("status", "published").not("published_url", "is", null).order("published_at", { ascending: false }).limit(1500)
      : Promise.resolve({ data: [] as { site_id: string; title: string; published_url: string | null; content_items: unknown }[] }),
  ]);
  const received = new Map<string, number>();
  for (const r of monthly ?? []) received.set(r.target_site_id, (received.get(r.target_site_id) ?? 0) + 1);

  const netSites: NetworkSite[] = members.map((s) => ({
    id: s.id,
    url: s.url,
    name: s.name,
    niche: s.niche,
    description: s.description,
    language: s.language,
    domain_rating: s.domain_rating ?? null,
    prefs: prefsOf(s as Site),
    balance: balances.get(s.id) ?? 0,
    monthly_cap: caps.get(s.id) ?? 0,
    received_this_month: received.get(s.id) ?? 0,
    workspace_id: s.workspace_id,
  }));
  const pages: NetworkPage[] = (articles ?? []).map((a) => {
    const ci = (Array.isArray(a.content_items) ? a.content_items[0] : a.content_items) as { keyword?: string; cluster?: string } | null;
    return { site_id: a.site_id, url: a.published_url!, title: a.title, keyword: ci?.keyword ?? null, cluster: ci?.cluster ?? null };
  });
  // La portada de cada web también es un destino válido.
  for (const s of netSites) pages.push({ site_id: s.id, url: s.url, title: s.name, keyword: s.niche, cluster: null });

  const linksToSource = new Set<string>();
  const givenTo = new Map<string, number>();
  for (const l of prior ?? []) {
    if (l.target_site_id === source.id) linksToSource.add(l.source_site_id);
    if (l.source_site_id === source.id) givenTo.set(l.target_site_id, (givenTo.get(l.target_site_id) ?? 0) + 1);
  }
  return { sites: netSites, pages, banned, linksToSource, givenTo };
}

/** ¿Puede esta web recibir un enlace de la de origen? Devuelve el motivo si no. */
export function eligibility(target: NetworkSite, source: Pick<Site, "url" | "language" | "domain_rating" | "seo_settings" | "workspace_id">, net: Pick<Network, "banned" | "linksToSource" | "givenTo">): string | null {
  const td = domainOf(target.url);
  const sd = domainOf(source.url);
  const sp = prefsOf(source);
  if (target.prefs.opt_in === false) return "no participa";
  if (target.workspace_id === source.workspace_id) return "misma cuenta";
  if (target.language !== source.language) return "otro idioma";
  if (domainIn(td, net.banned)) return "dominio vetado";
  if ((target.prefs.exclude ?? []).map((d) => d.toLowerCase()).some((d) => domainIn(sd, [domainOf(d)]))) return "nos excluye";
  if ((sp.exclude ?? []).map((d) => d.toLowerCase()).some((d) => domainIn(td, [domainOf(d)]))) return "excluido por ti";
  const minDr = target.prefs.min_dr ?? 0;
  if (source.domain_rating != null && source.domain_rating < minDr) return "DR insuficiente";
  if (target.balance < 1) return "sin créditos";
  if (target.monthly_cap > 0 && target.received_this_month >= target.monthly_cap) return "cupo mensual agotado";
  if (target.monthly_cap <= 0) return "plan sin créditos";
  if (net.linksToSource.has(target.id)) return "recíproco";
  if ((net.givenTo.get(target.id) ?? 0) >= 3) return "ya enlazado";
  return null;
}

async function claudeSentence(source: Site, paragraph: string, anchor: string, url: string, target: NetworkSite, page: NetworkPage): Promise<string | null> {
  try {
    const raw = await askClaudeJSON<{ sentence?: string }>({
      system: "Eres editor SEO. Respondes solo con JSON válido.",
      prompt: `Escribe UNA frase en ${languageLabel(source.language)} que continúe de forma natural este párrafo de un artículo de ${source.name} e incluya exactamente este enlace en Markdown: [${anchor}](${url})

Párrafo:
"""${paragraph.slice(0, 1500)}"""

Página enlazada: «${page.title}» de ${target.name} (${target.niche ?? "—"}).

Reglas:
- Aporta información útil al lector; nada de "haz clic aquí" ni lenguaje publicitario.
- Máximo 35 palabras. El enlace aparece una sola vez, con ese texto de anclaje (solo puedes ajustar mayúsculas o una concordancia mínima).
- No menciones que es un enlace patrocinado ni añadas otros enlaces.

Devuelve: {"sentence": string}`,
      maxTokens: 300,
    });
    const s = (raw.sentence ?? "").trim();
    const links = s.match(/\]\(/g)?.length ?? 0;
    const words = s.split(/\s+/).length;
    if (links === 1 && s.includes(`](${url})`) && words <= 45 && words >= 6) return s;
  } catch {
    // Frase de respaldo.
  }
  return null;
}

export interface PlanResult {
  body_md: string;
  placements: BacklinkPlacement[];
  /** Por qué se descartaron webs (para depurar o mostrar). */
  skipped: { domain: string; reason: string }[];
}

/**
 * Elige destinos e inserta los enlaces en el texto. No escribe en la base de
 * datos: llama a commitBacklinks() cuando el artículo ya tenga id.
 */
export async function planBacklinks(source: Site, article: { title: string; keyword?: string | null; cluster?: string | null; body_md: string }, opts: { max?: number; db?: DB | null } = {}): Promise<PlanResult> {
  const empty: PlanResult = { body_md: article.body_md, placements: [], skipped: [] };
  if (prefsOf(source).opt_in === false) return empty;
  const db = opts.db === undefined ? networkDb() : opts.db;
  if (!db && !isDemo) return empty; // Sin service role no podemos ver la red.

  const net = await loadNetwork(db, source);
  if (domainIn(domainOf(source.url), net.banned)) return empty;

  const words = article.body_md.split(/\s+/).length;
  const max = Math.max(0, Math.min(2, opts.max ?? (words >= 900 ? 2 : 1)));
  if (!max) return empty;

  const av = articleVector(article);
  const skipped: PlanResult["skipped"] = [];
  const scored: { site: NetworkSite; page: NetworkPage; score: number; tv: ReturnType<typeof vector> }[] = [];
  for (const site of net.sites) {
    const why = eligibility(site, source, net);
    if (why) {
      skipped.push({ domain: domainOf(site.url), reason: why });
      continue;
    }
    const siteVec = vector([{ text: site.niche, weight: 2 }, { text: site.description, weight: 1 }]);
    const siteScore = cosine(av, siteVec);
    let best: (typeof scored)[number] | null = null;
    for (const page of net.pages.filter((p) => p.site_id === site.id)) {
      const tv = vector([{ text: page.title, weight: 3 }, { text: page.keyword, weight: 4 }, { text: page.cluster, weight: 1 }, { text: site.niche, weight: 1 }]);
      const score = cosine(av, tv) * 0.75 + siteScore * 0.25 - (page.url === site.url ? 0.03 : 0);
      if (!best || score > best.score) best = { site, page, score, tv };
    }
    if (best && best.score >= 0.07) scored.push(best);
    else skipped.push({ domain: domainOf(site.url), reason: "poco relacionada" });
  }
  scored.sort((a, b) => b.score - a.score);

  let body = article.body_md;
  const placements: BacklinkPlacement[] = [];
  for (const cand of scored) {
    if (placements.length >= max) break;
    const { site, page, tv } = cand;
    // Anchor: el preferido de la web destino que más encaja con el artículo y la página.
    const both = new Map([...av, ...tv]);
    const prefs = splitAnchors(site.prefs.anchors)
      .map((a) => ({ a, s: cosine(vector([{ text: a, weight: 1 }]), both) }))
      .sort((x, y) => y.s - x.s);
    const anchor = prefs[0]?.s > 0 ? prefs[0].a : page.keyword && page.keyword.split(/\s+/).length <= 6 ? page.keyword : page.title.split(/[:—–-]/)[0].trim();
    const useClaude = hasClaude && !isDemo;
    const res = await insertContextualLink(body, {
      url: page.url,
      targetVector: tv,
      phrase: anchor,
      sentence: async (paragraph) => (useClaude ? await claudeSentence(source, paragraph, anchor, page.url, site, page) : null) ?? partnerSentence(anchor, page.url, site.name),
    });
    if (!res) continue;
    body = res.body_md;
    placements.push({
      target_site_id: site.id,
      target_url: page.url,
      target_title: page.title,
      partner_domain: domainOf(site.url),
      anchor: res.anchor,
      domain_rating: source.domain_rating ?? null,
      relevance: Math.round(cand.score * 100) / 100,
      shared_terms: sharedTerms(av, tv),
    });
  }
  return { body_md: body, placements, skipped };
}

async function ensureWelcome(db: DB, siteIds: string[]) {
  const { data } = await db.from("backlink_credits").select("site_id").in("site_id", siteIds);
  const has = new Set((data ?? []).map((r) => r.site_id));
  const rows = siteIds.filter((id) => !has.has(id)).map((site_id) => ({ site_id, delta: WELCOME_CREDITS, reason: "welcome", note: "Créditos de bienvenida a la red" }));
  if (rows.length) await db.from("backlink_credits").insert(rows);
}

/**
 * Registra los enlaces insertados (estado 'pending') y los movimientos de
 * créditos. Los pendientes anteriores del mismo artículo se retiran (y el
 * trigger de la base de datos devuelve sus créditos).
 */
export async function commitBacklinks(articleId: string, sourceSiteId: string, placements: BacklinkPlacement[], db: DB | null = networkDb()): Promise<number> {
  if (!db) return 0;
  await db.from("backlink_links").update({ status: "removed" }).eq("source_article_id", articleId).eq("status", "pending");
  if (!placements.length) return 0;
  await ensureWelcome(db, [sourceSiteId, ...placements.map((p) => p.target_site_id)]);
  let n = 0;
  for (const p of placements) {
    const { data: link, error } = await db
      .from("backlink_links")
      .insert({ source_site_id: sourceSiteId, target_site_id: p.target_site_id, source_article_id: articleId, target_url: p.target_url, anchor: p.anchor, domain_rating: p.domain_rating, status: "pending" })
      .select("id")
      .single();
    if (error || !link) {
      console.warn("[links] no se pudo registrar el enlace:", error?.message);
      continue;
    }
    await db.from("backlink_credits").insert([
      { site_id: sourceSiteId, link_id: link.id, delta: 1, reason: "earned", note: `Enlace dado a ${p.partner_domain}` },
      { site_id: p.target_site_id, link_id: link.id, delta: -1, reason: "spent", note: `Enlace recibido («${p.anchor}»)` },
    ]);
    n++;
  }
  return n;
}

/** Tras publicar: los enlaces pendientes del artículo pasan a activos con su URL. */
export async function markBacklinksLive(articleId: string, url: string | null, db: DB | null = networkDb()): Promise<number> {
  if (!db) return 0;
  const { data, error } = await db
    .from("backlink_links")
    .update({ status: "live", source_article_url: url, live_at: new Date().toISOString() })
    .eq("source_article_id", articleId)
    .eq("status", "pending")
    .select("id");
  if (error) {
    console.warn("[links] no se pudieron activar los enlaces:", error.message);
    return 0;
  }
  return data?.length ?? 0;
}

/**
 * Antes de publicar un artículo que nunca pasó por la red (escrito a mano o
 * anterior al motor): inserta y registra sus enlaces. Devuelve el cuerpo final.
 */
export async function ensureBacklinksBeforePublish(article: { id: string; title: string; body_md: string; keyword?: string | null; cluster?: string | null }, site: Site, db: DB | null = networkDb()): Promise<string> {
  if (!db) return article.body_md;
  const { count } = await db.from("backlink_links").select("id", { count: "exact", head: true }).eq("source_article_id", article.id);
  if ((count ?? 0) > 0) return article.body_md;
  const plan = await planBacklinks(site, article, { db });
  if (!plan.placements.length) return article.body_md;
  const { error } = await db.from("articles").update({ body_md: plan.body_md, updated_at: new Date().toISOString() }).eq("id", article.id);
  if (error) return article.body_md;
  await commitBacklinks(article.id, site.id, plan.placements, db);
  return plan.body_md;
}
