/**
 * Publicación Git para webs estáticas / Jamstack (Next.js, Astro, Hugo, Gatsby,
 * Nuxt Content, Eleventy, Jekyll…). Crea o actualiza un fichero Markdown/MDX con
 * frontmatter en un repositorio de GitHub usando la REST API y un token
 * fine-grained (permiso "Contents: Read and write" y, en modo PR, "Pull requests: Read and write").
 *
 * Modo "commit": commit directo a la rama (el CI/CD del cliente despliega solo).
 * Modo "pull_request": rama nueva ywc/<slug>-<fecha> + PR para revisión.
 */
import { decrypt, isEncrypted } from "@/lib/crypto";
import { readError } from "./html";
import type { PublishResult, PublishableArticle } from "./types";

export interface GithubConfig {
  token: string;
  /** "owner" o "owner/repo". */
  owner: string;
  repo?: string;
  branch?: string;
  /** Plantilla de ruta: {slug}, {lang}, {yyyy}, {mm}, {dd}. Por defecto content/blog/{slug}.mdx */
  path_template?: string;
  format?: "md" | "mdx";
  mode?: "commit" | "pull_request";
  /** URL pública del artículo una vez desplegado, p. ej. https://cliente.com/blog/{slug} */
  public_url_template?: string;
  author_name?: string;
  author_email?: string;
  /** Claves extra de frontmatter (p. ej. { layout: "post", draft: false }). */
  frontmatter_extra?: Record<string, string | number | boolean>;
}

type GithubArticle = PublishableArticle & { tags?: string[] | null; published_at?: string | null; updated_at?: string | null };

const API = "https://api.github.com";

/* ───────── frontmatter ───────── */

/** YAML seguro: todas las cadenas entre comillas dobles (JSON es YAML válido). */
const y = (v: unknown) => JSON.stringify(v ?? "");

export function buildFrontmatter(a: GithubArticle, extra: GithubConfig["frontmatter_extra"] = {}) {
  const date = a.published_at ?? new Date().toISOString();
  const lines = [
    "---",
    `title: ${y(a.title)}`,
    `description: ${y(a.meta_description ?? "")}`,
    `date: ${y(date)}`,
    ...(a.updated_at ? [`updated: ${y(a.updated_at)}`] : []),
    `slug: ${y(a.slug)}`,
    `lang: ${y(a.language)}`,
    ...(a.cover_url ? [`cover: ${y(a.cover_url)}`] : []),
    `tags: [${(a.tags ?? []).map(y).join(", ")}]`,
  ];
  if (a.faq?.length) {
    lines.push("faq:");
    for (const f of a.faq) lines.push(`  - q: ${y(f.q)}`, `    a: ${y(f.a)}`);
  } else lines.push("faq: []");
  if (a.schema_jsonld) lines.push(`schema: ${y(JSON.stringify(a.schema_jsonld))}`);
  for (const [k, v] of Object.entries(extra ?? {})) if (/^[a-zA-Z_][\w-]*$/.test(k)) lines.push(`${k}: ${typeof v === "string" ? y(v) : String(v)}`);
  lines.push("generator: \"yeswecontent\"", "---");
  return lines.join("\n");
}

/** En MDX, `{`, `}` y `<` sueltos romperían el parser: los escapamos. */
const mdxSafe = (md: string) =>
  md
    .split(/(`[^`\n]*`)/)
    .map((part, i) => (i % 2 ? part : part.replace(/[{}]/g, (c) => `\\${c}`).replace(/<(?!https?:\/\/)/g, "&lt;")))
    .join("");

export function buildMarkdownFile(a: GithubArticle, c: Pick<GithubConfig, "format" | "frontmatter_extra">) {
  const body = c.format === "md" ? a.body_md : mdxSafe(a.body_md);
  return `${buildFrontmatter(a, c.frontmatter_extra)}\n\n${body.trim()}\n`;
}

export function resolvePath(template: string | undefined, a: Pick<GithubArticle, "slug" | "language" | "published_at">, format: "md" | "mdx" = "mdx") {
  const d = new Date(a.published_at ?? Date.now());
  const p = (template || `content/blog/{slug}.${format}`)
    .replace(/\{slug\}/g, a.slug)
    .replace(/\{lang\}/g, a.language)
    .replace(/\{yyyy\}/g, String(d.getUTCFullYear()))
    .replace(/\{mm\}/g, String(d.getUTCMonth() + 1).padStart(2, "0"))
    .replace(/\{dd\}/g, String(d.getUTCDate()).padStart(2, "0"))
    .replace(/^\/+/, "");
  if (p.split("/").some((seg) => seg === ".." || seg === "." || !seg)) throw new Error(`Ruta de destino no válida: ${p}`);
  return p;
}

/* ───────── GitHub REST ───────── */

function client(c: GithubConfig) {
  const token = isEncrypted(c.token) ? decrypt(c.token) : c.token;
  const [owner, repoFromOwner] = c.owner.split("/");
  const repo = c.repo ?? repoFromOwner;
  if (!owner || !repo) throw new Error("Falta el repositorio (owner/repo).");
  const base = `${API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const headers = {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${token}`,
    "x-github-api-version": "2022-11-28",
    "user-agent": "yeswecontent-publisher/1.0",
    "content-type": "application/json",
  };
  const call = (path: string, init: RequestInit = {}) => fetch(`${base}${path}`, { ...init, headers, signal: AbortSignal.timeout(20_000) });
  return { call, owner, repo };
}

const encPath = (p: string) => p.split("/").map(encodeURIComponent).join("/");

export async function publishGithub(a: PublishableArticle, c: GithubConfig): Promise<PublishResult> {
  const art = a as GithubArticle;
  const { call } = client(c);
  const format = c.format ?? "mdx";
  const path = resolvePath(c.path_template, art, format);
  const content = Buffer.from(buildMarkdownFile(art, { format, frontmatter_extra: c.frontmatter_extra }), "utf8").toString("base64");

  // Rama base: la configurada o la rama por defecto del repo
  let baseBranch = c.branch;
  if (!baseBranch) {
    const r = await call("");
    if (!r.ok) return { ok: false, url: null, error: await readError(r) };
    baseBranch = ((await r.json()) as { default_branch: string }).default_branch;
  }

  let targetBranch = baseBranch;
  if (c.mode === "pull_request") {
    const ref = await call(`/git/ref/heads/${encPath(baseBranch)}`);
    if (!ref.ok) return { ok: false, url: null, error: await readError(ref) };
    const sha = ((await ref.json()) as { object: { sha: string } }).object.sha;
    targetBranch = `ywc/${a.slug.slice(0, 60)}-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}`;
    const created = await call("/git/refs", { method: "POST", body: JSON.stringify({ ref: `refs/heads/${targetBranch}`, sha }) });
    if (!created.ok && created.status !== 422) return { ok: false, url: null, error: await readError(created) };
  }

  // ¿Existe ya el fichero? (necesitamos su sha para actualizarlo)
  let existingSha: string | undefined;
  const existing = await call(`/contents/${encPath(path)}?ref=${encodeURIComponent(targetBranch)}`);
  if (existing.ok) existingSha = ((await existing.json()) as { sha?: string }).sha;
  else if (existing.status !== 404) return { ok: false, url: null, error: await readError(existing) };

  const committer = c.author_name && c.author_email ? { name: c.author_name, email: c.author_email } : undefined;
  const put = await call(`/contents/${encPath(path)}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `${existingSha ? "content: actualiza" : "content: publica"} «${a.title}»\n\nPublicado desde yeswecontent.`,
      content,
      branch: targetBranch,
      ...(existingSha ? { sha: existingSha } : {}),
      ...(committer ? { committer, author: committer } : {}),
    }),
  });
  if (!put.ok) return { ok: false, url: null, error: await readError(put) };
  const putJson = (await put.json()) as { content?: { html_url?: string }; commit?: { sha?: string; html_url?: string } };

  if (c.mode === "pull_request") {
    const pr = await call("/pulls", {
      method: "POST",
      body: JSON.stringify({
        title: `Nuevo artículo: ${a.title}`,
        head: targetBranch,
        base: baseBranch,
        body: `Artículo generado por yeswecontent.\n\n- **Slug:** \`${a.slug}\`\n- **Fichero:** \`${path}\`\n- **Descripción:** ${a.meta_description ?? "—"}\n\nRevisa la vista previa y fusiona para publicar.`,
      }),
    });
    if (!pr.ok) return { ok: false, url: null, error: await readError(pr) };
    const prJson = (await pr.json()) as { html_url: string; number: number };
    return { ok: true, url: prJson.html_url, externalId: `pr#${prJson.number}` };
  }

  const publicUrl = c.public_url_template ? c.public_url_template.replace(/\{slug\}/g, a.slug).replace(/\{lang\}/g, a.language) : null;
  return { ok: true, url: publicUrl ?? putJson.content?.html_url ?? null, externalId: putJson.commit?.sha };
}

/** Comprueba token + repo + rama sin escribir nada (para el botón «Probar conexión»). */
export async function testGithubConnection(c: GithubConfig): Promise<{ ok: boolean; message: string }> {
  try {
    const { call, owner, repo } = client(c);
    const r = await call("");
    if (r.status === 404) return { ok: false, message: `No encontramos ${owner}/${repo} o el token no tiene acceso.` };
    if (r.status === 401) return { ok: false, message: "El token no es válido o ha caducado." };
    if (!r.ok) return { ok: false, message: await readError(r) };
    const info = (await r.json()) as { default_branch: string; permissions?: { push?: boolean } };
    if (info.permissions && !info.permissions.push) return { ok: false, message: "El token puede leer el repositorio pero no escribir (Contents: Read and write)." };
    const branch = c.branch || info.default_branch;
    const b = await call(`/branches/${encPath(branch)}`);
    if (!b.ok) return { ok: false, message: `La rama «${branch}» no existe.` };
    return { ok: true, message: `Conectado a ${owner}/${repo} (rama ${branch}).` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}
