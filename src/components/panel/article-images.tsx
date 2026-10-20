"use client";

import { useActionState, useMemo } from "react";
import { BarChart3, ImageIcon, RefreshCw } from "lucide-react";
import { Card, CardHeader } from "@/components/ui";
import type { ImageAction, ImageActionState } from "@/lib/images/action-types";
import type { ArticleImage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Notice, SubmitButton } from "./action-form";

const PROVIDER: Record<NonNullable<ArticleImage["provider"]>, string> = {
  openai: "Generada con IA",
  editorial: "Portada editorial",
  infographic: "Infografía SVG",
  demo: "Vista previa",
};

/** Imágenes del texto, en orden, cruzadas con los metadatos guardados. */
function bodyImages(body: string, images: ArticleImage[]): ArticleImage[] {
  return [...body.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)].map((m) => {
    const known = images.find((i) => i.url === m[2]);
    const kind: ArticleImage["kind"] = known?.kind ?? (/infograf/i.test(m[2]) || /kind=infographic/.test(m[2]) ? "infographic" : "inline");
    return { ...known, kind: kind === "cover" ? "inline" : kind, url: m[2], alt: m[1] };
  });
}

export function ArticleImages({
  articleId,
  cover,
  images,
  body,
  onBody,
  onCover,
  onImages,
  action,
  className,
}: {
  articleId: string;
  cover: string | null;
  images: ArticleImage[];
  body: string;
  onBody: (fn: (b: string) => string) => void;
  onCover: (url: string) => void;
  onImages: (fn: (imgs: ArticleImage[]) => ArticleImage[]) => void;
  action: ImageAction;
  className?: string;
}) {
  const [state, act] = useActionState<ImageActionState, FormData>(async (prev, fd) => {
    const res = await action(prev, fd);
    if (res?.ok && res.image) {
      const img = res.image;
      if (res.kind === "cover") onCover(img.url);
      else if (res.replaced) onBody((b) => b.split(`](${res.replaced})`).join(`](${img.url})`));
      else if (res.body_md) onBody(() => res.body_md!);
      onImages((list) => [...list.filter((i) => (res.kind === "cover" ? i.kind !== "cover" : i.url !== res.replaced)), img]);
    }
    return res;
  }, null);

  const inBody = useMemo(() => bodyImages(body, images), [body, images]);
  const coverMeta = images.find((i) => i.kind === "cover");
  const hasInfographic = inBody.some((i) => i.kind === "infographic");
  const total = inBody.length + (cover ? 1 : 0);

  return (
    <Card className={className}>
      <CardHeader title="Imágenes" intro="Portada, imágenes del texto e infografía. Se suben con el artículo a tu CMS." action={<span className="tabular rounded-full bg-paper-3 px-2 py-0.5 text-[11px] font-medium text-ink-2">{total}</span>} />
      <div className="p-5">
        <div className="group relative aspect-video overflow-hidden rounded-xl border border-line bg-paper-2">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={coverMeta?.alt ?? "Portada del artículo"} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
          ) : (
            <div className="grid h-full place-items-center text-ink-3">
              <ImageIcon className="h-6 w-6" aria-hidden />
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-full bg-card/90 px-2 py-0.5 text-[11px] font-medium shadow-[var(--shadow-xs)] backdrop-blur">Portada</span>
        </div>
        {coverMeta?.alt && <p className="mt-2 line-clamp-2 text-xs text-ink-3">Alt: {coverMeta.alt}</p>}
        <form action={act} className="mt-3">
          <input type="hidden" name="id" value={articleId} />
          <input type="hidden" name="kind" value="cover" />
          <SubmitButton variant="outline" className="w-full" pendingLabel="Generando portada…">
            <RefreshCw className="h-4 w-4" aria-hidden /> {cover ? "Regenerar portada" : "Generar portada"}
          </SubmitButton>
        </form>

        {inBody.length > 0 && (
          <ul className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4">
            {inBody.map((img, i) => (
              <li key={`${img.url}-${i}`} className="min-w-0">
                <div className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-paper-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.alt} className="h-full w-full object-cover" loading="lazy" />
                  <span className={cn("absolute left-1.5 top-1.5 rounded-full px-1.5 py-px text-[10px] font-medium backdrop-blur", img.kind === "infographic" ? "bg-sky-soft/95 text-ink" : "bg-card/90 text-ink-2")}>
                    {img.kind === "infographic" ? "Infografía" : `Imagen ${i + 1}`}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-ink-3">{img.alt || "Sin texto alternativo"}</p>
                {img.provider && <p className="text-[10px] text-ink-3">{PROVIDER[img.provider]}</p>}
                <form action={act}>
                  <input type="hidden" name="id" value={articleId} />
                  <input type="hidden" name="kind" value={img.kind} />
                  <input type="hidden" name="url" value={img.url} />
                  <input type="hidden" name="section" value={img.section ?? ""} />
                  <input type="hidden" name="body_md" value={body} />
                  <SubmitButton variant="ghost" className="-ml-2 mt-0.5 h-8 px-2 text-xs max-md:h-11" pendingLabel="Generando…">
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Regenerar
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}

        {!hasInfographic && (
          <form action={act} className="mt-4 border-t border-line pt-4">
            <input type="hidden" name="id" value={articleId} />
            <input type="hidden" name="kind" value="infographic" />
            <input type="hidden" name="body_md" value={body} />
            <SubmitButton variant="outline" className="w-full" pendingLabel="Creando infografía…">
              <BarChart3 className="h-4 w-4" aria-hidden /> Añadir infografía
            </SubmitButton>
            <p className="mt-1.5 text-xs text-ink-3">Convierte la lista o las cifras clave del texto en una tarjeta visual.</p>
          </form>
        )}
        <Notice state={state ? { ok: state.ok, message: state.message, at: state.at } : null} className="mt-3" />
      </div>
    </Card>
  );
}
