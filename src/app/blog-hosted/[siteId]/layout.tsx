import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { getBlogContext } from "@/lib/headless/blog";

/**
 * Blog alojado: pensado para servirse en blog.cliente.com (CNAME) o en
 * cliente.com/blog (proxy inverso con X-Forwarded-Prefix: /blog).
 */
export default async function HostedBlogLayout({ children, params }: { children: ReactNode; params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const ctx = await getBlogContext(siteId);
  if (!ctx) notFound();
  const { theme: t, site, base } = ctx;

  const vars = {
    "--b-accent": t.accent,
    "--b-bg": t.background,
    "--b-surface": t.surface,
    "--b-text": t.text,
    "--b-muted": t.muted,
    "--b-line": t.line,
    "--b-font": t.serif ? "ui-serif, Georgia, 'Times New Roman', serif" : "var(--font-body), system-ui, sans-serif",
  } as CSSProperties;

  return (
    <div style={vars} data-look={t.look} className="ywc-blog min-h-dvh">
      <style>{`
.ywc-blog{background:var(--b-bg);color:var(--b-text);font-family:var(--font-body),system-ui,sans-serif}
.ywc-blog[data-look="tienda"] .b-wrap{max-width:64rem}
.ywc-blog[data-look="editorial"] .b-head{font-weight:500}
.ywc-blog a:focus-visible{outline:2px solid var(--b-accent);outline-offset:2px;border-radius:4px}
.ywc-blog .b-head{font-family:var(--b-font);letter-spacing:-.025em;text-wrap:balance}
.ywc-blog .b-tag{display:inline-flex;align-items:center;min-height:2rem;padding:0 .7rem;border-radius:999px;border:1px solid var(--b-line);font-size:.75rem;font-weight:500;transition:background-color .15s}
.ywc-blog .b-tag:hover{background:var(--b-surface)}
.ywc-prose{font-size:1.0625rem;line-height:1.75;color:var(--b-text);overflow-wrap:anywhere}
.ywc-prose>*+*{margin-top:1.1em}
.ywc-prose h2{font-family:var(--b-font);font-size:1.6rem;line-height:1.25;margin-top:2em;font-weight:600;letter-spacing:-.02em}
.ywc-prose h3{font-size:1.2rem;line-height:1.35;margin-top:1.6em;font-weight:600}
.ywc-prose a{color:var(--b-accent);text-decoration:underline;text-underline-offset:3px}
.ywc-prose ul{list-style:disc;padding-left:1.4em}.ywc-prose ol{list-style:decimal;padding-left:1.4em}
.ywc-prose li+li{margin-top:.35em}
.ywc-prose blockquote{border-left:3px solid var(--b-accent);padding-left:1em;font-style:italic;color:var(--b-muted)}
.ywc-prose code{background:var(--b-line);padding:.1em .35em;border-radius:4px;font-size:.9em}
.ywc-prose strong{font-weight:600}
.ywc-prose img{max-width:100%;height:auto;border-radius:12px}
.ywc-prose .ywc-faq{margin-top:3em;padding-top:1.5em;border-top:1px solid var(--b-line)}
`}</style>
      <header className="sticky top-0 z-10 border-b backdrop-blur" style={{ borderColor: "var(--b-line)", background: "color-mix(in srgb, var(--b-bg) 90%, transparent)" }}>
        <div className="b-wrap mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href={base || "/"} className="flex min-w-0 items-center gap-2.5">
            {t.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.logoUrl} alt="" className="h-8 w-auto max-w-[10rem] object-contain" />
            ) : (
              <span className="b-head truncate text-lg font-semibold">{site.name}</span>
            )}
          </Link>
          <a href={site.url} className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium underline-offset-4 hover:underline" style={{ color: "var(--b-accent)" }}>
            Ir a {site.name.length > 18 ? "la web" : site.name} →
          </a>
        </div>
      </header>
      <main className="b-wrap mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">{children}</main>
      <footer className="border-t" style={{ borderColor: "var(--b-line)" }}>
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm sm:px-6" style={{ color: "var(--b-muted)" }}>
          <span>
            © {new Date().getFullYear()} {site.name}
          </span>
          <a href={ctx.feedUrl} className="inline-flex min-h-11 items-center underline underline-offset-4">
            RSS
          </a>
        </div>
      </footer>
    </div>
  );
}
