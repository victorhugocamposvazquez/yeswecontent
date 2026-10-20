import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { MarkdownView } from "@/components/panel/markdown-view";
import { ArticleStatusBadge } from "@/components/panel/status";
import { Card } from "@/components/ui";
import { getPortal, getPortalResults } from "@/lib/clientes/data";
import { fmtDate, num } from "@/lib/utils";

export const metadata = { title: "Artículo" };

export default async function ClientArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { site, client } = await getPortal();
  if (client.visibility_mode !== "completo") redirect("/clientes/articulos");
  const res = await getPortalResults(site);
  const a = res.articles.find((x) => x.id === id && x.site_id === site.id);
  if (!a) notFound();

  return (
    <article className="space-y-5">
      <Link href="/clientes/articulos" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Artículos
      </Link>
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-3">
          <ArticleStatusBadge status={a.status} />
          <span>{num(a.word_count)} palabras</span>
          <span>{a.published_at ? `Publicado el ${fmtDate(a.published_at, { day: "numeric", month: "long", year: "numeric" })}` : `Actualizado el ${fmtDate(a.updated_at)}`}</span>
        </div>
        <h1 className="text-[1.6rem] font-semibold leading-tight tracking-tight sm:text-[2rem]">{a.title}</h1>
        {a.meta_description && <p className="text-[15px] text-ink-2">{a.meta_description}</p>}
        {a.published_url && (
          <a
            href={a.published_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-card px-4 text-sm font-semibold hover:border-signal"
          >
            Verlo en tu web <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        )}
      </header>

      <Card className="p-4 sm:p-8">
        <MarkdownView md={a.body_md} className="max-w-none text-[16px]" />
        {a.faq.length > 0 && (
          <section className="mt-8 border-t border-line pt-6">
            <h2 className="mb-3 text-lg font-semibold">Preguntas frecuentes</h2>
            <dl className="space-y-4">
              {a.faq.map((f) => (
                <div key={f.q}>
                  <dt className="font-medium">{f.q}</dt>
                  <dd className="mt-1 text-ink-2">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </Card>
      <p className="text-center text-xs text-ink-3">Vista de solo lectura. Si quieres cambiar algo, escríbenos desde «Habla con tu equipo».</p>
    </article>
  );
}
