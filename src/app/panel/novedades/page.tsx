import { Megaphone } from "lucide-react";
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
        <ol className="relative max-w-3xl space-y-5 border-l border-line pl-6 md:pl-8">
          {updates.map((u, i) => (
            <li key={u.id} className="relative">
              <span className={`absolute -left-[31px] top-5 h-3 w-3 rounded-full ring-4 ring-paper-2 md:-left-[39px] ${i === 0 ? "bg-signal" : "bg-line-2"}`} aria-hidden />
              <Card className="p-5 transition-shadow hover:shadow-[var(--shadow-sm)] md:p-6">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {u.tag && (
                    <Badge tone={u.tag === "Nuevo" ? "signal" : "sky"} dot>
                      {u.tag}
                    </Badge>
                  )}
                  <time dateTime={u.published_at} className="text-xs text-ink-3">
                    {fmtDate(u.published_at, { day: "numeric", month: "long", year: "numeric" })}
                  </time>
                </div>
                <h2 className="text-lg font-semibold tracking-tight">{u.title}</h2>
                <MarkdownView md={u.body_md} className="mt-2 text-[14px]" />
              </Card>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState title="Sin novedades por ahora" icon={<Megaphone className="h-5 w-5" />}>Te avisaremos aquí de cada mejora.</EmptyState>
      )}
    </>
  );
}
