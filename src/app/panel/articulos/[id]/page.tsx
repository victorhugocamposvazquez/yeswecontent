import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
      <Link href="/panel/articulos" className="mb-2 -mt-2 inline-flex min-h-10 items-center gap-1.5 text-sm text-ink-3 hover:text-ink sm:mt-0 sm:mb-4 sm:min-h-0">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Artículos
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <ArticleStatusBadge status={article.status} />
        <span className="text-sm text-ink-3">
          Actualizado el {fmtDate(article.updated_at, { day: "numeric", month: "long" })}
          {article.published_url && (
            <>
              {" · "}
              <a href={article.published_url} target="_blank" rel="noreferrer" className="text-signal underline">
                Ver publicado
              </a>
            </>
          )}
        </span>
      </div>
      <ArticleEditor
        article={article}
        keyword={item?.keyword ?? ""}
        scheduledFor={item?.scheduled_for ?? null}
        site={{ name: site.name, url: site.url, min_words: site.seo_settings?.min_words, internal_links: site.seo_settings?.internal_links, schema: site.seo_settings?.schema }}
        cmsLabel={cms ? cms.provider.charAt(0).toUpperCase() + cms.provider.slice(1) : null}
        actions={{ save: saveArticle, regenerate: regenerateArticle, publish: publishNow, schedule: scheduleArticle }}
        imageAction={regenerateArticleImage}
      />
    </>
  );
}
