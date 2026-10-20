import Link from "next/link";
import { ExternalLink, FileText, Search } from "lucide-react";
import { CellText, DataTable, TableCount, rowIconBtn } from "@/components/panel/data-table";
import { ArticleStatusBadge, articleStatusLabel } from "@/components/panel/status";
import { FilterChip } from "@/components/panel/tabs";
import { Badge, Button, ButtonLink, Card, EmptyState, Input, PageHeader, Select } from "@/components/ui";
import { getCurrentSite, listArticles } from "@/lib/data";
import { scoreTone } from "@/lib/panel/score";
import type { Article, ArticleStatus } from "@/lib/types";
import { fmtDate, num } from "@/lib/utils";

export const metadata = { title: "Artículos" };

const STATUSES: ArticleStatus[] = ["draft", "review", "scheduled", "published", "failed"];

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ estado?: string; calidad?: string; q?: string }> }) {
  const sp = await searchParams;
  const site = (await getCurrentSite())!;
  const all = await listArticles(site.id);
  const q = (sp.q ?? "").toLowerCase();
  const rows = all.filter((a) => {
    if (sp.estado && a.status !== sp.estado) return false;
    const s = a.quality_score ?? 0;
    if (sp.calidad === "alta" && s < 85) return false;
    if (sp.calidad === "media" && (s < 65 || s >= 85)) return false;
    if (sp.calidad === "baja" && s >= 65) return false;
    if (q && !a.title.toLowerCase().includes(q)) return false;
    return true;
  });
  const avg = all.length ? Math.round(all.reduce((acc, a) => acc + (a.quality_score ?? 0), 0) / all.length) : 0;

  return (
    <>
      <PageHeader
        title="Artículos"
        intro={`${all.length} artículos · calidad media ${avg}/100. Revisa, edita y publica cuando quieras.`}
        actions={
          <ButtonLink href="/panel/plan?vista=lista" variant="outline" size="sm">
            Escribir desde el plan
          </ButtonLink>
        }
      />

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Filtrar por estado">
        <FilterChip href="/panel/articulos" active={!sp.estado} label="Todos" count={all.length} />
        {STATUSES.map((s) => {
          const c = all.filter((a) => a.status === s).length;
          return c ? <FilterChip key={s} href={`/panel/articulos?estado=${s}`} active={sp.estado === s} label={articleStatusLabel(s)} count={c} /> : null;
        })}
      </div>

      <form action="/panel/articulos" className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 sm:flex sm:flex-wrap sm:gap-2">
        {sp.estado && <input type="hidden" name="estado" value={sp.estado} />}
        <div className="relative col-span-2 sm:min-w-56 sm:flex-1 sm:max-w-sm">
          <label htmlFor="q" className="sr-only">
            Buscar por título
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <Input id="q" name="q" defaultValue={sp.q} placeholder="Buscar por título…" className="pl-9" />
        </div>
        <div className="min-w-0 sm:w-48">
          <label htmlFor="calidad" className="sr-only">
            Calidad
          </label>
          <Select id="calidad" name="calidad" defaultValue={sp.calidad ?? ""}>
            <option value="">Cualquier puntuación</option>
            <option value="alta">Alta (85+)</option>
            <option value="media">Media (65–84)</option>
            <option value="baja">Baja (&lt;65)</option>
          </Select>
        </div>
        <Button type="submit" variant="outline" className="max-sm:min-h-11">
          Aplicar
        </Button>
      </form>

      {rows.length > 0 && (
        <ul className="space-y-3 md:hidden">
          {rows.map((a) => (
            <li key={a.id}>
              <Card className="relative p-4 transition-shadow hover:shadow-[var(--shadow-sm)]">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/panel/articulos/${a.id}`} className="font-medium leading-snug after:absolute after:inset-0 after:rounded-2xl">
                    {a.title}
                  </Link>
                  <Badge tone={scoreTone(a.quality_score)} className="tabular shrink-0">
                    {a.quality_score ?? "—"}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-ink-3">/{a.slug}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-2">
                  <ArticleStatusBadge status={a.status} />
                  <span className="tabular">{num(a.word_count)} palabras</span>
                  <span>{fmtDate(a.updated_at)}</span>
                  {a.published_url && (
                    <a href={a.published_url} target="_blank" rel="noreferrer" className="relative z-[1] -my-2 ml-auto grid h-11 w-11 place-items-center rounded-lg text-ink-3 hover:bg-paper-2 hover:text-ink" aria-label={`Abrir ${a.title} publicado`}>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
      {rows.length ? (
        <DataTable<Article>
          rows={rows}
          rowKey={(a) => a.id}
          minWidth={760}
          caption="Artículos"
          columns={[
            {
              key: "title",
              header: "Título",
              className: "max-w-[28rem]",
              cell: (a) => (
                <CellText
                  primary={
                    <Link href={`/panel/articulos/${a.id}`} className="hover:underline">
                      {a.title}
                    </Link>
                  }
                  secondary={`/${a.slug}`}
                />
              ),
            },
            { key: "status", header: "Estado", cell: (a) => <ArticleStatusBadge status={a.status} /> },
            {
              key: "score",
              header: "Calidad",
              numeric: true,
              cell: (a) => (
                <Badge tone={scoreTone(a.quality_score)} className="tabular">
                  {a.quality_score ?? "—"}
                </Badge>
              ),
            },
            { key: "words", header: "Palabras", numeric: true, cell: (a) => <span className="text-ink-2">{num(a.word_count)}</span> },
            { key: "updated", header: "Actualizado", className: "whitespace-nowrap", cell: (a) => <span className="text-ink-2">{fmtDate(a.updated_at)}</span> },
            {
              key: "link",
              header: "Enlace",
              srOnly: true,
              className: "w-12 text-right",
              cell: (a) =>
                a.published_url ? (
                  <a href={a.published_url} target="_blank" rel="noreferrer" className={rowIconBtn} aria-label={`Abrir ${a.title} publicado`}>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null,
            },
          ]}
          footer={
            <>
              <TableCount shown={rows.length} total={all.length} unit="artículos" />
              <span>Calidad media {avg}/100</span>
            </>
          }
        />
      ) : (
        <EmptyState title="Ningún artículo con esos filtros" icon={<FileText className="h-5 w-5" />} action={<ButtonLink href="/panel/articulos" variant="outline" size="sm">Quitar filtros</ButtonLink>}>
          Cambia los filtros o escribe uno nuevo desde el plan de contenidos.
        </EmptyState>
      )}
    </>
  );
}
