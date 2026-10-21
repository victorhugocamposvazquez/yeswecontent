"use client";

import { useMemo, useState, useTransition } from "react";
import { ActionForm } from "@/components/panel/action-form";
import { Badge, Button, Field, Input } from "@/components/ui";
import type { HostedBlogConfig } from "@/lib/headless/content";
import { suggestHostedBlogUrls } from "@/lib/headless/hosted-blog";
import { cn } from "@/lib/utils";
import { saveHostedBlog, verifyHostedBlogDnsAction } from "./actions";

const MODES = [
  { id: "platform" as const, title: "Empezar ya (sin DNS)", desc: "Tu blog queda publicado en nuestra URL. Ideal para la prueba y para publicar el primer artículo hoy." },
  { id: "subdomain" as const, title: "Subdominio propio", desc: "blog.tudominio.com con un CNAME. Recomendado cuando ya tienes web." },
  { id: "folder" as const, title: "Carpeta /blog", desc: "Misma autoridad de dominio. Requiere un proxy en tu servidor (te damos la config)." },
];

type Props = {
  siteId: string;
  siteName: string;
  siteUrl: string;
  hosted: HostedBlogConfig | null;
  cnameTarget: string;
  previewPath: string;
};

export function HostedBlogForm({ siteId, siteName, siteUrl, hosted, cnameTarget, previewPath }: Props) {
  const hints = useMemo(() => suggestHostedBlogUrls(siteUrl), [siteUrl]);
  const [mode, setMode] = useState<"platform" | "subdomain" | "folder">(hosted?.delivery_mode ?? "platform");
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);
  const [pending, startVerify] = useTransition();

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-line bg-paper-2 p-4 text-[13px] leading-relaxed text-ink-2">
        <p className="font-semibold text-ink">Cómo funciona</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Activamos el blog y publicamos ahí tus artículos (sin WordPress ni código).</li>
          <li>Puedes empezar en la URL de yeswecontent y pasar a tu dominio cuando quieras.</li>
          <li>El subdominio solo necesita un CNAME; la carpeta /blog usa un proxy (nginx o Vercel).</li>
        </ol>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink-2">Dónde lo verán tus visitas</legend>
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={cn(
              "flex w-full flex-col rounded-xl border px-4 py-3 text-left transition-colors",
              mode === m.id ? "border-signal bg-signal-soft/40 ring-1 ring-signal" : "border-line bg-card hover:bg-paper-2",
            )}
          >
            <span className="text-sm font-semibold text-ink">{m.title}</span>
            <span className="mt-0.5 text-xs text-ink-3">{m.desc}</span>
          </button>
        ))}
      </fieldset>

      <ActionForm action={saveHostedBlog} className="space-y-4">
        <input type="hidden" name="delivery_mode" value={mode} readOnly />
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="enabled" defaultChecked={hosted?.enabled ?? true} className="h-4 w-4 accent-[var(--signal)]" /> Blog alojado activo
        </label>

        {mode === "subdomain" && (
          <>
            <Field label="Subdominio" hint={`Registro DNS: CNAME → ${cnameTarget}`}>
              <Input name="custom_domain" placeholder={hints.subdomainHost} defaultValue={hosted?.custom_domain ?? hints.subdomainHost} autoCapitalize="off" spellCheck={false} />
            </Field>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setVerifyMsg(null);
                  const input = document.querySelector<HTMLInputElement>('input[name="custom_domain"]');
                  const host = input?.value?.trim();
                  if (!host) {
                    setVerifyMsg("Escribe el subdominio antes de comprobar el DNS.");
                    return;
                  }
                  startVerify(async () => {
                    const res = await verifyHostedBlogDnsAction(host);
                    setVerifyMsg(`${res.ok ? "ok:" : "warn:"}${res.message}`);
                  });
                }}
              >
                {pending ? "Comprobando…" : "Comprobar DNS"}
              </Button>
              {hosted?.verified_at && <Badge tone="ok">DNS verificado</Badge>}
            </div>
            {verifyMsg && (
              <p className={cn("text-xs", verifyMsg.startsWith("ok:") ? "text-ok" : "text-warn")}>{verifyMsg.replace(/^(ok|warn):/, "")}</p>
            )}
          </>
        )}

        {mode === "folder" && (
          <Field label="URL pública del blog" hint="La que usarán Google y los enlaces canónicos. Debe coincidir con el proxy.">
            <Input name="public_base_url" placeholder={hints.folderBaseUrl} defaultValue={hosted?.public_base_url ?? hints.folderBaseUrl} />
          </Field>
        )}

        {mode === "platform" && (
          <p className="text-[13px] text-ink-2">
            URL provisional:{" "}
            <a href={previewPath} target="_blank" rel="noreferrer" className="font-medium text-signal underline underline-offset-4">
              {previewPath}
            </a>
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Título del blog">
            <Input name="title" placeholder={`Blog de ${siteName}`} defaultValue={hosted?.title ?? ""} />
          </Field>
          <Field label="Subtítulo">
            <Input name="tagline" placeholder="Lo que sabemos, contado claro." defaultValue={hosted?.tagline ?? ""} />
          </Field>
        </div>
      </ActionForm>
    </div>
  );
}
