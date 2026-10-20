import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ActionForm } from "@/components/panel/action-form";
import { CarouselPreview } from "@/components/panel/carousel-preview";
import { CopyOpenButton } from "@/components/panel/copy-open-button";
import { LinkTabs } from "@/components/panel/tabs";
import { Badge, Card, EmptyState, PageHeader, Select, Textarea } from "@/components/ui";
import { getCurrentSite, listArticles, listSocialPosts } from "@/lib/data";
import { isDemo } from "@/lib/env";
import { listIntegrations } from "@/lib/panel/data";
import type { Integration, SocialPost } from "@/lib/types";
import { fmtDate } from "@/lib/utils";
import { updateSocialPost } from "../actions";

export const metadata = { title: "Social" };

const STATUS: Record<SocialPost["status"], { label: string; tone: "neutral" | "ok" | "warn" | "sky" | "bad" | "lime" }> = {
  suggested: { label: "Sugerida", tone: "lime" },
  approved: { label: "Aprobada", tone: "ok" },
  scheduled: { label: "Programada", tone: "sky" },
  published: { label: "Publicada", tone: "ok" },
  dismissed: { label: "Descartada", tone: "neutral" },
  failed: { label: "Error al publicar", tone: "bad" },
};

const TABS = [
  { id: "reddit", label: "Reddit" },
  { id: "quora", label: "Quora" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
];

/** ¿Está lista la cuenta para publicar en este canal? */
function channelReady(channel: string, integrations: Integration[]): { ready: boolean; reason: string | null } {
  if (channel === "quora") return { ready: true, reason: null };
  if (isDemo) return { ready: true, reason: null };
  const row = integrations.find((i) => i.provider === (channel === "reddit" ? "reddit" : "meta"));
  if (!row) return { ready: false, reason: channel === "reddit" ? "Conecta tu cuenta de Reddit para publicar las respuestas que apruebes." : "Conecta Instagram y Facebook para publicar los carruseles." };
  if (row.status !== "connected") return { ready: false, reason: "La conexión ha caducado. Vuelve a conectar la cuenta." };
  if (channel !== "reddit" && !row.meta?.page_id) return { ready: false, reason: "Elige tu página de Facebook para empezar a publicar." };
  if (channel === "instagram" && !row.meta?.ig_user_id) return { ready: false, reason: "Tu página de Facebook no tiene una cuenta profesional de Instagram vinculada." };
  return { ready: true, reason: null };
}

const hidden = (p: SocialPost, op: string) => (
  <>
    <input type="hidden" name="id" value={p.id} />
    <input type="hidden" name="op" value={op} />
  </>
);

function PublishedInfo({ p }: { p: SocialPost }) {
  if (p.status === "published")
    return (
      <p className="mt-3 text-xs text-ink-3">
        Publicada{p.published_at ? ` el ${fmtDate(p.published_at, { day: "numeric", month: "long" })}` : ""}
        {p.published_url && (
          <>
            {" · "}
            <a href={p.published_url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1 underline hover:text-ink sm:min-h-0">
              Ver publicación <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </>
        )}
      </p>
    );
  if (p.status === "failed")
    return (
      <div className="mt-3 rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">
        <p>{p.last_error ?? "No hemos podido publicarla."}</p>
        <ActionForm action={updateSocialPost} submitLabel="Reintentar" variant="ghost" inline className="mt-1">
          {hidden(p, "retry")}
        </ActionForm>
      </div>
    );
  return null;
}

export default async function SocialPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const sp = await searchParams;
  const tab = TABS.some((t) => t.id === sp.tab) ? sp.tab! : "reddit";
  const site = (await getCurrentSite())!;
  const [posts, articles, integrations] = await Promise.all([listSocialPosts(site.id), listArticles(site.id), listIntegrations(site.id)]);
  const rows = posts.filter((p) => p.channel === tab && p.status !== "dismissed");
  const isReply = tab === "reddit" || tab === "quora";
  const { ready, reason } = channelReady(tab, integrations);
  const time = site.schedule?.time ?? "09:00";

  return (
    <>
      <PageHeader
        title="Social"
        intro="Respuestas útiles en conversaciones donde tu marca aporta, y carruseles listos para publicar a partir de tus artículos. Nada sale sin tu aprobación."
      />
      <LinkTabs basePath="/panel/social" current={tab} tabs={TABS.map((t) => ({ ...t, count: posts.filter((p) => p.channel === t.id && p.status !== "dismissed").length }))} />

      {!ready && reason && (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-line bg-paper-2 p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-ink-2">{reason}</p>
          <Link href="/panel/ajustes/social" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink-2 sm:min-h-0">
            Ir a Redes sociales
          </Link>
        </div>
      )}
      {tab === "quora" && (
        <p className="mb-5 rounded-2xl border border-line bg-paper-2 p-4 text-sm text-ink-2">
          Quora no tiene una API pública para publicar, así que estas respuestas no salen solas: aprueba la que te guste, pulsa <strong className="font-medium">«Copiar y abrir en Quora»</strong> y pégala en la pregunta. Después márcala como publicada.
        </p>
      )}

      {!rows.length && (
        <EmptyState title="Nada pendiente por aquí">{isReply ? "Buscamos conversaciones nuevas cada día. Vuelve mañana." : "Cada artículo publicado genera un carrusel. Aparecerán aquí."}</EmptyState>
      )}

      <div className={isReply ? "space-y-4" : "grid gap-6 md:grid-cols-2"}>
        {rows.map((p) => {
          const art = articles.find((a) => a.id === p.article_id);
          const editable = p.status === "suggested" || p.status === "approved" || p.status === "failed";
          return isReply ? (
            <Card key={p.id} className="p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge>
                {p.thread_url && (
                  <a href={p.thread_url} target="_blank" rel="noreferrer" className="-my-2 inline-flex min-h-10 items-center gap-1 text-xs text-ink-3 hover:text-ink sm:min-h-0">
                    Ver conversación <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                )}
                {art && <span className="min-w-0 text-xs text-ink-3">· basada en «{art.title}»</span>}
                <span className="ml-auto text-xs text-ink-3">{p.status === "scheduled" && p.scheduled_for ? `Sale ${fmtDate(p.scheduled_for, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : fmtDate(p.created_at)}</span>
              </div>
              {editable ? (
                <ActionForm action={updateSocialPost} submitLabel="Guardar texto" variant="ghost" footerClassName="gap-2">
                  {hidden(p, "save")}
                  <label htmlFor={`c-${p.id}`} className="sr-only">
                    Texto de la respuesta
                  </label>
                  <Textarea id={`c-${p.id}`} name="content" rows={4} defaultValue={p.content} />
                </ActionForm>
              ) : (
                <p className="whitespace-pre-line text-sm text-ink-2">{p.content}</p>
              )}

              {tab === "reddit" && p.status === "suggested" && (
                <div className="mt-2 flex flex-wrap gap-2 border-t border-line pt-3">
                  <ActionForm action={updateSocialPost} submitLabel="Aprobar y publicar" inline>
                    {hidden(p, "approve")}
                  </ActionForm>
                  <ActionForm action={updateSocialPost} submitLabel="Descartar" variant="ghost" inline>
                    {hidden(p, "dismiss")}
                  </ActionForm>
                </div>
              )}
              {tab === "reddit" && p.status === "scheduled" && (
                <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-xs text-ink-3">
                  <span className="flex-1">Se publicará desde tu cuenta de Reddit en los próximos minutos.</span>
                  <ActionForm action={updateSocialPost} submitLabel="Cancelar" variant="ghost" inline>
                    {hidden(p, "unschedule")}
                  </ActionForm>
                </div>
              )}

              {tab === "quora" && (p.status === "suggested" || p.status === "approved") && (
                <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3 sm:flex-row sm:flex-wrap sm:items-center">
                  {p.thread_url && <CopyOpenButton text={p.content} url={p.thread_url} className="max-sm:w-full" />}
                  <ActionForm action={updateSocialPost} submitLabel="Ya la he publicado" variant="outline" inline>
                    {hidden(p, "manual")}
                  </ActionForm>
                  <ActionForm action={updateSocialPost} submitLabel="Descartar" variant="ghost" inline>
                    {hidden(p, "dismiss")}
                  </ActionForm>
                </div>
              )}
              <PublishedInfo p={p} />
            </Card>
          ) : (
            <Card key={p.id} className="p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge>
                {p.scheduled_for && p.status === "scheduled" && <span className="text-xs text-ink-3">{fmtDate(p.scheduled_for, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</span>}
              </div>
              <CarouselPreview slides={p.slides ?? [p.content]} brand={site.name} channel={p.channel} />
              <p className="mt-3 text-sm font-medium">{p.content}</p>
              {art && <p className="text-xs text-ink-3">A partir de «{art.title}»</p>}
              {(p.status === "suggested" || p.status === "approved") && (
                <div className="mt-3 space-y-2">
                  <ActionForm action={updateSocialPost} submitLabel="Programar" inline className="items-end">
                    {hidden(p, "schedule")}
                    <label htmlFor={`w-${p.id}`} className="sr-only">
                      Cuándo publicar
                    </label>
                    <Select id={`w-${p.id}`} name="when" defaultValue="d1" className="w-full sm:w-auto">
                      <option value="now">Ahora (en 15 min)</option>
                      <option value="d1">Mañana a las {time}</option>
                      <option value="d2">En 2 días a las {time}</option>
                      <option value="d3">En 3 días a las {time}</option>
                      <option value="d7">En una semana a las {time}</option>
                    </Select>
                  </ActionForm>
                  <ActionForm action={updateSocialPost} submitLabel="Descartar" variant="ghost" inline>
                    {hidden(p, "dismiss")}
                  </ActionForm>
                </div>
              )}
              {p.status === "scheduled" && (
                <ActionForm action={updateSocialPost} submitLabel="Cancelar programación" variant="ghost" inline className="mt-3">
                  {hidden(p, "unschedule")}
                </ActionForm>
              )}
              <PublishedInfo p={p} />
            </Card>
          );
        })}
      </div>
    </>
  );
}
