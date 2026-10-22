"use client";

import { useState } from "react";
import { DesignPicker } from "@/components/blog/design-picker";
import { Field, Input } from "@/components/ui";
import { platformBlogHost, slugifyBlogName, type BlogColorId, type BlogLook } from "@/lib/headless/looks";
import { cn } from "@/lib/utils";
import { uploadBlogLogo } from "./actions";

const CMS = ["WordPress", "Shopify", "Webflow", "Ghost", "Webhook", "Otro"] as const;

export type PublishIntent = "create" | "existing" | "domain";

export function BlogStep({
  name,
  siteId,
  demo,
  intent,
  cms,
  domainMode,
  domain,
  look,
  color,
  logoUrl,
  subdomainHint,
  folderHint,
  onIntent,
  onCms,
  onDomainMode,
  onDomain,
  onLook,
  onColor,
  onLogo,
}: {
  name: string;
  siteId: string | null;
  demo: boolean;
  intent: PublishIntent;
  cms: string | null;
  domainMode: "subdomain" | "folder";
  domain: string;
  look: BlogLook;
  color: BlogColorId;
  logoUrl: string;
  subdomainHint: string;
  folderHint: string;
  onIntent: (v: PublishIntent) => void;
  onCms: (v: string | null) => void;
  onDomainMode: (v: "subdomain" | "folder") => void;
  onDomain: (v: string) => void;
  onLook: (v: BlogLook) => void;
  onColor: (v: BlogColorId) => void;
  onLogo: (v: string) => void;
}) {
  const host = platformBlogHost(slugifyBlogName(name || "tu-negocio"));
  const [logoNote, setLogoNote] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(logoUrl || null);

  return (
    <div className="space-y-3">
      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium text-ink-2">¿Dónde publicamos?</legend>
        {(
          [
            ["create", "Crearme el blog", "Recomendado si no tienes blog, o tienes tienda y aún no publicas artículos."],
            ["existing", "Ya tengo blog", "WordPress, Shopify, Webflow, Ghost u otro. Te pediremos el acceso en el panel."],
            ["domain", "Quiero usar mi dominio", "Para más adelante: blog.tudominio.com o tudominio.com/blog."],
          ] as const
        ).map(([id, title, desc]) => (
          <button
            key={id}
            type="button"
            aria-pressed={intent === id}
            onClick={() => onIntent(id)}
            className={cn("flex w-full flex-col rounded-xl border px-3 py-3 text-left transition-colors", intent === id ? "border-signal bg-signal-soft ring-1 ring-signal" : "border-line bg-card hover:bg-paper-2")}
          >
            <span className="text-sm font-semibold">{title}</span>
            <span className={cn("mt-0.5 text-xs", intent === id ? "text-signal/90" : "text-ink-3")}>{desc}</span>
          </button>
        ))}
      </fieldset>

      {intent === "create" && (
        <div className="space-y-4 rounded-2xl border border-line bg-paper-2/60 p-4">
          <p className="text-sm text-ink-2">
            Te lo dejamos en <strong className="font-semibold text-ink">{host}</strong>. No tienes que tocar el DNS ni llamar a nadie. Si tienes tienda online, en el menú solo añades un enlace que diga Blog.
          </p>
          <DesignPicker look={look} color={color} onLook={onLook} onColor={onColor} />
          <Field label="Logo (opcional)" hint="Si no tienes, en la cabecera sale el nombre del sitio.">
            <div className="flex items-center gap-3">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="" className="h-10 w-auto max-w-[8rem] rounded bg-card object-contain p-1 ring-1 ring-line" />
              ) : (
                <span className="grid h-10 min-w-10 place-items-center rounded bg-card px-2 text-xs font-semibold ring-1 ring-line">{(name || "Web").slice(0, 12)}</span>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="block w-full text-sm text-ink-2 file:mr-3 file:rounded-lg file:border-0 file:bg-card file:px-3 file:py-2 file:text-sm file:font-medium"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 1_500_000) {
                    setLogoNote("El logo pesa más de 1,5 MB. Prueba con uno más pequeño.");
                    return;
                  }
                  setLogoPreview(URL.createObjectURL(file));
                  if (demo || !siteId) {
                    setLogoNote("Lo guardaremos al tener el sitio conectado. Mientras, verás el nombre.");
                    return;
                  }
                  const fd = new FormData();
                  fd.set("file", file);
                  const res = await uploadBlogLogo(siteId, fd);
                  if (res.url) {
                    onLogo(res.url);
                    setLogoNote(null);
                  } else setLogoNote(res.error ?? "No se pudo subir el logo. Seguimos con el nombre.");
                }}
              />
            </div>
          </Field>
          {logoNote && <p className="text-xs text-ink-3">{logoNote}</p>}
        </div>
      )}

      {intent === "existing" && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CMS.map((c) => (
            <button key={c} type="button" aria-pressed={cms === c} onClick={() => onCms(cms === c ? null : c)} className={cn("min-h-11 rounded-xl border px-3 py-2.5 text-[13px] font-medium transition-colors", cms === c ? "border-signal bg-signal-soft text-signal ring-1 ring-signal" : "border-line bg-card hover:bg-paper-2")}>
              {c}
            </button>
          ))}
        </div>
      )}

      {intent === "domain" && (
        <div className="space-y-2">
          <p className="text-xs leading-relaxed text-ink-3">Mientras tanto el blog ya existe en {host}. El dominio propio se activa cuando el DNS esté listo.</p>
          {(
            [
              ["subdomain", "Subdominio", subdomainHint],
              ["folder", "Carpeta /blog", folderHint],
            ] as const
          ).map(([id, title, desc]) => (
            <button key={id} type="button" aria-pressed={domainMode === id} onClick={() => onDomainMode(id)} className={cn("flex w-full flex-col rounded-xl border px-3 py-2.5 text-left", domainMode === id ? "border-signal bg-signal-soft ring-1 ring-signal" : "border-line bg-card")}>
              <span className="text-[13px] font-semibold">{title}</span>
              <span className="text-xs text-ink-3">{desc}</span>
            </button>
          ))}
          {domainMode === "subdomain" && (
            <Field label="Subdominio">
              <Input value={domain} onChange={(e) => onDomain(e.target.value)} placeholder={subdomainHint} autoCapitalize="off" spellCheck={false} />
            </Field>
          )}
        </div>
      )}
    </div>
  );
}
