"use client";

import { useActionState, useMemo, useState, type ReactNode } from "react";
import { CalendarClock, Code2, Eye, FileCode2, Lightbulb, Plus, RefreshCw, Search, Send, Trash2 } from "lucide-react";
import { Progress, ScoreRing } from "@/components/charts";
import { Card, CardHeader, Field, Input, Textarea } from "@/components/ui";
import type { ImageAction } from "@/lib/images/action-types";
import type { FormAction } from "@/lib/panel/action-types";
import { buildJsonLd } from "@/lib/panel/jsonld";
import { markdownToHtml, proseClass } from "@/lib/panel/markdown";
import { SCORE_LABELS, scoreArticle } from "@/lib/panel/score";
import type { Article } from "@/lib/types";
import { cn, num, slugify } from "@/lib/utils";
import { Notice, SubmitButton } from "./action-form";
import { ArticleImages } from "./article-images";

type Actions = { save: FormAction; regenerate: FormAction; publish: FormAction; schedule: FormAction };
type Tab = "edit" | "preview" | "seo";

const TABS: { id: Tab; label: string; icon: typeof Eye }[] = [
  { id: "edit", label: "Markdown", icon: FileCode2 },
  { id: "preview", label: "Vista previa", icon: Eye },
  { id: "seo", label: "SEO", icon: Search },
];

export function ArticleEditor({
  article,
  keyword: initialKeyword,
  scheduledFor,
  site,
  cmsLabel,
  actions,
  imageAction,
  header,
}: {
  article: Article;
  keyword: string;
  scheduledFor: string | null;
  site: { name: string; url: string; min_words?: number; internal_links?: number; schema?: boolean };
  cmsLabel: string | null;
  actions: Actions;
  /** Regenerar portada / imágenes interiores / infografía. */
  imageAction?: ImageAction;
  /** Migas, estado y fecha: se pintan en la barra superior. */
  header?: ReactNode;
}) {
  const [title, setTitle] = useState(article.title);
  const [slug, setSlug] = useState(article.slug);
  const [meta, setMeta] = useState(article.meta_description ?? "");
  const [body, setBody] = useState(article.body_md);
  const [faq, setFaq] = useState(article.faq ?? []);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [cover, setCover] = useState(article.cover_url);
  const [images, setImages] = useState(article.images ?? []);
  const [tab, setTab] = useState<Tab>("edit");

  const [saveState, saveAction] = useActionState(actions.save, null);
  const [regenState, regenAction] = useActionState(actions.regenerate, null);
  const [pubState, pubAction] = useActionState(actions.publish, null);
  const [schedState, schedAction] = useActionState(actions.schedule, null);

  const score = useMemo(
    () => scoreArticle({ title, body_md: body, keyword, meta_description: meta, faq, schema: site.schema, min_words: site.min_words, internal_links: site.internal_links }),
    [title, body, keyword, meta, faq, site.schema, site.min_words, site.internal_links],
  );
  const html = useMemo(() => markdownToHtml(body), [body]);
  const jsonLd = useMemo(() => JSON.stringify(buildJsonLd({ title, meta_description: meta, faq }, site), null, 2), [title, meta, faq, site]);
  const host = site.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const tone = (v: number) => (v >= 85 ? "ok" : v >= 65 ? "warn" : "bad");

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Barra superior */}
      <Card className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5">
        <div className="min-w-0 flex-1">{header}</div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <form action={regenAction}>
            <input type="hidden" name="id" value={article.id} />
            <SubmitButton variant="outline" pendingLabel="Regenerando…" className="h-9 px-3.5 text-[13px]">
              <RefreshCw className="h-4 w-4" aria-hidden /> Regenerar con IA
            </SubmitButton>
          </form>
          <form action={pubAction}>
            <input type="hidden" name="id" value={article.id} />
            <SubmitButton pendingLabel="Publicando…" className="h-9 px-3.5 text-[13px]">
              <Send className="h-4 w-4" aria-hidden /> Publicar ahora
            </SubmitButton>
          </form>
        </div>
        {(pubState || regenState) && (
          <div className="flex flex-wrap gap-2 md:basis-full">
            <Notice state={pubState} />
            <Notice state={regenState} />
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 md:gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <form action={saveAction} className="min-w-0">
          <input type="hidden" name="id" value={article.id} />
          <input type="hidden" name="faq" value={JSON.stringify(faq)} />
          <input type="hidden" name="body_md" value={body} />

          <Card className="overflow-hidden">
            {/* Título */}
            <div className="border-b border-line px-4 pb-3 pt-4 md:px-5">
              <label htmlFor="art-title" className="sr-only">
                Título (H1 y título SEO)
              </label>
              <input
                id="art-title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título del artículo"
                className="w-full border-0 bg-transparent p-0 text-xl font-semibold tracking-tight text-ink outline-none placeholder:text-ink-3 md:text-2xl"
              />
              <p className={cn("mt-1 text-xs", title.length > 60 ? "text-bad" : "text-ink-3")}>
                <span className="tabular">{title.length}</span>/60 caracteres recomendados
              </p>
            </div>

            {/* Pestañas */}
            <div role="tablist" aria-label="Modo del editor" className="no-scrollbar flex items-center gap-0.5 overflow-x-auto border-b border-line bg-paper-2/60 px-2 md:px-3">
              {TABS.map((t) => {
                const on = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    aria-controls={`panel-${t.id}`}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "relative -mb-px inline-flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 text-[13px] font-medium transition-colors duration-150 md:h-10",
                      on ? "border-signal text-ink" : "border-transparent text-ink-3 hover:text-ink",
                    )}
                  >
                    <t.icon className={cn("h-4 w-4", on ? "text-signal" : "text-ink-3")} aria-hidden />
                    {t.label}
                    {t.id === "seo" && <span className={cn("tabular rounded-full px-1.5 py-px text-[11px]", on ? "bg-signal-soft text-signal" : "bg-paper-3 text-ink-2")}>{score.score}</span>}
                  </button>
                );
              })}
              <span className="tabular ml-auto hidden pr-1 text-xs text-ink-3 sm:block">{num(score.word_count)} palabras</span>
            </div>

            {/* Markdown */}
            <div id="panel-edit" role="tabpanel" className={cn(tab !== "edit" && "hidden")}>
              <label htmlFor="body" className="sr-only">
                Texto del artículo en Markdown
              </label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                spellCheck
                className="h-[65svh] min-h-80 w-full resize-y border-0 bg-card p-4 font-mono text-[13px] leading-relaxed outline-none focus:bg-paper-2/40 md:h-[600px] md:p-5"
              />
            </div>

            {/* Vista previa */}
            <div id="panel-preview" role="tabpanel" className={cn("bg-white p-5 md:h-[600px] md:overflow-y-auto md:p-8", tab !== "preview" && "hidden")}>
              <div className="mx-auto max-w-2xl">
                {cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt={images.find((i) => i.kind === "cover")?.alt ?? ""} className="mb-5 aspect-video w-full rounded-xl object-cover" />
                )}
                <h1 className="mb-4 text-2xl font-semibold leading-tight tracking-tight">{title}</h1>
                <div className={proseClass} dangerouslySetInnerHTML={{ __html: html }} />
                {faq.length > 0 && (
                  <div className={cn(proseClass, "mt-6")}>
                    <h2>Preguntas frecuentes</h2>
                    {faq.map((f, i) => (
                      <div key={i}>
                        <h3>{f.q}</h3>
                        <p>{f.a}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SEO */}
            <div id="panel-seo" role="tabpanel" className={cn("space-y-5 p-4 md:p-5", tab !== "seo" && "hidden")}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Slug (URL)">
                  <Input name="slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value) || e.target.value)} />
                </Field>
                <Field label="Palabra clave principal">
                  <Input name="keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                </Field>
              </div>
              <Field label="Meta descripción" hint={`${meta.length}/160 caracteres`}>
                <Textarea name="meta_description" rows={2} value={meta} onChange={(e) => setMeta(e.target.value)} />
              </Field>
              <div>
                <p className="mb-1.5 text-[13px] font-medium text-ink-2">Así se verá en Google</p>
                <div className="rounded-xl border border-line bg-white p-4 font-sans shadow-[var(--shadow-xs)]">
                  <p className="truncate text-xs text-[#4d5156]">
                    {host} › blog › {slug}
                  </p>
                  <p className={cn("mt-0.5 truncate text-lg leading-snug text-[#1a0dab]", title.length > 60 && "text-bad")}>{title.length > 60 ? `${title.slice(0, 58)}…` : title || "Sin título"}</p>
                  <p className="line-clamp-2 text-sm text-[#4d5156]">{meta ? (meta.length > 160 ? `${meta.slice(0, 157)}…` : meta) : "Añade una meta descripción para controlar este texto."}</p>
                </div>
              </div>

              <div className="rounded-xl border border-line">
                <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
                  <div>
                    <h2 className="text-[15px] font-semibold tracking-tight">Preguntas frecuentes</h2>
                    <p className="text-[13px] text-ink-3">Se publican al final del artículo y en el schema FAQPage.</p>
                  </div>
                  <button type="button" onClick={() => setFaq([...faq, { q: "", a: "" }])} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] border border-line-2 bg-card px-3 text-[13px] font-medium shadow-[var(--shadow-xs)] transition-colors hover:bg-paper-2 max-sm:h-11">
                    <Plus className="h-4 w-4" aria-hidden /> Añadir
                  </button>
                </div>
                <ol className="space-y-3 p-4">
                  {faq.map((f, i) => (
                    <li key={i} className="rounded-xl border border-line bg-paper-2/50 p-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          <label className="sr-only" htmlFor={`faq-q-${i}`}>
                            Pregunta {i + 1}
                          </label>
                          <Input id={`faq-q-${i}`} placeholder="Pregunta" value={f.q} onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
                          <label className="sr-only" htmlFor={`faq-a-${i}`}>
                            Respuesta {i + 1}
                          </label>
                          <Textarea id={`faq-a-${i}`} rows={2} placeholder="Respuesta breve y directa" value={f.a} onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
                        </div>
                        <button type="button" onClick={() => setFaq(faq.filter((_, j) => j !== i))} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-bad-soft hover:text-bad" aria-label={`Eliminar pregunta ${i + 1}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                  {!faq.length && <p className="text-[13px] text-ink-3">Sin preguntas todavía.</p>}
                </ol>
              </div>

              <details className="group rounded-xl border border-line">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[13px] font-medium [&::-webkit-details-marker]:hidden">
                  <Code2 className="h-4 w-4 text-ink-3" aria-hidden /> Datos estructurados (JSON-LD)
                  <span className="ml-auto text-xs font-normal text-ink-3 group-open:hidden">Ver</span>
                </summary>
                <pre className="overflow-x-auto border-t border-line bg-ink p-4 text-xs leading-relaxed text-paper/90">{jsonLd}</pre>
              </details>
            </div>
          </Card>

          {/* Barra de guardado */}
          <div className="sticky bottom-0 z-10 -mx-4 mt-4 flex flex-wrap items-center gap-3 border-t border-line bg-card/85 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-md md:mx-0 md:mt-5 md:rounded-xl md:border md:px-4 md:py-3 md:shadow-[var(--shadow-sm)]">
            <span className="hidden text-xs text-ink-3 sm:block">
              Calidad <span className="tabular font-semibold text-ink">{score.score}</span>/100 · <span className="tabular">{num(score.word_count)}</span> palabras
            </span>
            <Notice state={saveState} className="sm:ml-2" />
            <SubmitButton pendingLabel="Guardando…" className="ml-auto max-sm:w-full">
              Guardar cambios
            </SubmitButton>
          </div>
        </form>

        <aside className="min-w-0 space-y-4 md:space-y-5">
          <Card>
            <CardHeader title="Calidad" intro="Se recalcula mientras escribes." />
            <div className="p-5">
              <div className="flex items-center gap-4">
                <ScoreRing score={score.score} size={96} label="/ 100" />
                <div className="min-w-0 text-[13px] text-ink-2">
                  {score.score >= 85 ? "Listo para publicar." : score.score >= 65 ? "Buena base. Afina los puntos en ámbar." : "Necesita trabajo antes de publicar."}
                </div>
              </div>
              <ul className="mt-5 space-y-3">
                {Object.entries(score.breakdown).map(([k, v]) => (
                  <li key={k}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-ink-2">{SCORE_LABELS[k] ?? k}</span>
                      <span className="tabular font-semibold">{v}</span>
                    </div>
                    <Progress value={v} tone={tone(v)} />
                  </li>
                ))}
              </ul>
              {score.tips.length > 0 && (
                <div className="mt-5 rounded-xl bg-lime-soft p-3.5">
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold">
                    <Lightbulb className="h-3.5 w-3.5" aria-hidden /> Para subir nota
                  </p>
                  <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-ink-2">
                    {score.tips.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          {imageAction && <ArticleImages articleId={article.id} cover={cover} images={images} body={body} onBody={setBody} onCover={setCover} onImages={setImages} action={imageAction} />}

          <Card>
            <CardHeader title="Publicación" intro={cmsLabel ? `Se publicará en ${cmsLabel}.` : "Conecta tu CMS en Ajustes › Publicación."} />
            <form action={schedAction} className="space-y-3 p-5">
              <input type="hidden" name="id" value={article.id} />
              <Field label="Programar para">
                <Input type="date" name="date" min={tomorrow} defaultValue={scheduledFor?.slice(0, 10) ?? tomorrow} />
              </Field>
              <SubmitButton variant="outline" className="w-full" pendingLabel="Programando…">
                <CalendarClock className="h-4 w-4" aria-hidden /> Programar
              </SubmitButton>
              <Notice state={schedState} />
            </form>
          </Card>
        </aside>
      </div>
    </div>
  );
}
