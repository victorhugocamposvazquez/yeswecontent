/** Implementación de las herramientas gratuitas que necesitan descargar una web. */
import "server-only";
import {
  AI_CRAWLERS,
  crawlerAccess,
  normalizeUrl,
  parseHtml,
  parseRobots,
  parseSitemap,
  safeFetch,
  ToolError,
  tryFetch,
  type FetchResult,
  type PageInfo,
  type ParsedRobots,
} from "./analyze";
import type { ToolCheck, ToolResult } from "./tools";

const scoreOf = (checks: ToolCheck[]) => {
  const rated = checks.filter((c) => c.status !== "info");
  if (!rated.length) return undefined;
  const pts = rated.reduce((a, c) => a + (c.status === "pass" ? 1 : c.status === "warn" ? 0.5 : 0), 0);
  return Math.round((pts / rated.length) * 100);
};
const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const len = (s: string | null) => (s ? [...s].length : 0);

async function loadPage(input: string): Promise<{ res: FetchResult; page: PageInfo }> {
  const res = await safeFetch(input);
  if (!res.ok) throw new ToolError(`La página respondió con un error ${res.status}.`, 422);
  if (res.contentType && !/html|xml/i.test(res.contentType)) throw new ToolError("Esa URL no devuelve una página HTML.", 422);
  return { res, page: parseHtml(res.body, res.url) };
}

async function loadRobots(origin: string): Promise<{ found: boolean; status: number | null; robots: ParsedRobots; raw: string }> {
  const r = await tryFetch(`${origin}/robots.txt`, { maxBytes: 512 * 1024 });
  if (!r || !r.ok || /html/i.test(r.contentType)) return { found: false, status: r?.status ?? null, robots: { groups: [], sitemaps: [] }, raw: "" };
  return { found: true, status: r.status, robots: parseRobots(r.body), raw: r.body };
}

/* ───────────── meta descripción ───────────── */
function metaChecks(page: PageInfo): ToolCheck[] {
  const checks: ToolCheck[] = [];
  const t = len(page.title);
  checks.push(
    !page.title
      ? { label: "Title", status: "fail", detail: "La página no tiene etiqueta <title>." }
      : t < 25 || t > 65
        ? { label: "Title", status: "warn", detail: `Tiene ${t} caracteres. Lo ideal está entre 30 y 60: «${cut(page.title, 90)}»` }
        : { label: "Title", status: "pass", detail: `${t} caracteres: «${page.title}»` },
  );
  const d = len(page.metaDescription);
  checks.push(
    !page.metaDescription
      ? { label: "Meta descripción", status: "fail", detail: "No hay meta descripción. Google improvisará un fragmento del texto." }
      : d < 70
        ? { label: "Meta descripción", status: "warn", detail: `Muy corta (${d} caracteres). Aprovecha hasta unos 155 para convencer.` }
        : d > 165
          ? { label: "Meta descripción", status: "warn", detail: `Larga (${d} caracteres). Probablemente se corte en los resultados.` }
          : { label: "Meta descripción", status: "pass", detail: `${d} caracteres, buena longitud.` },
  );
  if (page.metaDescriptionCount > 1) checks.push({ label: "Duplicados", status: "warn", detail: `Hay ${page.metaDescriptionCount} etiquetas de descripción. Deja solo una.` });
  if (page.metaDescription && page.title && page.metaDescription.trim() === page.title.trim())
    checks.push({ label: "Descripción = title", status: "warn", detail: "La descripción repite el título. Úsala para añadir información." });
  return checks;
}

async function metaDescripcion(url: string): Promise<ToolResult> {
  const { res, page } = await loadPage(url);
  const checks = metaChecks(page);
  return {
    tool: "meta-descripcion",
    url: res.url,
    score: scoreOf(checks),
    summary: page.metaDescription ? "Tu página tiene meta descripción. Mira si la longitud y el mensaje acompañan." : "A tu página le falta la meta descripción.",
    checks,
    preview: { kind: "serp", title: page.title ?? new URL(res.url).hostname, description: page.metaDescription ?? "Sin descripción: el buscador elegirá un fragmento del texto de la página.", url: res.url },
  };
}

/* ───────────── H1 ───────────── */
async function h1(url: string): Promise<ToolResult> {
  const { res, page } = await loadPage(url);
  const checks: ToolCheck[] = [];
  if (page.h1.length === 0) checks.push({ label: "Número de H1", status: "fail", detail: "No hemos encontrado ningún H1. Añade un titular principal." });
  else if (page.h1.length > 1) checks.push({ label: "Número de H1", status: "warn", detail: `Hay ${page.h1.length} H1. Lo recomendable es uno por página.` });
  else checks.push({ label: "Número de H1", status: "pass", detail: "Hay exactamente un H1." });
  page.h1.slice(0, 5).forEach((h, i) => {
    const l = len(h);
    checks.push({
      label: `H1 ${page.h1.length > 1 ? `#${i + 1}` : ""}`.trim(),
      status: l < 10 || l > 80 ? "warn" : "pass",
      detail: `«${cut(h, 120)}» (${l} caracteres)${l < 10 ? ": demasiado corto para describir la página." : l > 80 ? ": muy largo." : ""}`,
    });
  });
  if (page.h1[0] && page.title) {
    const words = (s: string) => new Set(s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").match(/[a-z0-9]{4,}/g) ?? []);
    const a = words(page.h1[0]);
    const b = words(page.title);
    const shared = [...a].filter((w) => b.has(w)).length;
    checks.push({
      label: "Coherencia con el title",
      status: shared ? "pass" : "warn",
      detail: shared ? `Comparten ${shared} palabra${shared > 1 ? "s" : ""} relevante${shared > 1 ? "s" : ""}.` : "El H1 y el title no comparten palabras clave. Revisa que hablen de lo mismo.",
    });
  }
  checks.push({ label: "Subtítulos H2", status: page.h2Count ? "pass" : "warn", detail: page.h2Count ? `${page.h2Count} H2 que estructuran el contenido.` : "No hay H2. Los subtítulos ayudan a lectores y robots." });
  return { tool: "h1", url: res.url, score: scoreOf(checks), summary: page.h1[0] ? `Titular principal: «${cut(page.h1[0], 100)}»` : "Esta página no tiene titular H1.", checks };
}

/* ───────────── Open Graph ───────────── */
async function openGraph(url: string): Promise<ToolResult> {
  const { res, page } = await loadPage(url);
  const og = page.og;
  const checks: ToolCheck[] = [];
  const need = (k: string, label: string, critical = true) =>
    checks.push(og[k] ? { label, status: "pass", detail: cut(og[k], 160) } : { label, status: critical ? "fail" : "warn", detail: `Falta og:${k}.` });
  need("title", "og:title");
  need("description", "og:description");
  need("image", "og:image");
  need("url", "og:url", false);
  need("type", "og:type", false);
  if (og.image) {
    let abs: string | null = null;
    try {
      abs = new URL(og.image, res.url).toString();
    } catch {
      abs = null;
    }
    const img = abs ? await tryFetch(abs, { method: "HEAD" }) : null;
    checks.push(
      img && img.ok
        ? { label: "Imagen accesible", status: "pass", detail: `Responde ${img.status}${img.contentType ? ` (${img.contentType.split(";")[0]})` : ""}.` }
        : { label: "Imagen accesible", status: "warn", detail: "No hemos podido descargar la imagen. Comprueba que la URL sea pública y absoluta." },
    );
    if (!/^https?:\/\//i.test(og.image)) checks.push({ label: "URL de imagen", status: "warn", detail: "og:image debería ser una URL absoluta (con https://)." });
  }
  checks.push(
    page.twitter.card
      ? { label: "twitter:card", status: "pass", detail: page.twitter.card }
      : { label: "twitter:card", status: "warn", detail: "Sin twitter:card. X usará una tarjeta pequeña o ninguna." },
  );
  const image = og.image ? (() => { try { return new URL(og.image, res.url).toString(); } catch { return undefined; } })() : undefined;
  return {
    tool: "open-graph",
    url: res.url,
    score: scoreOf(checks),
    summary: og.title && og.image ? "Tu enlace se verá con título e imagen al compartirlo." : "Al compartir tu enlace faltará información en la tarjeta.",
    checks,
    preview: {
      kind: "card",
      title: og.title ?? page.title ?? new URL(res.url).hostname,
      description: og.description ?? page.metaDescription ?? "",
      url: res.url,
      image,
      site: og.site_name ?? new URL(res.url).hostname,
    },
  };
}

/* ───────────── Canonical ───────────── */
const sameUrl = (a: string, b: string) => {
  try {
    const x = new URL(a);
    const y = new URL(b);
    const norm = (u: URL) => `${u.protocol}//${u.host.replace(/^www\./, "")}${u.pathname.replace(/\/$/, "")}${u.search}`;
    return { exact: norm(x) === norm(y) && x.host === y.host && x.protocol === y.protocol, sameHost: x.host.replace(/^www\./, "") === y.host.replace(/^www\./, "") };
  } catch {
    return { exact: false, sameHost: false };
  }
};

async function canonical(url: string): Promise<ToolResult> {
  const { res, page } = await loadPage(url);
  const checks: ToolCheck[] = [];
  if (res.redirects.length) checks.push({ label: "Redirecciones", status: "info", detail: `La URL redirige ${res.redirects.length} vez/veces hasta ${res.url}` });
  if (!page.canonical) checks.push({ label: "Etiqueta canonical", status: "warn", detail: "No hay canonical. No es obligatoria, pero ayuda a evitar duplicados." });
  else {
    const cmp = sameUrl(page.canonical, res.url);
    checks.push({ label: "Etiqueta canonical", status: "pass", detail: page.canonical });
    checks.push(
      cmp.exact
        ? { label: "Apunta a sí misma", status: "pass", detail: "La canonical coincide con la URL final." }
        : cmp.sameHost
          ? { label: "Apunta a otra URL", status: "warn", detail: "La canonical apunta a otra página del mismo sitio. Correcto si es una versión duplicada; si no, revísalo." }
          : { label: "Apunta a otro dominio", status: "fail", detail: "La canonical apunta a otro dominio: le estás cediendo la autoridad." },
    );
    if (page.canonical.startsWith("http://") && res.url.startsWith("https://")) checks.push({ label: "Protocolo", status: "warn", detail: "La canonical usa http:// en una página https://." });
  }
  if (page.canonicalCount > 1) checks.push({ label: "Duplicadas", status: "fail", detail: `Hay ${page.canonicalCount} canonicals. Google podría ignorarlas todas.` });
  if (page.robotsMeta && /noindex/i.test(page.robotsMeta)) checks.push({ label: "Meta robots", status: "fail", detail: `La página tiene «${page.robotsMeta}»: no se indexará.` });
  else checks.push({ label: "Meta robots", status: "pass", detail: page.robotsMeta ? `«${page.robotsMeta}»` : "Sin restricciones de indexación." });
  return { tool: "canonical", url: res.url, score: scoreOf(checks), summary: page.canonical ? `Canonical: ${page.canonical}` : "Esta página no declara canonical.", checks };
}

/* ───────────── robots.txt ───────────── */
async function robotsTxt(url: string): Promise<ToolResult> {
  const origin = normalizeUrl(url).origin;
  const { found, status, robots, raw } = await loadRobots(origin);
  const checks: ToolCheck[] = [];
  const rows: string[][] = [];
  if (!found) {
    checks.push({ label: "Archivo robots.txt", status: "warn", detail: `No hemos encontrado ${origin}/robots.txt${status ? ` (respuesta ${status})` : ""}. Sin archivo, todos los robots pueden entrar.` });
  } else {
    checks.push({ label: "Archivo robots.txt", status: "pass", detail: `Encontrado, ${raw.split(/\r?\n/).length} líneas y ${robots.groups.length} grupos de reglas.` });
  }
  const all = crawlerAccess(robots, "*");
  if (found && all.access === "blocked") checks.push({ label: "Bloqueo general", status: "fail", detail: "La regla «User-agent: * / Disallow: /» bloquea a todos los robots, incluido Google." });
  let blocked = 0;
  for (const c of AI_CRAWLERS) {
    const a = crawlerAccess(robots, c.agent);
    if (a.access === "blocked") blocked++;
    rows.push([c.agent, c.owner, c.purpose, a.access === "allowed" ? "Permitido" : a.access === "partial" ? "Parcial" : "Bloqueado", a.group]);
  }
  checks.push({
    label: "Rastreadores de IA",
    status: blocked === 0 ? "pass" : blocked === AI_CRAWLERS.length ? "fail" : "warn",
    detail:
      blocked === 0
        ? "Ningún rastreador de IA está bloqueado por completo."
        : `${blocked} de ${AI_CRAWLERS.length} rastreadores de IA están bloqueados. Puede ser intencionado, pero esos asistentes no leerán tu web.`,
  });
  const search = ["OAI-SearchBot", "PerplexityBot", "Claude-User", "ChatGPT-User"].filter((a) => crawlerAccess(robots, a).access === "blocked");
  if (search.length) checks.push({ label: "Búsqueda en vivo", status: "warn", detail: `Bloqueas a ${search.join(", ")}, que se usan para responder en tiempo real y citar fuentes.` });
  checks.push(
    robots.sitemaps.length
      ? { label: "Sitemaps declarados", status: "pass", detail: robots.sitemaps.slice(0, 5).join(" · ") }
      : { label: "Sitemaps declarados", status: "warn", detail: "No declaras ningún sitemap. Añade una línea «Sitemap: https://…/sitemap.xml»." },
  );
  return {
    tool: "robots-txt",
    url: `${origin}/robots.txt`,
    score: scoreOf(checks),
    summary: blocked ? `Bloqueas a ${blocked} rastreador${blocked > 1 ? "es" : ""} de IA.` : "Los rastreadores de IA pueden leer tu web.",
    checks,
    table: { caption: "Acceso de los rastreadores de IA", head: ["Robot", "Empresa", "Para qué", "Acceso", "Regla aplicada"], rows },
  };
}

/* ───────────── Sitemap ───────────── */
async function findSitemap(origin: string, robots?: ParsedRobots) {
  const candidates = [...(robots?.sitemaps ?? []), `${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`, `${origin}/sitemap-index.xml`];
  for (const c of [...new Set(candidates)].slice(0, 5)) {
    const r = await tryFetch(c);
    if (r && r.ok && /<(urlset|sitemapindex)\b/i.test(r.body)) return { url: r.url, body: r.body, truncated: r.truncated };
  }
  return null;
}

async function sitemap(url: string): Promise<ToolResult> {
  const origin = normalizeUrl(url).origin;
  const { robots } = await loadRobots(origin);
  const sm = await findSitemap(origin, robots);
  const checks: ToolCheck[] = [];
  if (!sm) {
    checks.push({ label: "Sitemap", status: "fail", detail: "No lo hemos encontrado ni en robots.txt ni en las rutas habituales (/sitemap.xml, /sitemap_index.xml)." });
    return { tool: "sitemap", url: origin, score: 0, summary: "No hemos encontrado tu sitemap.", checks };
  }
  checks.push({ label: "Sitemap", status: "pass", detail: `Encontrado en ${sm.url}` });
  checks.push(
    robots.sitemaps.length
      ? { label: "Declarado en robots.txt", status: "pass", detail: "Sí, los buscadores lo encuentran solos." }
      : { label: "Declarado en robots.txt", status: "warn", detail: "No aparece en robots.txt. Añádelo para que cualquier robot lo encuentre." },
  );
  const parsed = parseSitemap(sm.body);
  let urls: string[] = [];
  if (parsed.kind === "index") {
    checks.push({ label: "Índice de sitemaps", status: "info", detail: `Contiene ${parsed.locs.length} sitemaps. Revisamos los 3 primeros.` });
    for (const child of parsed.locs.slice(0, 3)) {
      const r = await tryFetch(child);
      if (r?.ok) urls.push(...parseSitemap(r.body).locs);
      else checks.push({ label: "Sitemap hijo", status: "warn", detail: `No responde: ${child}` });
    }
  } else urls = parsed.locs;
  if (sm.truncated) checks.push({ label: "Tamaño", status: "warn", detail: "El sitemap supera 2 MB; solo hemos leído el principio." });
  checks.push(
    urls.length
      ? { label: "URL declaradas", status: urls.length > 50000 ? "warn" : "pass", detail: `${urls.length.toLocaleString("es-ES")} URL${parsed.kind === "index" ? " en los sitemaps revisados" : ""}.${urls.length > 50000 ? " Supera el máximo de 50.000 por archivo." : ""}` }
      : { label: "URL declaradas", status: "fail", detail: "El sitemap está vacío." },
  );
  const host = new URL(origin).host.replace(/^www\./, "");
  const foreign = urls.filter((u) => {
    try {
      return new URL(u).host.replace(/^www\./, "") !== host;
    } catch {
      return true;
    }
  }).length;
  if (foreign) checks.push({ label: "Otros dominios", status: "warn", detail: `${foreign} URL apuntan a otro dominio o no son válidas.` });

  const sample = [...new Set(urls)].sort(() => 0.5 - Math.random()).slice(0, 5);
  const rows: string[][] = [];
  let bad = 0;
  await Promise.all(
    sample.map(async (u) => {
      let r = await tryFetch(u, { method: "HEAD" });
      if (r && (r.status === 405 || r.status === 403)) r = await tryFetch(u, { maxBytes: 16 * 1024 });
      const s = r ? r.status : 0;
      if (!r || s >= 400 || r.redirects.length) bad++;
      rows.push([u, s ? String(s) : "sin respuesta", r?.redirects.length ? "Redirige" : s >= 200 && s < 300 ? "OK" : "Error"]);
    }),
  );
  if (sample.length)
    checks.push({
      label: "Muestra de URL",
      status: bad === 0 ? "pass" : bad <= 1 ? "warn" : "fail",
      detail: bad === 0 ? `Las ${sample.length} URL de la muestra responden 200.` : `${bad} de ${sample.length} URL de la muestra redirigen o dan error. Un sitemap solo debería listar URL finales que respondan 200.`,
    });
  return {
    tool: "sitemap",
    url: sm.url,
    score: scoreOf(checks),
    summary: `${urls.length.toLocaleString("es-ES")} URL en tu sitemap.`,
    checks,
    table: rows.length ? { caption: "Muestra aleatoria de URL", head: ["URL", "Estado", "Resultado"], rows } : undefined,
  };
}

/* ───────────── llms.txt ───────────── */
async function llmsTxt(url: string): Promise<ToolResult> {
  const { res, page } = await loadPage(normalizeUrl(url).origin + "/");
  const origin = new URL(res.url).origin;
  const existing = await tryFetch(`${origin}/llms.txt`, { maxBytes: 256 * 1024 });
  const hasLlms = !!existing && existing.ok && !/html/i.test(existing.contentType) && existing.body.trim().length > 0;

  const host = new URL(origin).host;
  const skip = /\.(jpg|jpeg|png|gif|webp|svg|pdf|zip|mp4|css|js)(\?|$)|\/(wp-admin|wp-login|cart|carrito|checkout|login|account|mi-cuenta|cuenta|feed|tag|author)\b|[?&](add-to-cart|replytocom)=/i;
  const optional = /(privacidad|privacy|cookies|legal|aviso|terminos|terms|condiciones)/i;
  const seen = new Set<string>();
  const main: { title: string; url: string }[] = [];
  const extra: { title: string; url: string }[] = [];
  for (const l of page.links) {
    let u: URL;
    try {
      u = new URL(l.href);
    } catch {
      continue;
    }
    if (u.host !== host || skip.test(u.pathname + u.search)) continue;
    u.hash = "";
    const key = u.toString().replace(/\/$/, "");
    if (seen.has(key) || key === origin) continue;
    seen.add(key);
    const title = (l.text || decodeURIComponent(u.pathname.split("/").filter(Boolean).pop() ?? "").replace(/[-_]/g, " ")).trim();
    if (!title) continue;
    (optional.test(u.pathname) ? extra : main).push({ title: cut(title, 80), url: u.toString() });
  }
  const groups = new Map<string, { title: string; url: string }[]>();
  for (const m of main.slice(0, 60)) {
    const seg = new URL(m.url).pathname.split("/").filter(Boolean)[0] ?? "";
    const g = !seg || main.filter((x) => new URL(x.url).pathname.startsWith(`/${seg}/`)).length < 3 ? "Páginas principales" : seg.replace(/[-_]/g, " ").replace(/^./, (c) => c.toUpperCase());
    groups.set(g, [...(groups.get(g) ?? []), m]);
  }
  const name = page.og.site_name || page.title?.split(/[|\-–·]/)[0]?.trim() || host;
  const desc = page.metaDescription || page.og.description || `Web de ${name}.`;
  const lines = [`# ${name}`, "", `> ${desc}`, ""];
  if (page.lang) lines.push(`Idioma principal: ${page.lang}.`, "");
  const ordered = [...groups.entries()].sort((a, b) => (a[0] === "Páginas principales" ? -1 : b[0] === "Páginas principales" ? 1 : b[1].length - a[1].length));
  for (const [g, items] of ordered) {
    lines.push(`## ${g}`, "");
    for (const it of items.slice(0, 15)) lines.push(`- [${it.title}](${it.url})`);
    lines.push("");
  }
  if (extra.length) {
    lines.push("## Optional", "");
    for (const it of extra.slice(0, 8)) lines.push(`- [${it.title}](${it.url})`);
    lines.push("");
  }
  const content = lines.join("\n").trim() + "\n";
  const checks: ToolCheck[] = [
    hasLlms
      ? { label: "llms.txt actual", status: "pass", detail: `Ya tienes un llms.txt en ${origin}/llms.txt. Compáralo con la propuesta.` }
      : { label: "llms.txt actual", status: "warn", detail: "No tienes llms.txt. Sube el archivo generado a la raíz de tu dominio." },
    { label: "Enlaces encontrados", status: main.length >= 5 ? "pass" : "warn", detail: `${main.length} enlaces internos útiles en tu página de inicio.` },
    { label: "Descripción", status: page.metaDescription ? "pass" : "warn", detail: page.metaDescription ? "Usamos tu meta descripción como resumen." : "No hay meta descripción; revisa el resumen generado." },
  ];
  return {
    tool: "llms-txt",
    url: origin,
    summary: "Aquí tienes tu llms.txt. Revísalo, ajusta títulos y súbelo a la raíz de tu web.",
    checks,
    output: { filename: "llms.txt", content },
  };
}

/* ───────────── Auditoría combinada ───────────── */
async function auditoriaIa(url: string): Promise<ToolResult> {
  const { res, page } = await loadPage(url);
  const origin = new URL(res.url).origin;
  const [{ found, robots }, llms] = await Promise.all([loadRobots(origin), tryFetch(`${origin}/llms.txt`, { maxBytes: 128 * 1024 })]);
  const sm = await findSitemap(origin, robots);
  const checks: ToolCheck[] = [];

  checks.push(res.url.startsWith("https://") ? { label: "HTTPS", status: "pass", detail: "La web se sirve de forma segura." } : { label: "HTTPS", status: "fail", detail: "La web no usa HTTPS." });
  const blocked = AI_CRAWLERS.filter((c) => crawlerAccess(robots, c.agent).access === "blocked");
  checks.push({
    label: "Rastreadores de IA",
    status: blocked.length === 0 ? "pass" : blocked.length >= AI_CRAWLERS.length / 2 ? "fail" : "warn",
    detail: blocked.length ? `Bloqueados: ${blocked.map((b) => b.agent).join(", ")}.` : found ? "robots.txt permite el acceso a los rastreadores de IA." : "Sin robots.txt: todos los robots pueden entrar.",
  });
  if (crawlerAccess(robots, "Googlebot").access === "blocked") checks.push({ label: "Googlebot", status: "fail", detail: "robots.txt bloquea a Google." });
  checks.push(sm ? { label: "Sitemap", status: "pass", detail: sm.url } : { label: "Sitemap", status: "warn", detail: "No hemos encontrado sitemap." });
  checks.push(...metaChecks(page).filter((c) => c.label === "Title" || c.label === "Meta descripción"));
  checks.push(
    page.h1.length === 1
      ? { label: "H1", status: "pass", detail: `«${cut(page.h1[0], 90)}»` }
      : { label: "H1", status: page.h1.length ? "warn" : "fail", detail: page.h1.length ? `Hay ${page.h1.length} H1.` : "No hay H1." },
  );
  checks.push(page.canonical ? { label: "Canonical", status: "pass", detail: page.canonical } : { label: "Canonical", status: "warn", detail: "Sin canonical." });
  if (page.robotsMeta && /noindex/i.test(page.robotsMeta)) checks.push({ label: "Indexable", status: "fail", detail: "La página tiene noindex." });
  checks.push(
    page.og.title && page.og.image
      ? { label: "Open Graph", status: "pass", detail: "Título e imagen para compartir." }
      : { label: "Open Graph", status: "warn", detail: "Faltan og:title u og:image." },
  );
  checks.push(
    page.jsonLd.valid > 0
      ? { label: "Datos estructurados", status: page.jsonLd.invalid ? "warn" : "pass", detail: `JSON-LD: ${page.jsonLd.types.slice(0, 6).join(", ") || "sin @type"}${page.jsonLd.invalid ? ` · ${page.jsonLd.invalid} bloque(s) con errores` : ""}` }
      : { label: "Datos estructurados", status: "fail", detail: "No hay JSON-LD. Es una de las formas más claras de explicar quién eres a buscadores y modelos." },
  );
  const hasLlms = !!llms && llms.ok && !/html/i.test(llms.contentType) && llms.body.trim().length > 0;
  checks.push(hasLlms ? { label: "llms.txt", status: "pass", detail: "Tienes un llms.txt publicado." } : { label: "llms.txt", status: "warn", detail: "No tienes llms.txt. Puedes generarlo con nuestra herramienta." });
  checks.push(page.lang ? { label: "Idioma declarado", status: "pass", detail: `lang="${page.lang}"` } : { label: "Idioma declarado", status: "warn", detail: "La etiqueta <html> no declara idioma." });
  checks.push(page.viewport ? { label: "Móvil", status: "pass", detail: "Tiene meta viewport." } : { label: "Móvil", status: "warn", detail: "Sin meta viewport: puede verse mal en móvil." });
  checks.push(
    page.wordCount >= 300
      ? { label: "Texto legible", status: "pass", detail: `Unas ${page.wordCount.toLocaleString("es-ES")} palabras en el HTML.` }
      : { label: "Texto legible", status: "warn", detail: `Solo ${page.wordCount} palabras en el HTML. Si tu web depende de JavaScript, muchos rastreadores de IA no verán el contenido.` },
  );
  if (page.images) checks.push({ label: "Textos alternativos", status: page.imagesWithoutAlt ? "warn" : "pass", detail: page.imagesWithoutAlt ? `${page.imagesWithoutAlt} de ${page.images} imágenes sin atributo alt.` : "Todas las imágenes tienen alt." });
  checks.push({ label: "Tiempo de respuesta", status: res.ms < 1500 ? "pass" : res.ms < 4000 ? "warn" : "fail", detail: `${res.ms} ms para descargar el HTML.` });

  const score = scoreOf(checks) ?? 0;
  return {
    tool: "auditoria-ia",
    url: res.url,
    score,
    summary:
      score >= 85 ? "Muy buena base: tu web es fácil de leer para buscadores y asistentes." : score >= 65 ? "Buena base con algunos huecos que conviene tapar." : "Hay varias cosas que impiden que la IA y Google te entiendan bien.",
    checks,
  };
}

export const serverTools: Record<string, (url: string) => Promise<ToolResult>> = {
  "auditoria-ia": auditoriaIa,
  "robots-txt": robotsTxt,
  sitemap,
  "llms-txt": llmsTxt,
  "meta-descripcion": metaDescripcion,
  h1,
  "open-graph": openGraph,
  canonical,
};
