import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articleBodyHtml, getPublishedBySlug, jsonLdFor, listPublished } from "@/lib/headless/content";
import { fmtLongDate, getBlogContext, ldJson } from "@/lib/headless/blog";

type Props = { params: Promise<{ siteId: string; slug: string }> };

async function load(siteId: string, slug: string) {
  const [ctx, article] = await Promise.all([getBlogContext(siteId), getPublishedBySlug(siteId, slug)]);
  if (!ctx || !article) return null;
  return { ctx, article, canonical: `${ctx.canonicalBase}/${article.slug}` };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { siteId, slug } = await params;
  const data = await load(siteId, slug);
  if (!data) return { title: "Artículo no encontrado", robots: { index: false } };
  const { ctx, article: a, canonical } = data;
  const images = a.cover_url ? [{ url: a.cover_url, alt: a.title }] : undefined;
  return {
    title: { absolute: `${a.title} · ${ctx.site.name}` },
    description: a.meta_description ?? undefined,
    alternates: { canonical, types: { "application/rss+xml": ctx.feedUrl } },
    robots: ctx.indexable ? { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } : { index: false, follow: true },
    openGraph: {
      type: "article",
      title: a.title,
      description: a.meta_description ?? undefined,
      url: canonical,
      siteName: ctx.site.name,
      locale: a.language === "es" ? "es_ES" : a.language,
      publishedTime: a.published_at ?? undefined,
      modifiedTime: a.updated_at,
      tags: a.tags ?? undefined,
      images,
    },
    twitter: { card: images ? "summary_large_image" : "summary", title: a.title, description: a.meta_description ?? undefined, images: images?.map((i) => i.url) },
  };
}

export default async function HostedArticle({ params }: Props) {
  const { siteId, slug } = await params;
  const data = await load(siteId, slug);
  if (!data) notFound();
  const { ctx, article: a, canonical } = data;
  const { items } = await listPublished(siteId, { perPage: 4, lang: a.language });
  const related = items.filter((r) => r.id !== a.id).slice(0, 3);

  const ld = jsonLdFor(a, ctx.site, canonical);
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: ctx.site.name, item: ctx.site.url },
      { "@type": "ListItem", position: 2, name: ctx.title, item: ctx.canonicalBase },
      { "@type": "ListItem", position: 3, name: a.title, item: canonical },
    ],
  };

  return (
    <article lang={a.language}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbs) }} />

      <nav aria-label="Migas de pan" className="mb-6 text-sm" style={{ color: "var(--b-muted)" }}>
        <Link href={ctx.base || "/"} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
          ← {ctx.title}
        </Link>
      </nav>

      <header className="mb-8">
        <h1 className="b-head text-[2rem] font-semibold leading-[1.1] sm:text-[2.75rem]">{a.title}</h1>
        {a.meta_description && <p className="mt-5 text-lg leading-relaxed" style={{ color: "var(--b-muted)" }}>{a.meta_description}</p>}
        <p className="mt-4 text-sm" style={{ color: "var(--b-muted)" }}>
          <time dateTime={a.published_at ?? undefined}>{fmtLongDate(a.published_at, a.language)}</time>
          {" · "}
          {Math.max(1, Math.round(a.word_count / 220))} min de lectura
        </p>
      </header>

      {a.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element -- dominio de imagen arbitrario del cliente
        <img src={a.cover_url} alt={a.title} width={1200} height={630} fetchPriority="high" className="mb-10 aspect-[1200/630] w-full rounded-2xl object-cover" />
      )}

      <div className="ywc-prose" dangerouslySetInnerHTML={{ __html: articleBodyHtml(a) }} />

      {!!a.tags?.length && (
        <p className="mt-10 flex flex-wrap gap-2">
          {a.tags.map((t) => (
            <Link key={t} href={`${ctx.base || "/"}?tag=${encodeURIComponent(t)}`} className="b-tag">
              {t}
            </Link>
          ))}
        </p>
      )}

      {!!related.length && (
        <aside className="mt-14 border-t pt-8" style={{ borderColor: "var(--b-line)" }}>
          <h2 className="b-head text-xl font-semibold">Sigue leyendo</h2>
          <ul className="mt-4 space-y-3">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`${ctx.base}/${r.slug}`} className="inline-flex min-h-11 items-center font-medium underline-offset-4 hover:underline" style={{ color: "var(--b-accent)" }}>
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
}
