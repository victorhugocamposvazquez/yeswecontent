import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { ArticleEditor } from "@/components/panel/article-editor";
import { ArticleStatusBadge } from "@/components/panel/status";
import { getArticle, getCurrentSite, listContentItems } from "@/lib/data";
import { listIntegrations } from "@/lib/panel/data";
import { fmtDate } from "@/lib/utils";
import { publishNow, regenerateArticle, saveArticle, scheduleArticle } from "../../actions";
import { regenerateArticleImage } from "../image-actions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const a = await getArticle((await params).id);
  return { title: a?.title ?? "Artículo" };
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site = (await getCurrentSite())!;
  const article = await getArticle(id);
  if (!article) notFound();
  const [items, integrations] = await Promise.all([listContentItems(site.id), listIntegrations(site.id)]);
  const item = items.find((i) => i.id === article.content_item_id);
  const cms = integrations.find((i) => ["wordpress", "shopify", "webflow", "ghost", "webhook"].includes(i.provider));

  return (
    <>
      <ArticleEditor
        article={article}
        keyword={item?.keyword ?? ""}
        scheduledFor={item?.scheduled_for ?? null}
        site={{ name: site.name, url: site.url, min_words: site.seo_settings?.min_words, internal_links: site.seo_settings?.internal_links, schema: site.seo_settings?.schema }}
        cmsLabel={cms ? cms.provider.charAt(0).toUpperCase() + cms.provider.slice(1) : null}
        actions={{ save: saveArticle, regenerate: regenerateArticle, publish: publishNow, schedule: scheduleArticle }}
        imageAction={regenerateArticleImage}
        header={
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
            <Link href="/panel/articulos" className="-ml-1 inline-flex h-8 items-center gap-1 rounded-lg px-1.5 text-[13px] text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink">
              <ArrowLeft className="h-4 w-4" aria-hidden /> Artículos
            </Link>
            <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
            <ArticleStatusBadge status={article.status} />
            <span className="text-[13px] text-ink-3">Actualizado el {fmtDate(article.updated_at, { day: "numeric", month: "long" })}</span>
            {article.published_url && (
              <a href={article.published_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] font-medium text-signal hover:underline">
                Ver publicado <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            )}
          </div>
        }
      />
    </>
  );
}
