/**
 * Fragmentos de código de la página de Integraciones.
 * Marcadores: __API__, __SITE__, __ORIGIN__, __HOST__ (se sustituyen con snippet()).
 */

const S = {
  curl: `# Lista de artículos publicados (paginada)
curl -s "__API__/articles?per_page=10&lang=es" \\
  -H "Authorization: Bearer $YWC_API_KEY"

# Un artículo completo: html, markdown, faq, json_ld, imágenes…
curl -s "__API__/articles/vajilla-artesanal" \\
  -H "Authorization: Bearer $YWC_API_KEY"

# Feeds y sitemap públicos (sin clave)
curl -s "__API__/feed.xml"
curl -s "__API__/feed.json"
curl -s "__API__/sitemap.xml"`,
  response: `{
  "data": {
    "id": "a_1",
    "title": "Cómo elegir una vajilla artesanal que dure años",
    "slug": "vajilla-artesanal",
    "language": "es",
    "excerpt": "Consejos de taller para acertar a la primera.",
    "url": "https://cliente.com/blog/vajilla-artesanal",
    "cover": { "url": "https://…/portada.webp", "alt": "…" },
    "tags": ["vajilla"],
    "reading_time_minutes": 7,
    "published_at": "2026-10-08T09:00:00.000Z",
    "updated_at": "2026-10-09T09:00:00.000Z",
    "meta": { "title": "…", "description": "…", "canonical_url": "…", "og_image": "…" },
    "html": "<h2>Lo esencial</h2>…",
    "markdown": "## Lo esencial\\n…",
    "faq": [{ "q": "…", "a": "…" }],
    "json_ld": { "@context": "https://schema.org", "@graph": [ … ] },
    "images": [{ "url": "…", "alt": "…" }]
  }
}`,
  nextLib: `// lib/yeswecontent.ts
const API = "__API__";

export type Article = {
  slug: string; title: string; excerpt: string | null; url: string;
  cover: { url: string; alt: string } | null; tags: string[];
  published_at: string; updated_at: string;
  meta: { title: string; description: string | null; canonical_url: string; og_image: string | null };
  html: string; markdown: string; faq: { q: string; a: string }[];
  json_ld: Record<string, unknown>;
};

async function ywc<T>(path: string, tags: string[]): Promise<T | null> {
  const res = await fetch(\`\${API}\${path}\`, {
    headers: { Authorization: \`Bearer \${process.env.YWC_API_KEY}\` },
    next: { tags, revalidate: 3600 }, // el webhook invalida antes
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(\`yeswecontent \${res.status}\`);
  return (await res.json()).data as T;
}

export const getArticles = () =>
  ywc<Article[]>("/articles?per_page=100", ["ywc-articles"]).then((a) => a ?? []);

export const getArticle = (slug: string) =>
  ywc<Article>(\`/articles/\${slug}\`, ["ywc-articles", \`ywc-article-\${slug}\`]);`,
  nextPage: `// app/blog/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticle, getArticles } from "@/lib/yeswecontent";

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export const dynamicParams = true; // los artículos nuevos se generan al vuelo

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getArticle((await params).slug);
  if (!a) return {};
  return {
    title: a.meta.title,
    description: a.meta.description ?? undefined,
    alternates: { canonical: \`/blog/\${a.slug}\` },
    openGraph: { type: "article", images: a.cover ? [a.cover.url] : [] },
  };
}

export default async function Post({ params }: Props) {
  const a = await getArticle((await params).slug);
  if (!a) notFound();
  return (
    <article className="prose mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(a.json_ld).replace(/</g, "\\\\u003c") }}
      />
      <h1>{a.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: a.html }} />
    </article>
  );
}`,
  nextWebhook: `// app/api/ywc-revalidate/route.ts
import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(req: Request) {
  const body = await req.text();
  const header = req.headers.get("x-ywc-signature") ?? "";
  const { t, v1 } = Object.fromEntries(header.split(",").map((p) => p.split("=")));
  const expected = createHmac("sha256", process.env.YWC_WEBHOOK_SECRET!)
    .update(\`\${t}.\${body}\`)
    .digest("hex");
  const fresh = Math.abs(Date.now() / 1000 - Number(t)) < 300;
  if (!fresh || !v1 || v1.length !== expected.length ||
      !timingSafeEqual(Buffer.from(v1), Buffer.from(expected))) {
    return new Response("Firma no válida", { status: 401 });
  }

  const event = JSON.parse(body);
  for (const tag of event.revalidate.tags) revalidateTag(tag);
  for (const path of event.revalidate.paths) revalidatePath(path);
  return Response.json({ revalidated: true });
}`,
  nextEnv: `# .env.local
YWC_API_KEY=ywc_live_…          # Panel → Integraciones → Claves de API
YWC_WEBHOOK_SECRET=whsec_…      # Panel → Integraciones → Revalidación`,
  nuxtServer: `// server/api/blog/[slug].get.ts  (la clave nunca llega al navegador)
export default defineCachedEventHandler(async (event) => {
  const { ywcApiKey } = useRuntimeConfig();
  const slug = getRouterParam(event, "slug");
  const res = await $fetch<{ data: any }>(\`__API__/articles/\${slug}\`, {
    headers: { Authorization: \`Bearer \${ywcApiKey}\` },
  }).catch(() => null);
  if (!res) throw createError({ statusCode: 404, statusMessage: "No encontrado" });
  return res.data;
}, { maxAge: 3600, name: "ywc-article", getKey: (e) => getRouterParam(e, "slug")! });

// server/api/blog/index.get.ts
export default defineCachedEventHandler(async () => {
  const { ywcApiKey } = useRuntimeConfig();
  const res = await $fetch<{ data: any[] }>("__API__/articles?per_page=100", {
    headers: { Authorization: \`Bearer \${ywcApiKey}\` },
  });
  return res.data;
}, { maxAge: 3600, name: "ywc-articles", getKey: () => "all" });`,
  nuxtPage: `<!-- pages/blog/[slug].vue -->
<script setup lang="ts">
const route = useRoute();
const { data: a } = await useFetch(\`/api/blog/\${route.params.slug}\`);
if (!a.value) throw createError({ statusCode: 404, fatal: true });

useSeoMeta({
  title: a.value.meta.title,
  description: a.value.meta.description,
  ogImage: a.value.cover?.url,
  ogType: "article",
});
useHead({
  link: [{ rel: "canonical", href: a.value.url }],
  script: [{ type: "application/ld+json", innerHTML: JSON.stringify(a.value.json_ld) }],
});
</script>

<template>
  <article class="prose">
    <h1>{{ a.title }}</h1>
    <div v-html="a.html" />
  </article>
</template>`,
  nuxtWebhook: `// server/api/ywc-webhook.post.ts
import { createHmac, timingSafeEqual } from "node:crypto";

export default defineEventHandler(async (event) => {
  const body = (await readRawBody(event)) ?? "";
  const header = getHeader(event, "x-ywc-signature") ?? "";
  const { t, v1 } = Object.fromEntries(header.split(",").map((p) => p.split("=")));
  const expected = createHmac("sha256", useRuntimeConfig().ywcWebhookSecret)
    .update(\`\${t}.\${body}\`).digest("hex");
  if (!v1 || v1.length !== expected.length ||
      !timingSafeEqual(Buffer.from(v1), Buffer.from(expected)) ||
      Math.abs(Date.now() / 1000 - Number(t)) > 300) {
    throw createError({ statusCode: 401, statusMessage: "Firma no válida" });
  }
  // Vacía la caché de los handlers cacheados (ywc-articles / ywc-article)
  const storage = useStorage("cache");
  for (const key of await storage.getKeys("nitro:handlers")) {
    if (key.includes("ywc-")) await storage.removeItem(key);
  }
  return { revalidated: true };
});

// nuxt.config.ts → runtimeConfig: { ywcApiKey: "", ywcWebhookSecret: "" }
// .env → NUXT_YWC_API_KEY=ywc_live_…  NUXT_YWC_WEBHOOK_SECRET=whsec_…`,
  astroConfig: `// src/content.config.ts  (Astro 5 · Content Layer)
import { defineCollection, z } from "astro:content";

const API = "__API__";

const blog = defineCollection({
  loader: async () => {
    const all = [];
    for (let page = 1; ; page++) {
      const res = await fetch(\`\${API}/articles?include=content&per_page=100&page=\${page}\`, {
        headers: { Authorization: \`Bearer \${import.meta.env.YWC_API_KEY}\` },
      });
      const { data, pagination } = await res.json();
      all.push(...data);
      if (page >= pagination.total_pages) break;
    }
    return all.map((a) => ({ id: a.slug, ...a }));
  },
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    excerpt: z.string().nullable(),
    url: z.string(),
    html: z.string(),
    tags: z.array(z.string()),
    published_at: z.string(),
    cover: z.object({ url: z.string(), alt: z.string() }).nullable(),
    meta: z.object({ title: z.string(), description: z.string().nullable() }),
    json_ld: z.record(z.any()),
  }),
});

export const collections = { blog };`,
  astroPage: `---
// src/pages/blog/[slug].astro
import { getCollection } from "astro:content";
import Layout from "../../layouts/Layout.astro";

export async function getStaticPaths() {
  const posts = await getCollection("blog");
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}
const { data: a } = Astro.props.post;
---
<Layout title={a.meta.title} description={a.meta.description}>
  <link rel="canonical" href={a.url} slot="head" />
  <script type="application/ld+json" set:html={JSON.stringify(a.json_ld)} slot="head" />
  <article class="prose">
    <h1>{a.title}</h1>
    <Fragment set:html={a.html} />
  </article>
</Layout>

<!--
  Reconstrucción automática: pega como «URL del webhook» el Deploy Hook
  de Vercel, Netlify o Cloudflare Pages. Cada publicación lanza un build.
-->`,
  react: `// useArticles.ts — React SPA (Vite, CRA…) con clave PÚBLICA restringida a tu dominio
import { useEffect, useState } from "react";

const API = "__API__";
const KEY = "ywc_pub_…"; // clave pública (solo lectura, limitada a tu origen)

export function useArticles(page = 1) {
  const [state, setState] = useState({ data: [], loading: true, error: null });
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(\`\${API}/articles?page=\${page}&per_page=12\`, {
      headers: { Authorization: \`Bearer \${KEY}\` },
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((json) => setState({ data: json.data, loading: false, error: null }))
      .catch((error) => error.name !== "AbortError" && setState((s) => ({ ...s, loading: false, error })));
    return () => ctrl.abort();
  }, [page]);
  return state;
}

export function Article({ slug }) {
  const [a, setA] = useState(null);
  useEffect(() => {
    fetch(\`\${API}/articles/\${slug}\`, { headers: { Authorization: \`Bearer \${KEY}\` } })
      .then((r) => r.json())
      .then((json) => {
        setA(json.data);
        document.title = json.data.meta.title;
      });
  }, [slug]);
  if (!a) return <p>Cargando…</p>;
  return (
    <article>
      <h1>{a.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: a.html }} />
    </article>
  );
}`,
  php: `<?php
// blog.php — PHP sin framework (cualquier hosting)
const YWC_API = '__API__';
$key = getenv('YWC_API_KEY'); // ywc_live_…

function ywc(string $path, string $key): ?array {
    $cache = sys_get_temp_dir() . '/ywc_' . md5($path) . '.json';
    if (is_file($cache) && filemtime($cache) > time() - 600) {
        return json_decode(file_get_contents($cache), true);
    }
    $ctx = stream_context_create(['http' => [
        'header' => "Authorization: Bearer $key\\r\\nAccept: application/json\\r\\n",
        'ignore_errors' => true, 'timeout' => 10,
    ]]);
    $raw = @file_get_contents(YWC_API . $path, false, $ctx);
    if ($raw === false || !str_contains($http_response_header[0] ?? '', '200')) return null;
    file_put_contents($cache, $raw);
    return json_decode($raw, true);
}

$slug = preg_replace('/[^a-z0-9-]/', '', $_GET['slug'] ?? '');
if ($slug) {
    $a = ywc("/articles/$slug", $key)['data'] ?? null;
    if (!$a) { http_response_code(404); exit('No encontrado'); }
    ?>
    <title><?= htmlspecialchars($a['meta']['title']) ?></title>
    <meta name="description" content="<?= htmlspecialchars($a['meta']['description'] ?? '') ?>">
    <link rel="canonical" href="<?= htmlspecialchars($a['url']) ?>">
    <script type="application/ld+json"><?= json_encode($a['json_ld'], JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) ?></script>
    <article><h1><?= htmlspecialchars($a['title']) ?></h1><?= $a['html'] ?></article>
    <?php
} else {
    foreach (ywc('/articles?per_page=20', $key)['data'] ?? [] as $a) {
        printf('<h2><a href="?slug=%s">%s</a></h2>', urlencode($a['slug']), htmlspecialchars($a['title']));
    }
}`,
  laravel: `<?php
// app/Services/YesWeContent.php
namespace App\\Services;

use Illuminate\\Support\\Facades\\Cache;
use Illuminate\\Support\\Facades\\Http;

class YesWeContent
{
    private const API = '__API__';

    public function articles(int $page = 1): array
    {
        return Cache::tags('ywc')->remember("ywc.articles.$page", 3600, fn () =>
            Http::withToken(config('services.ywc.key'))
                ->get(self::API . '/articles', ['page' => $page, 'per_page' => 12])
                ->throw()->json());
    }

    public function article(string $slug): ?array
    {
        return Cache::tags('ywc')->remember("ywc.article.$slug", 3600, function () use ($slug) {
            $res = Http::withToken(config('services.ywc.key'))->get(self::API . "/articles/$slug");
            return $res->notFound() ? null : $res->throw()->json('data');
        });
    }
}

// routes/web.php
Route::get('/blog/{slug}', function (string $slug, App\\Services\\YesWeContent $ywc) {
    $article = $ywc->article($slug) ?? abort(404);
    return view('blog.show', ['a' => $article]); // {!! $a['html'] !!}
});

// routes/api.php — webhook de revalidación (excluye esta ruta del CSRF)
Route::post('/ywc-webhook', function (Illuminate\\Http\\Request $request) {
    parse_str(str_replace(',', '&', $request->header('X-YWC-Signature', '')), $sig);
    $expected = hash_hmac('sha256', ($sig['t'] ?? '') . '.' . $request->getContent(), config('services.ywc.webhook_secret'));
    abort_unless(hash_equals($expected, $sig['v1'] ?? '') && abs(time() - (int) ($sig['t'] ?? 0)) < 300, 401);
    Cache::tags('ywc')->flush();
    return ['revalidated' => true];
});`,
  embed: `<!-- Pega esto donde quieras que aparezca el blog -->
<div id="ywc-blog" data-site="__SITE__" data-base="__ORIGIN__"></div>
<script src="__ORIGIN__/embed.js" async></script>

<!-- Opcional:
  data-limit="12"          nº de artículos en la lista
  data-theme="auto"        "light" | "dark" | "auto"
  data-accent="#b4532a"    color de enlaces y botones
  data-styles="none"       desactiva nuestros estilos para usar los tuyos
-->`,
  webhookPayload: `POST https://tu-web.com/api/ywc-revalidate
Content-Type: application/json
X-YWC-Event: article.published
X-YWC-Signature: t=1792486800,v1=5f2c…e91a

{
  "event": "article.published",
  "framework": "nextjs",
  "site_id": "__SITE__",
  "article": {
    "id": "a_1",
    "slug": "vajilla-artesanal",
    "title": "Cómo elegir una vajilla artesanal que dure años",
    "language": "es",
    "url": "https://tu-web.com/blog/vajilla-artesanal",
    "published_at": "2026-10-20T09:00:00.000Z",
    "tags": ["vajilla"]
  },
  "revalidate": {
    "tags": ["ywc-articles", "ywc-article-vajilla-artesanal", "ywc-tag-vajilla"],
    "paths": ["/blog", "/blog/vajilla-artesanal"]
  },
  "sent_at": "2026-10-20T09:00:01.000Z"
}`,
  nginx: `# Nginx: sirve el blog alojado en tudominio.com/blog
location /blog/ {
    proxy_pass https://__HOST__/blog-hosted/__SITE__/;
    proxy_set_header Host __HOST__;
    proxy_set_header X-Forwarded-Prefix /blog;
    proxy_set_header X-Forwarded-Host $host;
    proxy_ssl_server_name on;
}`,
  nextRewrites: `// next.config.js de tu web (o vercel.json → "rewrites")
module.exports = {
  async rewrites() {
    return [
      { source: "/blog", destination: "__ORIGIN__/blog-hosted/__SITE__" },
      { source: "/blog/:slug", destination: "__ORIGIN__/blog-hosted/__SITE__/:slug" },
    ];
  },
};
// Nota: los enlaces internos usarán /blog-hosted/… salvo que tu proxy envíe
// la cabecera X-Forwarded-Prefix: /blog (Nginx, Cloudflare Workers, Caddy).`,
  frontmatter: `---
title: "Cómo elegir una vajilla artesanal que dure años"
description: "Consejos de taller para acertar a la primera."
date: "2026-10-20T09:00:00.000Z"
slug: "vajilla-artesanal"
lang: "es"
cover: "https://…/portada.webp"
tags: ["vajilla"]
faq:
  - q: "¿Hacéis envíos a toda España?"
    a: "Sí, en 48–72 horas y con embalaje reforzado."
generator: "yeswecontent"
---

## Lo esencial

…`,
} as const;

export type SnippetId = keyof typeof S;

export function snippet(id: SnippetId, v: { api: string; site: string; origin: string }) {
  const host = v.origin.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return S[id].replace(/__API__/g, v.api).replace(/__SITE__/g, v.site).replace(/__ORIGIN__/g, v.origin).replace(/__HOST__/g, host);
}
