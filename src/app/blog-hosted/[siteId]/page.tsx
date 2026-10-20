import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { canonicalFor, listPublished } from "@/lib/headless/content";
import { fmtLongDate, getBlogContext, ldJson } from "@/lib/headless/blog";

const PER_PAGE = 12;

type Props = { params: Promise<{ siteId: string }>; searchParams: Promise<{ page?: string; tag?: string }> };

const pageOf = (p?: string) => Math.max(1, Number.parseInt(p ?? "1", 10) || 1);
const tagOf = (t?: string) => (t && /^[\p{L}\p{N} _-]{1,60}$/u.test(t) ? t.toLowerCase() : null);

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ siteId }, sp] = await Promise.all([params, searchParams]);
  const ctx = await getBlogContext(siteId);
  if (!ctx) return {};
  const page = pageOf(sp.page);
  const tag = tagOf(sp.tag);
  const canonical = `${ctx.canonicalBase}${page > 1 || tag ? `?${new URLSearchParams({ ...(tag ? { tag } : {}), ...(page > 1 ? { page: String(page) } : {}) })}` : ""}`;
  const title = tag ? `${tag[0].toUpperCase()}${tag.slice(1)} · ${ctx.title}` : ctx.title;
  return {
    title: { absolute: page > 1 ? `${title} (página ${page})` : title },
    description: ctx.tagline || `Artículos de ${ctx.site.name}.`,
    alternates: { canonical, types: { "application/rss+xml": ctx.feedUrl } },
    robots: ctx.indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { type: "website", title, description: ctx.tagline, url: canonical, siteName: ctx.site.name, locale: ctx.site.language === "es" ? "es_ES" : ctx.site.language },
    twitter: { card: "summary_large_image", title, description: ctx.tagline },
  };
}

export default async function HostedBlogIndex({ params, searchParams }: Props) {
  const [{ siteId }, sp] = await Promise.all([params, searchParams]);
  const ctx = await getBlogContext(siteId);
  if (!ctx) notFound();
  const page = pageOf(sp.page);
  const tag = tagOf(sp.tag);
  const { items, total } = await listPublished(siteId, { page, perPage: PER_PAGE, tag });
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  if (page > pages) notFound();

  const href = (p: number) => {
    const qs = new URLSearchParams({ ...(tag ? { tag } : {}), ...(p > 1 ? { page: String(p) } : {}) }).toString();
    return `${ctx.base || "/"}${qs ? `?${qs}` : ""}`;
  };

  const ld = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: ctx.title,
    description: ctx.tagline,
    url: ctx.canonicalBase,
    publisher: { "@type": "Organization", name: ctx.site.name, url: ctx.site.url },
    blogPost: items.map((a) => ({ "@type": "BlogPosting", headline: a.title, url: canonicalFor(a, siteId, ctx.hosted), datePublished: a.published_at })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <div className="mb-10">
        <h1 className="b-head text-3xl font-semibold leading-tight sm:text-4xl">{tag ? `Artículos sobre «${tag}»` : ctx.title}</h1>
        {ctx.tagline && !tag && <p className="mt-3 text-lg" style={{ color: "var(--b-muted)" }}>{ctx.tagline}</p>}
        {tag && (
          <Link href={href(1).replace(/\?.*$/, "") || "/"} className="mt-3 inline-flex min-h-11 items-center text-sm underline underline-offset-4" style={{ color: "var(--b-accent)" }}>
            ← Todos los artículos
          </Link>
        )}
      </div>

      {items.length ? (
        <ul className="divide-y" style={{ borderColor: "var(--b-line)" }}>
          {items.map((a) => (
            <li key={a.id} className="py-7 first:pt-0" style={{ borderColor: "var(--b-line)" }}>
              <article>
                <p className="text-sm" style={{ color: "var(--b-muted)" }}>
                  <time dateTime={a.published_at ?? undefined}>{fmtLongDate(a.published_at, a.language)}</time>
                  {" · "}
                  {Math.max(1, Math.round(a.word_count / 220))} min de lectura
                </p>
                <h2 className="b-head mt-1.5 text-xl font-semibold leading-snug sm:text-2xl">
                  <Link href={`${ctx.base}/${a.slug}`} className="hover:underline hover:underline-offset-4">
                    {a.title}
                  </Link>
                </h2>
                {a.meta_description && <p className="mt-2 leading-relaxed" style={{ color: "var(--b-muted)" }}>{a.meta_description}</p>}
                {!!a.tags?.length && (
                  <p className="mt-3 flex flex-wrap gap-2">
                    {a.tags.map((t) => (
                      <Link key={t} href={`${ctx.base || "/"}?tag=${encodeURIComponent(t)}`} className="rounded-full border px-2.5 py-1 text-xs" style={{ borderColor: "var(--b-line)" }}>
                        {t}
                      </Link>
                    ))}
                  </p>
                )}
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: "var(--b-muted)" }}>Todavía no hay artículos publicados.</p>
      )}

      {pages > 1 && (
        <nav aria-label="Paginación" className="mt-10 flex items-center justify-between gap-4 text-sm">
          {page > 1 ? <Link href={href(page - 1)} rel="prev" className="inline-flex min-h-11 items-center font-medium" style={{ color: "var(--b-accent)" }}>← Más recientes</Link> : <span />}
          <span style={{ color: "var(--b-muted)" }}>
            Página {page} de {pages}
          </span>
          {page < pages ? <Link href={href(page + 1)} rel="next" className="inline-flex min-h-11 items-center font-medium" style={{ color: "var(--b-accent)" }}>Anteriores →</Link> : <span />}
        </nav>
      )}
    </>
  );
}
