import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { MarkdownView } from "@/components/panel/markdown-view";
import { listProductUpdates } from "@/lib/panel/data";
import { fmtDate } from "@/lib/utils";

export const metadata = { title: "Novedades" };

export default async function UpdatesPage() {
  const updates = await listProductUpdates();
  return (
    <>
      <PageHeader title="Novedades" intro="Lo último que hemos lanzado para que tu contenido rinda más." />
      {updates.length ? (
        <ol className="relative space-y-6 border-l-2 border-line pl-6">
          {updates.map((u) => (
            <li key={u.id} className="relative">
              <span className="absolute -left-[33px] top-6 h-4 w-4 rounded-full border border-line bg-lime" aria-hidden />
              <Card className="p-6">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {u.tag && <Badge tone={u.tag === "Nuevo" ? "signal" : "sky"}>{u.tag}</Badge>}
                  <time dateTime={u.published_at} className="text-xs text-ink-3">
                    {fmtDate(u.published_at, { day: "numeric", month: "long", year: "numeric" })}
                  </time>
                </div>
                <h2 className="font-semibold tracking-tight text-lg">{u.title}</h2>
                <MarkdownView md={u.body_md} className="mt-2" />
              </Card>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState title="Sin novedades por ahora">Te avisaremos aquí de cada mejora.</EmptyState>
      )}
    </>
  );
}
