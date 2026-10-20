import { ExternalLink } from "lucide-react";
import { ActionForm } from "@/components/panel/action-form";
import { CarouselPreview } from "@/components/panel/carousel-preview";
import { LinkTabs } from "@/components/panel/tabs";
import { Badge, Card, EmptyState, PageHeader, Textarea } from "@/components/ui";
import { getCurrentSite, listArticles, listSocialPosts } from "@/lib/data";
import type { SocialPost } from "@/lib/types";
import { fmtDate } from "@/lib/utils";
import { updateSocialPost } from "../actions";

export const metadata = { title: "Social" };

const STATUS: Record<SocialPost["status"], { label: string; tone: "neutral" | "ok" | "warn" | "sky" | "bad" | "lime" }> = {
  suggested: { label: "Sugerida", tone: "lime" },
  approved: { label: "Aprobada", tone: "ok" },
  scheduled: { label: "Programada", tone: "sky" },
  published: { label: "Publicada", tone: "ok" },
  dismissed: { label: "Descartada", tone: "neutral" },
};

const TABS = [
  { id: "reddit", label: "Reddit" },
  { id: "quora", label: "Quora" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
];

export default async function SocialPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const sp = await searchParams;
  const tab = TABS.some((t) => t.id === sp.tab) ? sp.tab! : "reddit";
  const site = (await getCurrentSite())!;
  const [posts, articles] = await Promise.all([listSocialPosts(site.id), listArticles(site.id)]);
  const rows = posts.filter((p) => p.channel === tab && p.status !== "dismissed");
  const isReply = tab === "reddit" || tab === "quora";

  return (
    <>
      <PageHeader
        title="Social"
        intro="Respuestas útiles en conversaciones donde tu marca aporta, y carruseles listos para publicar a partir de tus artículos. Nada sale sin tu aprobación."
      />
      <LinkTabs basePath="/panel/social" current={tab} tabs={TABS.map((t) => ({ ...t, count: posts.filter((p) => p.channel === t.id && p.status !== "dismissed").length }))} />

      {!rows.length && (
        <EmptyState title="Nada pendiente por aquí">{isReply ? "Buscamos conversaciones nuevas cada día. Vuelve mañana." : "Cada artículo publicado genera un carrusel. Aparecerán aquí."}</EmptyState>
      )}

      <div className={isReply ? "space-y-4" : "grid gap-6 md:grid-cols-2"}>
        {rows.map((p) => {
          const art = articles.find((a) => a.id === p.article_id);
          return isReply ? (
            <Card key={p.id} className="p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge>
                {p.thread_url && (
                  <a href={p.thread_url} target="_blank" rel="noreferrer" className="-my-2 inline-flex min-h-10 items-center gap-1 text-xs text-ink-3 hover:text-ink sm:min-h-0">
                    Ver conversación <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                )}
                {art && <span className="text-xs text-ink-3">· basada en «{art.title}»</span>}
                <span className="ml-auto text-xs text-ink-3">{fmtDate(p.created_at)}</span>
              </div>
              <ActionForm action={updateSocialPost} submitLabel="Guardar texto" variant="ghost" footerClassName="gap-2">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="op" value="save" />
                <label htmlFor={`c-${p.id}`} className="sr-only">
                  Texto de la respuesta
                </label>
                <Textarea id={`c-${p.id}`} name="content" rows={4} defaultValue={p.content} />
              </ActionForm>
              {p.status === "suggested" && (
                <div className="mt-2 flex flex-wrap gap-2 border-t border-line pt-3">
                  <ActionForm action={updateSocialPost} submitLabel="Aprobar y publicar" inline>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="op" value="approve" />
                  </ActionForm>
                  <ActionForm action={updateSocialPost} submitLabel="Descartar" variant="ghost" inline>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="op" value="dismiss" />
                  </ActionForm>
                </div>
              )}
            </Card>
          ) : (
            <Card key={p.id} className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge>
                {p.scheduled_for && <span className="text-xs text-ink-3">{fmtDate(p.scheduled_for, { day: "numeric", month: "long" })}</span>}
              </div>
              <CarouselPreview slides={p.slides ?? [p.content]} brand={site.name} channel={p.channel} />
              <p className="mt-3 text-sm font-medium">{p.content}</p>
              {art && <p className="text-xs text-ink-3">A partir de «{art.title}»</p>}
              {(p.status === "suggested" || p.status === "approved") && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <ActionForm action={updateSocialPost} submitLabel="Programar" inline>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="op" value="schedule" />
                  </ActionForm>
                  <ActionForm action={updateSocialPost} submitLabel="Descartar" variant="ghost" inline>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="op" value="dismiss" />
                  </ActionForm>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
