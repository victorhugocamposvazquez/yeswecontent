"use client";

import { useActionState, useMemo, useState } from "react";
import { CalendarClock, Plus, RefreshCw, Send, Trash2 } from "lucide-react";
import { ScoreRing } from "@/components/charts";
import { Card, Field, Input, Textarea } from "@/components/ui";
import type { ImageAction } from "@/lib/images/action-types";
import type { FormAction } from "@/lib/panel/action-types";
import { buildJsonLd } from "@/lib/panel/jsonld";
import { markdownToHtml, proseClass } from "@/lib/panel/markdown";
import { SCORE_LABELS, scoreArticle } from "@/lib/panel/score";
import type { Article } from "@/lib/types";
import { cn, slugify } from "@/lib/utils";
import { Notice, SubmitButton } from "./action-form";
import { ArticleImages } from "./article-images";

type Actions = { save: FormAction; regenerate: FormAction; publish: FormAction; schedule: FormAction };

export function ArticleEditor({
  article,
  keyword: initialKeyword,
  scheduledFor,
  site,
  cmsLabel,
  actions,
  imageAction,
}: {
  article: Article;
  keyword: string;
  scheduledFor: string | null;
  site: { name: string; url: string; min_words?: number; internal_links?: number; schema?: boolean };
  cmsLabel: string | null;
  actions: Actions;
  /** Regenerar portada / imágenes interiores / infografía. */
  imageAction?: ImageAction;
}) {
  const [title, setTitle] = useState(article.title);
  const [slug, setSlug] = useState(article.slug);
  const [meta, setMeta] = useState(article.meta_description ?? "");
  const [body, setBody] = useState(article.body_md);
  const [faq, setFaq] = useState(article.faq ?? []);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [cover, setCover] = useState(article.cover_url);
  const [images, setImages] = useState(article.images ?? []);
  // Pestañas en móvil/tablet (< lg). En escritorio todo se ve a la vez.
  const [tab, setTab] = useState<"edit" | "preview" | "seo">("edit");
  const mobileHidden = (t: typeof tab) => tab !== t && "max-lg:hidden";

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

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div role="tablist" aria-label="Modo del editor" className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-paper-2 p-1 lg:hidden">
        {(
          [
            ["edit", "Editar"],
            ["preview", "Vista previa"],
            ["seo", "SEO"],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn("min-h-10 rounded-lg px-2 text-sm font-medium transition", tab === t ? "bg-card text-ink shadow-sm" : "text-ink-2")}
          >
            {label}
            {t === "seo" && <span className="ml-1 tabular-nums text-ink-3">{score.score}</span>}
          </button>
        ))}
      </div>
      <form action={saveAction} className="min-w-0 space-y-6">
        <input type="hidden" name="id" value={article.id} />
        <input type="hidden" name="faq" value={JSON.stringify(faq)} />
        <input type="hidden" name="body_md" value={body} />

        <Card className={cn("space-y-4 p-5 md:p-6", tab === "preview" && "max-lg:hidden")}>
          <Field label="Título (H1 y título SEO)" hint={`${title.length}/60 caracteres recomendados`}>
            <Input name="title" value={title} onChange={(e) => setTitle(e.target.value)} className="font-semibold tracking-tight text-xl" />
          </Field>
          <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2", mobileHidden("seo"))}>
            <Field label="Slug (URL)">
              <Input name="slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value) || e.target.value)} />
            </Field>
            <Field label="Palabra clave principal">
              <Input name="keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </Field>
          </div>
          <div className={cn(mobileHidden("seo"))}>
            <Field label="Meta descripción" hint={`${meta.length}/160 caracteres`}>
              <Textarea name="meta_description" rows={2} value={meta} onChange={(e) => setMeta(e.target.value)} />
            </Field>
          </div>
          <div className={cn(mobileHidden("seo"))}>
            <p className="mb-1.5 text-sm font-medium text-ink-2">Así se verá en Google</p>
            <div className="rounded-xl border border-line bg-white p-4 font-sans">
              <p className="truncate text-xs text-[#4d5156]">
                {host} › blog › {slug}
              </p>
              <p className={cn("mt-0.5 truncate text-lg leading-snug text-[#1a0dab]", title.length > 60 && "text-bad")}>{title.length > 60 ? `${title.slice(0, 58)}…` : title || "Sin título"}</p>
              <p className="line-clamp-2 text-sm text-[#4d5156]">{meta ? (meta.length > 160 ? `${meta.slice(0, 157)}…` : meta) : "Añade una meta descripción para controlar este texto."}</p>
            </div>
          </div>
        </Card>

        <Card className={cn("overflow-hidden", tab === "seo" && "max-lg:hidden")}>
          <div className="flex items-center justify-between border-b border-line px-4 py-2">
            <p className="text-sm font-medium text-ink-2 lg:hidden">{tab === "preview" ? "Vista previa" : "Markdown"}</p>
            <p className="hidden text-sm font-medium text-ink-2 lg:block">Markdown · Vista previa en directo</p>
            <p className="text-xs text-ink-3">{score.word_count} palabras</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className={cn(tab !== "edit" && "hidden lg:block")}>
              <label htmlFor="body" className="sr-only">
                Texto del artículo en Markdown
              </label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                spellCheck
                className="h-[65svh] min-h-80 w-full resize-y border-0 bg-card p-4 font-mono text-[13px] lg:h-[560px] leading-relaxed outline-none focus:ring-2 focus:ring-inset focus:ring-lime lg:border-r lg:border-line"
              />
            </div>
            <div className={cn("bg-white p-5 lg:h-[560px] lg:overflow-y-auto", tab !== "preview" && "hidden lg:block")}>
              {cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt={images.find((i) => i.kind === "cover")?.alt ?? ""} className="mb-4 aspect-video w-full rounded-xl object-cover" />
              )}
              <h1 className="mb-4 font-semibold tracking-tight text-xl leading-tight">{title}</h1>
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
        </Card>

        <Card className={cn("p-5 md:p-6", mobileHidden("edit"))}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Preguntas frecuentes</h2>
              <p className="text-sm text-ink-3">Se publican al final del artículo y en el schema FAQPage.</p>
            </div>
            <button type="button" onClick={() => setFaq([...faq, { q: "", a: "" }])} className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-ink px-3 py-1.5 text-sm font-medium hover:bg-ink hover:text-paper lg:min-h-0">
              <Plus className="h-4 w-4" aria-hidden /> Añadir
            </button>
          </div>
          <ol className="space-y-3">
            {faq.map((f, i) => (
              <li key={i} className="rounded-xl border border-line bg-paper p-3">
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
                  <button type="button" onClick={() => setFaq(faq.filter((_, j) => j !== i))} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-3 hover:bg-paper-2 hover:text-bad" aria-label={`Eliminar pregunta ${i + 1}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
            {!faq.length && <p className="text-sm text-ink-3">Sin preguntas todavía.</p>}
          </ol>
        </Card>

        <details className={cn("rounded-2xl border border-line bg-card", mobileHidden("seo"))}>
          <summary className="cursor-pointer px-5 py-3.5 text-sm font-medium lg:py-3">Datos estructurados (JSON-LD)</summary>
          <pre className="overflow-x-auto border-t border-line bg-paper p-4 text-xs">{jsonLd}</pre>
        </details>

        <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-paper/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur md:mx-0 md:rounded-2xl md:border md:pb-3">
          <SubmitButton pendingLabel="Guardando…">Guardar cambios</SubmitButton>
          <Notice state={saveState} />
        </div>
      </form>

      <aside className="min-w-0 space-y-6">
        <Card className={cn("p-5", mobileHidden("seo"))}>
          <h2 className="font-semibold">Calidad</h2>
          <p className="mb-3 text-xs text-ink-3">Se recalcula mientras escribes.</p>
          <div className="flex justify-center">
            <ScoreRing score={score.score} size={120} />
          </div>
          <ul className="mt-4 space-y-2.5">
            {Object.entries(score.breakdown).map(([k, v]) => (
              <li key={k}>
                <div className="flex justify-between text-xs">
                  <span className="text-ink-2">{SCORE_LABELS[k] ?? k}</span>
                  <span className="font-semibold tabular-nums">{v}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-2">
                  <div className={cn("h-full rounded-full", v >= 85 ? "bg-ok" : v >= 65 ? "bg-warn" : "bg-bad")} style={{ width: `${v}%` }} />
                </div>
              </li>
            ))}
          </ul>
          {score.tips.length > 0 && (
            <div className="mt-5 rounded-xl bg-lime/40 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide">Para subir nota</p>
              <ul className="list-disc space-y-1 pl-4 text-xs text-ink-2">
                {score.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {imageAction && (
          <ArticleImages
            articleId={article.id}
            cover={cover}
            images={images}
            body={body}
            onBody={setBody}
            onCover={setCover}
            onImages={setImages}
            action={imageAction}
            className={cn(mobileHidden("edit"))}
          />
        )}

        <Card className="space-y-5 p-5">
          <h2 className="font-semibold">Publicación</h2>
          <form action={pubAction} className="space-y-2">
            <input type="hidden" name="id" value={article.id} />
            <SubmitButton className="w-full" pendingLabel="Publicando…">
              <Send className="h-4 w-4" aria-hidden /> Publicar ahora
            </SubmitButton>
            <p className="text-xs text-ink-3">{cmsLabel ? `Se publicará en ${cmsLabel}.` : "Conecta tu CMS en Ajustes › Publicación."}</p>
            <Notice state={pubState} />
          </form>
          <form action={schedAction} className="space-y-2 border-t border-line pt-4">
            <input type="hidden" name="id" value={article.id} />
            <Field label="Programar para">
              <Input type="date" name="date" min={tomorrow} defaultValue={scheduledFor?.slice(0, 10) ?? tomorrow} />
            </Field>
            <SubmitButton variant="outline" className="w-full" pendingLabel="Programando…">
              <CalendarClock className="h-4 w-4" aria-hidden /> Programar
            </SubmitButton>
            <Notice state={schedState} />
          </form>
          <form action={regenAction} className="space-y-2 border-t border-line pt-4">
            <input type="hidden" name="id" value={article.id} />
            <SubmitButton variant="ghost" className="w-full border border-line" pendingLabel="Regenerando…">
              <RefreshCw className="h-4 w-4" aria-hidden /> Regenerar con IA
            </SubmitButton>
            <p className="text-xs text-ink-3">Reescribe el artículo con tu voz de marca y tus ajustes actuales. Perderás los cambios no guardados.</p>
            <Notice state={regenState} />
          </form>
        </Card>
      </aside>
    </div>
  );
}
