import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { ArticleStatusBadge, articleStatusLabel } from "@/components/panel/status";
import { Badge, Button, ButtonLink, Card, EmptyState, Input, PageHeader, Select } from "@/components/ui";
import { getCurrentSite, listArticles } from "@/lib/data";
import { scoreTone } from "@/lib/panel/score";
import type { ArticleStatus } from "@/lib/types";
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
          <ButtonLink href="/panel/plan?vista=lista" variant="outline">
            Escribir desde el plan
          </ButtonLink>
        }
      />

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:mb-5 sm:flex-wrap sm:px-0" aria-label="Filtrar por estado">
        <FilterChip href="/panel/articulos" active={!sp.estado} label="Todos" count={all.length} />
        {STATUSES.map((s) => {
          const c = all.filter((a) => a.status === s).length;
          return c ? <FilterChip key={s} href={`/panel/articulos?estado=${s}`} active={sp.estado === s} label={articleStatusLabel(s)} count={c} /> : null;
        })}
      </div>

      <form action="/panel/articulos" className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 sm:flex sm:flex-wrap sm:gap-3">
        {sp.estado && <input type="hidden" name="estado" value={sp.estado} />}
        <div className="relative col-span-2 sm:min-w-56 sm:flex-1">
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
              <Card className="relative p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/panel/articulos/${a.id}`} className="font-medium leading-snug after:absolute after:inset-0 after:rounded-2xl">
                    {a.title}
                  </Link>
                  <Badge tone={scoreTone(a.quality_score)} className="shrink-0">{a.quality_score ?? "—"}</Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-ink-3">/{a.slug}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-2">
                  <ArticleStatusBadge status={a.status} />
                  <span className="tabular-nums">{num(a.word_count)} palabras</span>
                  <span>{fmtDate(a.updated_at)}</span>
                  {a.published_url && (
                    <a href={a.published_url} target="_blank" rel="noreferrer" className="relative z-[1] -my-2 ml-auto grid h-10 w-10 place-items-center text-ink-3 hover:text-ink" aria-label={`Abrir ${a.title} publicado`}>
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
        <Card className="scroll-x max-md:hidden">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-3">
              <tr>
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Calidad</th>
                <th className="px-4 py-3 text-right font-medium">Palabras</th>
                <th className="px-4 py-3 font-medium">Actualizado</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Enlace</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-paper/60">
                  <td className="px-4 py-3">
                    <Link href={`/panel/articulos/${a.id}`} className="font-medium hover:underline">
                      {a.title}
                    </Link>
                    <span className="block text-xs text-ink-3">/{a.slug}</span>
                  </td>
                  <td className="px-4 py-3">
                    <ArticleStatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge tone={scoreTone(a.quality_score)}>{a.quality_score ?? "—"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-2">{num(a.word_count)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-2">{fmtDate(a.updated_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {a.published_url && (
                      <a href={a.published_url} target="_blank" rel="noreferrer" className="inline-flex text-ink-3 hover:text-ink" aria-label={`Abrir ${a.title} publicado`}>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState title="Ningún artículo con esos filtros">Cambia los filtros o escribe uno nuevo desde el plan de contenidos.</EmptyState>
      )}
    </>
  );
}

function FilterChip({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-full border px-3.5 py-1 text-sm transition sm:min-h-0 ${active ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink-2 hover:border-ink"}`}
    >
      {label} <span className="ml-1 opacity-70">{count}</span>
    </Link>
  );
}
