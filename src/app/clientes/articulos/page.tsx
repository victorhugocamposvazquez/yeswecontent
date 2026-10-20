import Link from "next/link";
import { ChevronRight, ExternalLink, Lock } from "lucide-react";
import { ArticleStatusBadge, ContentStatusBadge, articleStatusLabel } from "@/components/panel/status";
import { Card, EmptyState } from "@/components/ui";
import { agencyName, getPortal, getPortalResults } from "@/lib/clientes/data";
import type { ArticleStatus } from "@/lib/types";
import { cn, fmtDate, num } from "@/lib/utils";

export const metadata = { title: "Artículos" };

const FILTERS: (ArticleStatus | "todos")[] = ["todos", "published", "scheduled", "review"];

export default async function ClientArticlesPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const sp = await searchParams;
  const { site, client, agency } = await getPortal();
  const res = await getPortalResults(site);
  const full = client.visibility_mode === "completo";
  const published = res.articles.filter((a) => a.status === "published").sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));

  // Modo "solo resultados": lista de lo publicado con enlace a la web, sin plan ni borradores.
  if (!full) {
    return (
      <div className="space-y-6">
        <Header title="Artículos publicados" intro={`${published.length} artículos ya están en tu web.`} />
        <p className="flex items-start gap-2 rounded-xl border border-line bg-card p-3.5 text-[13px] text-ink-2 shadow-[var(--shadow-xs)]">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" aria-hidden />
          {agencyName(agency)} se encarga del plan y de la redacción. Si quieres ver los borradores antes de publicarse, pídeselo desde «Habla con tu equipo».
        </p>
        <PublishedList items={published} />
      </div>
    );
  }

  const estado = FILTERS.includes(sp.estado as ArticleStatus) ? (sp.estado as ArticleStatus) : "todos";
  const rows = res.articles.filter((a) => estado === "todos" || a.status === estado);
  const plan = res.items
    .filter((i) => ["planned", "writing"].includes(i.status) && i.scheduled_for)
    .sort((a, b) => a.scheduled_for!.localeCompare(b.scheduled_for!));

  return (
    <div className="space-y-6">
      <Header title="Artículos" intro="Todo lo que escribimos para tu web, en solo lectura. Toca un artículo para leerlo." />

      <nav aria-label="Filtrar por estado" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {FILTERS.map((f) => {
          const count = f === "todos" ? res.articles.length : res.articles.filter((a) => a.status === f).length;
          const on = estado === f;
          return (
            <Link
              key={f}
              href={f === "todos" ? "/clientes/articulos" : `/clientes/articulos?estado=${f}`}
              aria-current={on ? "page" : undefined}
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors sm:h-9",
                on ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink-2 hover:border-line-2 hover:bg-paper-2",
              )}
            >
              {f === "todos" ? "Todos" : articleStatusLabel(f)} <span className="opacity-70">{count}</span>
            </Link>
          );
        })}
      </nav>

      {rows.length ? (
        <Card>
          <ul className="divide-y divide-line">
            {rows.map((a) => (
              <li key={a.id}>
                <Link href={`/clientes/articulos/${a.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-paper-2 sm:px-5">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium leading-snug">{a.title}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
                      <ArticleStatusBadge status={a.status} />
                      <span>{num(a.word_count)} palabras</span>
                      <span>{a.published_at ? `Publicado el ${fmtDate(a.published_at)}` : `Actualizado el ${fmtDate(a.updated_at)}`}</span>
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-ink-3" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <EmptyState title="Nada por aquí">No hay artículos con ese estado ahora mismo.</EmptyState>
      )}

      <section>
        <h2 className="mb-1 text-lg font-semibold tracking-tight">Plan de contenidos</h2>
        <p className="mb-3 text-sm text-ink-3">Temas elegidos para las próximas semanas según lo que busca tu público.</p>
        {plan.length ? (
          <Card>
            <ul className="divide-y divide-line">
              {plan.map((i) => (
                <li key={i.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                  <span className="w-12 shrink-0 rounded-md bg-paper-2 py-0.5 text-center text-[11px] font-semibold uppercase text-ink-2">{fmtDate(i.scheduled_for!)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] leading-snug">{i.title}</span>
                    <span className="text-xs text-ink-3">
                      «{i.keyword}»{i.search_volume ? ` · ${num(i.search_volume)} búsquedas/mes` : ""}
                    </span>
                  </span>
                  <span className="shrink-0">
                    <ContentStatusBadge status={i.status} />
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <p className="text-sm text-ink-3">El plan del próximo mes está en preparación.</p>
        )}
      </section>
    </div>
  );
}

function Header({ title, intro }: { title: string; intro: string }) {
  return (
    <header>
      <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight md:text-[1.9rem]">{title}</h1>
      <p className="mt-1 text-sm text-ink-2">{intro}</p>
    </header>
  );
}

function PublishedList({ items }: { items: Awaited<ReturnType<typeof getPortalResults>>["articles"] }) {
  if (!items.length) return <EmptyState title="Tus primeros artículos están en camino">Te avisaremos en cuanto se publiquen.</EmptyState>;
  return (
    <Card>
      <ul className="divide-y divide-line">
        {items.map((a) => (
          <li key={a.id}>
            <a
              href={a.published_url ?? undefined}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-paper-2 sm:px-5"
              aria-label={`${a.title} (se abre en tu web)`}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium leading-snug">{a.title}</span>
                <span className="text-xs text-ink-3">{a.published_at ? fmtDate(a.published_at, { day: "numeric", month: "long", year: "numeric" }) : ""}</span>
              </span>
              <ExternalLink className="h-4 w-4 shrink-0 text-ink-3" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}
