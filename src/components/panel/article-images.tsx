"use client";

import { useActionState, useMemo } from "react";
import { BarChart3, ImageIcon, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui";
import type { ImageAction, ImageActionState } from "@/lib/images/action-types";
import type { ArticleImage } from "@/lib/types";
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

  return (
    <Card className={className ? `p-5 ${className}` : "p-5"}>
      <h2 className="font-semibold">Imágenes</h2>
      <p className="mb-4 text-xs text-ink-3">Portada, imágenes del texto e infografía. Se suben con el artículo a tu CMS.</p>

      <div className="space-y-2">
        <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-paper-2">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={coverMeta?.alt ?? "Portada del artículo"} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-ink-3">
              <ImageIcon className="h-6 w-6" aria-hidden />
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-full bg-card/90 px-2 py-0.5 text-[11px] font-medium">Portada</span>
        </div>
        {coverMeta?.alt && <p className="line-clamp-2 text-xs text-ink-3">Alt: {coverMeta.alt}</p>}
        <form action={act}>
          <input type="hidden" name="id" value={articleId} />
          <input type="hidden" name="kind" value="cover" />
          <SubmitButton variant="outline" className="w-full" pendingLabel="Generando portada…">
            <RefreshCw className="h-4 w-4" aria-hidden /> {cover ? "Regenerar portada" : "Generar portada"}
          </SubmitButton>
        </form>
      </div>

      {inBody.length > 0 && (
        <ul className="mt-5 space-y-3 border-t border-line pt-4">
          {inBody.map((img, i) => (
            <li key={`${img.url}-${i}`} className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt} className="h-16 w-20 shrink-0 rounded-lg border border-line bg-paper-2 object-cover sm:h-[72px] sm:w-24" loading="lazy" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">
                  {img.kind === "infographic" ? "Infografía" : `Imagen ${i + 1}`}
                  {img.provider && <span className="font-normal text-ink-3"> · {PROVIDER[img.provider]}</span>}
                </p>
                <p className="line-clamp-2 text-xs text-ink-3">{img.alt || "Sin texto alternativo"}</p>
                <form action={act} className="mt-1">
                  <input type="hidden" name="id" value={articleId} />
                  <input type="hidden" name="kind" value={img.kind} />
                  <input type="hidden" name="url" value={img.url} />
                  <input type="hidden" name="section" value={img.section ?? ""} />
                  <input type="hidden" name="body_md" value={body} />
                  <SubmitButton variant="ghost" className="-ml-2 min-h-10 px-2 text-xs lg:min-h-0" pendingLabel="Generando…">
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Regenerar
                  </SubmitButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!hasInfographic && (
        <form action={act} className="mt-4 border-t border-line pt-4">
          <input type="hidden" name="id" value={articleId} />
          <input type="hidden" name="kind" value="infographic" />
          <input type="hidden" name="body_md" value={body} />
          <SubmitButton variant="ghost" className="w-full border border-line" pendingLabel="Creando infografía…">
            <BarChart3 className="h-4 w-4" aria-hidden /> Añadir infografía
          </SubmitButton>
          <p className="mt-1.5 text-xs text-ink-3">Convierte la lista o las cifras clave del texto en una tarjeta visual.</p>
        </form>
      )}
      <Notice state={state ? { ok: state.ok, message: state.message, at: state.at } : null} className="mt-3" />
    </Card>
  );
}
