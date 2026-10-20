import { randomBytes } from "node:crypto";
import { CircleCheck } from "lucide-react";
import { ActionForm } from "@/components/panel/action-form";
import { ChoosePlanButton, PortalButton } from "@/components/panel/billing-actions";
import { CopyButton } from "@/components/panel/copy-button";
import { Toggle } from "@/components/panel/toggle";
import { Badge, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { addCompetitor, connectIntegration, disconnectIntegration, inviteMember, removeCompetitor, saveSettings } from "@/app/panel/actions";
import type { Article, Integration, Plan, Profile, Site, Subscription } from "@/lib/types";
import { cn, eur, fmtDate } from "@/lib/utils";

export function Section({ title, intro, children, className }: { title: string; intro?: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("p-5 md:p-6", className)}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {intro && <p className="mb-5 mt-0.5 text-sm text-ink-3">{intro}</p>}
      {!intro && <div className="mb-5" />}
      {children}
    </Card>
  );
}

const LANGS: [string, string][] = [
  ["es", "Español"],
  ["en", "Inglés"],
  ["fr", "Francés"],
  ["de", "Alemán"],
  ["it", "Italiano"],
  ["pt", "Portugués"],
  ["ca", "Catalán"],
];
const DAYS: [string, string][] = [
  ["mon", "Lun"],
  ["tue", "Mar"],
  ["wed", "Mié"],
  ["thu", "Jue"],
  ["fri", "Vie"],
  ["sat", "Sáb"],
  ["sun", "Dom"],
];

const chip = "cursor-pointer rounded-full border border-line bg-card px-3 py-1.5 text-sm has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-lime";

/* ───────── Cuenta ───────── */
export function CuentaSection({ profile }: { profile: Profile }) {
  return (
    <div className="space-y-6">
      <Section title="Tu cuenta" intro="Cómo te ve tu equipo dentro de yeswecontent.">
        <ActionForm action={saveSettings.bind(null, "cuenta")}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Nombre">
              <Input name="full_name" defaultValue={profile.full_name ?? ""} autoComplete="name" />
            </Field>
            <Field label="Email" hint="Para cambiarlo, escríbenos a soporte.">
              <Input value={profile.email} readOnly disabled />
            </Field>
          </div>
        </ActionForm>
      </Section>
      <Section title="Seguridad" intro="Te enviaremos un enlace para elegir una contraseña nueva.">
        <p className="text-sm text-ink-2">
          Cliente desde el {fmtDate(profile.created_at, { day: "numeric", month: "long", year: "numeric" })}. Para cambiar la contraseña, cierra sesión y usa «¿Has olvidado tu contraseña?» en la pantalla de acceso.
        </p>
      </Section>
    </div>
  );
}

/* ───────── Negocio ───────── */
export function NegocioSection({ site }: { site: Site }) {
  return (
    <Section title="Tu negocio" intro="Con esto decidimos de qué escribir y para quién.">
      <ActionForm action={saveSettings.bind(null, "negocio")}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Nombre de la marca">
            <Input name="name" defaultValue={site.name} required />
          </Field>
          <Field label="Web">
            <Input name="url" type="url" defaultValue={site.url} required />
          </Field>
        </div>
        <Field label="Sector o nicho">
          <Input name="niche" defaultValue={site.niche ?? ""} />
        </Field>
        <Field label="Público objetivo">
          <Textarea name="audience" rows={2} defaultValue={site.audience ?? ""} />
        </Field>
        <Field label="Descripción" hint="Qué vendes, qué te diferencia y dónde trabajas.">
          <Textarea name="description" rows={3} defaultValue={site.description ?? ""} />
        </Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Idioma principal">
            <Select name="language" defaultValue={site.language}>
              {LANGS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-ink-2">Idiomas adicionales</legend>
            <div className="flex flex-wrap gap-2">
              {LANGS.map(([v, l]) => (
                <label key={v} className={chip}>
                  <input type="checkbox" name="extra_languages" value={v} defaultChecked={site.extra_languages.includes(v)} className="sr-only" /> {l}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </ActionForm>
    </Section>
  );
}

/* ───────── Equipo ───────── */
export function EquipoSection({ team, seats }: { team: { email: string; name: string | null; role: string }[]; seats: number | null }) {
  const roles: Record<string, string> = { owner: "Propietaria", editor: "Editor", viewer: "Solo lectura", client: "Cliente" };
  return (
    <div className="space-y-6">
      <Section title="Equipo" intro={seats ? `Tu plan incluye ${seats} usuario(s).` : "Tu plan incluye usuarios ilimitados."}>
        <ul className="divide-y divide-line">
          {team.map((m) => (
            <li key={m.email} className="flex items-center gap-3 py-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-paper-2 text-xs font-bold" aria-hidden>
                {(m.name ?? m.email).slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.name ?? m.email}</p>
                <p className="truncate text-xs text-ink-3">{m.email}</p>
              </div>
              <Badge>{roles[m.role] ?? m.role}</Badge>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Invitar a alguien" intro="Le llegará un email con un enlace para unirse.">
        <ActionForm action={inviteMember} submitLabel="Enviar invitación">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_200px]">
            <Field label="Email">
              <Input name="email" type="email" required placeholder="nombre@empresa.com" />
            </Field>
            <Field label="Permisos">
              <Select name="role" defaultValue="editor">
                <option value="editor">Editor</option>
                <option value="viewer">Solo lectura</option>
                <option value="client">Cliente (agencias)</option>
              </Select>
            </Field>
          </div>
        </ActionForm>
      </Section>
    </div>
  );
}

/* ───────── Voz de marca ───────── */
export function EscrituraSection({ site }: { site: Site }) {
  const v = site.brand_voice ?? {};
  return (
    <Section title="Voz de marca" intro="Así escribiremos en tu nombre. Cuanto más concreto, mejor.">
      <ActionForm action={saveSettings.bind(null, "escritura")}>
        <Field label="Tono" hint="Ej.: cercano y experto, con humor suave; nada de tecnicismos.">
          <Input name="tone" defaultValue={v.tone ?? ""} />
        </Field>
        <Field label="Desde qué persona escribimos">
          <Select name="person" defaultValue={v.person ?? "nosotros"}>
            <option value="nosotros">Nosotros (la marca)</option>
            <option value="yo">Yo (en primera persona)</option>
            <option value="impersonal">Impersonal</option>
          </Select>
        </Field>
        <Field label="Palabras o expresiones que nunca usamos" hint="Separadas por comas">
          <Input name="avoid" defaultValue={(v.avoid ?? []).join(", ")} />
        </Field>
        <Field label="Texto de ejemplo" hint="Pega un párrafo que te represente: lo usaremos como referencia de estilo.">
          <Textarea name="example" rows={5} defaultValue={v.examples?.[0] ?? ""} />
        </Field>
      </ActionForm>
    </Section>
  );
}

/* ───────── Formato de artículo ───────── */
export function ArticuloSection({ site }: { site: Site }) {
  const s = (site.seo_settings ?? {}) as Site["seo_settings"] & { toc?: boolean; cta?: string; external_links?: boolean };
  return (
    <Section title="Formato de artículo" intro="Estructura y elementos SEO que tendrá cada artículo.">
      <ActionForm action={saveSettings.bind(null, "articulo")}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Longitud mínima (palabras)">
            <Input name="min_words" type="number" min={600} max={5000} step={100} defaultValue={s.min_words ?? 1200} />
          </Field>
          <Field label="Enlaces internos por artículo">
            <Input name="internal_links" type="number" min={0} max={15} defaultValue={s.internal_links ?? 3} />
          </Field>
        </div>
        <div className="space-y-4 rounded-xl border border-line bg-paper p-4">
          <Toggle name="faq" defaultChecked={s.faq !== false} label="Preguntas frecuentes" hint="Bloque FAQ al final, ideal para respuestas de IA." />
          <Toggle name="schema" defaultChecked={s.schema !== false} label="Datos estructurados JSON-LD" hint="Article + FAQPage." />
          <Toggle name="toc" defaultChecked={s.toc ?? false} label="Índice de contenidos" />
          <Toggle name="external_links" defaultChecked={s.external_links ?? true} label="Citar fuentes externas fiables" />
        </div>
        <Field label="Llamada a la acción final" hint="Opcional. Ej.: «Visita nuestro taller en Talavera».">
          <Input name="cta" defaultValue={s.cta ?? ""} />
        </Field>
      </ActionForm>
    </Section>
  );
}

/* ───────── Estilo visual ───────── */
export function VisualSection({ site }: { site: Site }) {
  const v = (site.visual_style ?? {}) as Site["visual_style"] & { cover?: boolean; inline_images?: number };
  const styles = ["Fotografía cálida de producto", "Ilustración plana", "Fotografía editorial", "Collage", "Minimalista con tipografía"];
  return (
    <Section title="Estilo visual" intro="Las imágenes que generamos para portadas y artículos.">
      <ActionForm action={saveSettings.bind(null, "visual")}>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-ink-2">Estilo</legend>
          <div className="flex flex-wrap gap-2">
            {styles.map((s) => (
              <label key={s} className={chip}>
                <input type="radio" name="style" value={s} defaultChecked={(v.style ?? styles[0]) === s} className="sr-only" /> {s}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Paleta o colores de marca">
          <Input name="palette" defaultValue={v.palette ?? ""} placeholder="terracota, crema y verde oliva" />
        </Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-paper p-4">
            <Toggle name="cover" defaultChecked={v.cover ?? true} label="Imagen de portada" />
          </div>
          <Field label="Imágenes dentro del artículo">
            <Input name="inline_images" type="number" min={0} max={6} defaultValue={v.inline_images ?? 2} />
          </Field>
        </div>
      </ActionForm>
    </Section>
  );
}

/* ───────── Calendario ───────── */
export function CalendarioSection({ site }: { site: Site }) {
  const s = site.schedule ?? { days: ["mon", "wed", "fri"], time: "09:00", mode: "drip" };
  return (
    <Section title="Calendario de publicación" intro="Cuándo salen tus artículos (hora en UTC).">
      <ActionForm action={saveSettings.bind(null, "calendario")}>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-ink-2">Días</legend>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(([v, l]) => (
              <label key={v} className={chip}>
                <input type="checkbox" name="days" value={v} defaultChecked={s.days.includes(v)} className="sr-only" /> {l}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Hora">
          <Input name="time" type="time" defaultValue={s.time} className="w-40" />
        </Field>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-ink-2">Ritmo</legend>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              ["drip", "Goteo", "Repartimos los artículos del mes en tus días de publicación."],
              ["batch", "Todo de golpe", "Publicamos todos los artículos del mes el primer día disponible."],
            ].map(([v, l, d]) => (
              <label key={v} className="cursor-pointer rounded-xl border border-line bg-paper p-4 has-[:checked]:border-ink has-[:checked]:bg-lime/30">
                <input type="radio" name="mode" value={v} defaultChecked={s.mode === v} className="mr-2 accent-[var(--signal)]" />
                <span className="font-medium">{l}</span>
                <span className="mt-1 block text-sm text-ink-3">{d}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </ActionForm>
    </Section>
  );
}

/* ───────── Mejoras ───────── */
export function MejorasSection({ site }: { site: Site }) {
  const r = ((site.seo_settings as Record<string, unknown>)?.refresh ?? {}) as { enabled?: boolean; min_age_months?: number; drop_pct?: number; per_month?: number };
  return (
    <Section title="Mejoras automáticas" intro="Renovamos los artículos que empiezan a perder tráfico antes de que caigan del todo.">
      <ActionForm action={saveSettings.bind(null, "mejoras")}>
        <div className="rounded-xl border border-line bg-paper p-4">
          <Toggle name="enabled" defaultChecked={r.enabled ?? true} label="Detectar y renovar artículos" hint="Aparecerán en Plan de contenidos › Mejoras." />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Antigüedad mínima (meses)">
            <Input name="min_age_months" type="number" min={1} max={36} defaultValue={r.min_age_months ?? 6} />
          </Field>
          <Field label="Caída de clics que lo activa (%)">
            <Input name="drop_pct" type="number" min={5} max={90} defaultValue={r.drop_pct ?? 20} />
          </Field>
          <Field label="Máximo al mes">
            <Input name="per_month" type="number" min={0} max={30} defaultValue={r.per_month ?? 4} />
          </Field>
        </div>
      </ActionForm>
    </Section>
  );
}

/* ───────── Competidores ───────── */
export function CompetidoresSection({ competitors }: { competitors: { id: string; url: string; name: string | null }[] }) {
  return (
    <Section title="Competidores" intro="Los vigilamos en tu visibilidad IA y analizamos sus temas para encontrar huecos.">
      <ul className="mb-5 divide-y divide-line rounded-xl border border-line">
        {competitors.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{c.name ?? c.url}</p>
              <p className="truncate text-xs text-ink-3">{c.url}</p>
            </div>
            <ActionForm action={removeCompetitor} submitLabel="Quitar" variant="ghost" inline>
              <input type="hidden" name="id" value={c.id} />
            </ActionForm>
          </li>
        ))}
        {!competitors.length && <li className="px-4 py-3 text-sm text-ink-3">Aún no has añadido competidores.</li>}
      </ul>
      <ActionForm action={addCompetitor} submitLabel="Añadir competidor" variant="ink">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Web">
            <Input name="url" placeholder="competidor.com" required />
          </Field>
          <Field label="Nombre (opcional)">
            <Input name="name" />
          </Field>
        </div>
      </ActionForm>
    </Section>
  );
}

/* ───────── Publicación ───────── */
const CMS: { id: string; name: string; help: string; fields: { name: string; label: string; type?: string; placeholder?: string; hint?: string }[] }[] = [
  {
    id: "wordpress",
    name: "WordPress",
    help: "Crea una contraseña de aplicación en Usuarios › Perfil › Contraseñas de aplicación.",
    fields: [
      { name: "url", label: "URL de tu WordPress", type: "url", placeholder: "https://tuweb.com" },
      { name: "username", label: "Usuario" },
      { name: "app_password", label: "Contraseña de aplicación", type: "password", placeholder: "xxxx xxxx xxxx xxxx" },
    ],
  },
  {
    id: "shopify",
    name: "Shopify",
    help: "Crea una app personalizada con permisos write_content y copia el token de Admin API.",
    fields: [
      { name: "shop", label: "Dominio de la tienda", placeholder: "tutienda.myshopify.com" },
      { name: "access_token", label: "Token de Admin API", type: "password", placeholder: "shpat_…" },
      { name: "blog_id", label: "ID del blog", hint: "Lo verás en la URL al editar el blog." },
    ],
  },
  {
    id: "webflow",
    name: "Webflow",
    help: "Genera un token de API del sitio con permisos de CMS.",
    fields: [
      { name: "token", label: "Token de API", type: "password" },
      { name: "collection_id", label: "ID de la colección del blog" },
    ],
  },
  {
    id: "ghost",
    name: "Ghost",
    help: "En Ajustes › Integraciones crea una integración personalizada y copia la Admin API key.",
    fields: [
      { name: "url", label: "URL de Ghost", type: "url", placeholder: "https://tublog.ghost.io" },
      { name: "admin_key", label: "Admin API key", type: "password", placeholder: "id:secreto" },
    ],
  },
];

export function PublicacionSection({ site, integrations, articles }: { site: Site; integrations: Integration[]; articles: Article[] }) {
  const connected = new Set(integrations.map((i) => i.provider));
  const secret = randomBytes(24).toString("hex");
  const llms = [
    `# ${site.name}`,
    "",
    `> ${site.description ?? site.niche ?? ""}`,
    "",
    site.audience ? `Público: ${site.audience}` : "",
    "",
    "## Páginas clave",
    `- [Inicio](${site.url})`,
    ...articles.filter((a) => a.published_url).slice(0, 25).map((a) => `- [${a.title}](${a.published_url}): ${a.meta_description ?? ""}`),
  ]
    .filter((l, i, arr) => !(l === "" && arr[i - 1] === ""))
    .join("\n");

  return (
    <div className="space-y-6">
      <Section title="Dónde publicamos" intro="Conecta tu CMS y publicaremos cada artículo en su fecha. Guardamos las credenciales cifradas.">
        <div className="space-y-3">
          {CMS.map((c) => (
            <details key={c.id} className="group rounded-xl border border-line bg-paper">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <span className="font-medium">{c.name}</span>
                {connected.has(c.id) && (
                  <Badge tone="ok">
                    <CircleCheck className="h-3 w-3" aria-hidden /> Conectado
                  </Badge>
                )}
                <span className="ml-auto text-sm text-ink-3 group-open:hidden">Configurar</span>
              </summary>
              <div className="border-t border-line p-4">
                <p className="mb-4 text-sm text-ink-3">{c.help}</p>
                <ActionForm action={connectIntegration.bind(null, c.id)} submitLabel={connected.has(c.id) ? "Actualizar" : "Conectar"} variant="ink">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {c.fields.map((f) => (
                      <Field key={f.name} label={f.label} hint={f.hint}>
                        <Input name={f.name} type={f.type ?? "text"} placeholder={f.placeholder} autoComplete="off" required={!connected.has(c.id)} />
                      </Field>
                    ))}
                  </div>
                </ActionForm>
                {connected.has(c.id) && (
                  <ActionForm action={disconnectIntegration.bind(null, c.id)} submitLabel="Desconectar" variant="ghost" className="mt-2" />
                )}
              </div>
            </details>
          ))}
          <details className="group rounded-xl border border-line bg-paper">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <span className="font-medium">Webhook propio</span>
              {connected.has("webhook") && <Badge tone="ok">Conectado</Badge>}
              <span className="ml-auto text-sm text-ink-3 group-open:hidden">Configurar</span>
            </summary>
            <div className="space-y-3 border-t border-line p-4">
              <p className="text-sm text-ink-3">
                Enviamos un POST JSON con el artículo (Markdown y HTML) y la cabecera <code className="rounded bg-paper-2 px-1">X-YWC-Signature: t=…,v1=…</code>, un HMAC-SHA256 de{" "}
                <code className="rounded bg-paper-2 px-1">{"`${t}.${body}`"}</code> con tu secreto. Si respondes con <code className="rounded bg-paper-2 px-1">{"{ \"url\": … }"}</code>, la guardamos como URL publicada.
              </p>
              <ActionForm action={connectIntegration.bind(null, "webhook")} submitLabel="Guardar webhook" variant="ink">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="URL del webhook">
                    <Input name="url" type="url" placeholder="https://api.tuweb.com/ywc" required />
                  </Field>
                  <Field label="Secreto de firma" hint="Guárdalo: lo necesitarás para verificar la firma.">
                    <Input name="secret" defaultValue={secret} required className="font-mono text-xs" />
                  </Field>
                </div>
              </ActionForm>
            </div>
          </details>
        </div>
      </Section>

      <Section title="llms.txt" intro="Un resumen de tu web pensado para los modelos de IA. Súbelo a la raíz de tu dominio (/llms.txt).">
        <label htmlFor="llms" className="sr-only">
          Contenido de llms.txt
        </label>
        <Textarea id="llms" readOnly rows={10} value={llms} className="font-mono text-xs" />
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyButton text={llms} label="Copiar" />
          <a
            href={`data:text/plain;charset=utf-8,${encodeURIComponent(llms)}`}
            download="llms.txt"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink-2"
          >
            Descargar llms.txt
          </a>
        </div>
      </Section>
    </div>
  );
}

/* ───────── Conexiones OAuth (analítica y redes) ───────── */
export function ConnectList({ title, intro, items, integrations }: { title: string; intro: string; items: { id: string; name: string; desc: string }[]; integrations: Integration[] }) {
  return (
    <Section title={title} intro={intro}>
      <ul className="space-y-3">
        {items.map((it) => {
          const row = integrations.find((i) => i.provider === it.id);
          return (
            <li key={it.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-paper p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {it.name}{" "}
                  {row && <Badge tone={row.status === "connected" ? "ok" : "warn"}>{row.status === "connected" ? "Conectado" : "Pendiente"}</Badge>}
                </p>
                <p className="text-sm text-ink-3">{it.desc}</p>
              </div>
              {row ? (
                <ActionForm action={disconnectIntegration.bind(null, it.id)} submitLabel="Desconectar" variant="ghost" inline />
              ) : (
                <ActionForm action={connectIntegration.bind(null, it.id)} submitLabel="Conectar" variant="ink" inline />
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/* ───────── Catálogo ───────── */
export function CatalogoSection({ shopifyConnected }: { shopifyConnected: boolean }) {
  const products = [
    { name: "Taza Alba 350 ml", sku: "TZ-ALBA", stock: 34 },
    { name: "Plato llano Barro 27 cm", sku: "PL-BAR27", stock: 120 },
    { name: "Jarrón Duna mediano", sku: "JR-DUNA-M", stock: 8 },
    { name: "Fuente oval Esmeralda", sku: "FT-ESM", stock: 15 },
  ];
  return (
    <Section title="Catálogo de productos" intro="Sincronizamos tus productos de Shopify para enlazarlos de forma natural en los artículos.">
      {shopifyConnected ? (
        <>
          <ul className="mb-5 divide-y divide-line rounded-xl border border-line">
            {products.map((p) => (
              <li key={p.sku} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="flex-1 font-medium">{p.name}</span>
                <span className="font-mono text-xs text-ink-3">{p.sku}</span>
                <Badge tone={p.stock > 10 ? "ok" : "warn"}>{p.stock} uds.</Badge>
              </li>
            ))}
          </ul>
          <ActionForm action={saveSettings.bind(null, "catalogo")} submitLabel="Guardar y sincronizar">
            <Toggle name="mention_products" defaultChecked label="Mencionar productos en los artículos" hint="Hasta 3 por artículo, solo cuando encajen." />
            <Toggle name="skip_out_of_stock" defaultChecked label="Ignorar productos sin stock" />
          </ActionForm>
        </>
      ) : (
        <p className="text-sm text-ink-2">Conecta Shopify en Ajustes › Publicación para activar el catálogo.</p>
      )}
    </Section>
  );
}

/* ───────── Marca blanca ───────── */
export function MarcaBlancaSection({ whiteLabel }: { whiteLabel: Record<string, string> }) {
  return (
    <div className="space-y-6">
      <Section title="Marca blanca" intro="Para agencias: tus clientes verán tu marca en el panel, los informes y los emails.">
        <ActionForm action={saveSettings.bind(null, "marca-blanca")}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Nombre de tu marca">
              <Input name="brand_name" defaultValue={whiteLabel.brand_name ?? ""} placeholder="Nido Studio" />
            </Field>
            <Field label="URL del logo (SVG o PNG)">
              <Input name="logo_url" type="url" defaultValue={whiteLabel.logo_url ?? ""} />
            </Field>
            <Field label="Color principal">
              <Input name="primary_color" type="color" defaultValue={whiteLabel.primary_color || "#ff4f1f"} className="h-11 p-1" />
            </Field>
            <Field label="Dominio propio" hint="Ej.: panel.tuagencia.com">
              <Input name="custom_domain" defaultValue={whiteLabel.custom_domain ?? ""} placeholder="panel.tuagencia.com" />
            </Field>
          </div>
          <Toggle name="hide_powered_by" defaultChecked={!!whiteLabel.hide_powered_by} label="Ocultar «Hecho con yeswecontent»" />
        </ActionForm>
      </Section>
      <DnsInstructions domain={whiteLabel.custom_domain} />
    </div>
  );
}

export function DnsInstructions({ domain }: { domain?: string }) {
  const host = domain || "panel.tuagencia.com";
  return (
    <Section title="Configurar el dominio" intro="Añade este registro en el proveedor de tu dominio. La propagación puede tardar hasta 24 horas.">
      <div className="scroll-x rounded-xl border border-line">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-paper text-left text-xs uppercase tracking-wide text-ink-3">
            <tr>
              <th className="px-4 py-2 font-medium">Tipo</th>
              <th className="px-4 py-2 font-medium">Nombre</th>
              <th className="px-4 py-2 font-medium">Valor</th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs">
            <tr>
              <td className="px-4 py-2.5">CNAME</td>
              <td className="px-4 py-2.5">{host.split(".")[0]}</td>
              <td className="px-4 py-2.5">cname.yeswecontent.com</td>
            </tr>
            <tr className="border-t border-line">
              <td className="px-4 py-2.5">TXT</td>
              <td className="px-4 py-2.5">_ywc.{host.split(".")[0]}</td>
              <td className="px-4 py-2.5">ywc-verify={Buffer.from(host).toString("hex").slice(0, 16)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* TODO: verificar el dominio y añadirlo al proyecto de Vercel vía API. */}
    </Section>
  );
}

/* ───────── Referidos ───────── */
export function ReferidosSection({ code, baseUrl }: { code: string; baseUrl: string }) {
  const link = `${baseUrl}/?ref=${code}`;
  return (
    <Section title="Recomienda y gana" intro="Por cada persona que contrate con tu enlace, te llevas el 25% de lo que pague durante 12 meses.">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="ref" className="sr-only">
          Tu enlace de referido
        </label>
        <Input id="ref" readOnly value={link} className="font-mono text-xs" />
        <CopyButton text={link} label="Copiar enlace" variant="primary" className="shrink-0" />
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        {[
          ["Visitas", "48"],
          ["Altas", "3"],
          ["Ganado", eur(11200)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl bg-paper p-4">
            <p className="text-2xl font-semibold">{v}</p>
            <p className="text-xs text-ink-3">{l}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ───────── Facturación ───────── */
export function FacturacionSection({
  sub,
  plans,
  siteId,
  invoices,
}: {
  sub: Subscription | null;
  plans: Plan[];
  siteId: string;
  invoices: { id: string; date: string; amount: number; status: string; url: string | null }[];
}) {
  const plan = plans.find((p) => p.id === sub?.plan_id);
  const statusLabel: Record<Subscription["status"], string> = { trialing: "En prueba", active: "Activa", past_due: "Pago pendiente", canceled: "Cancelada" };
  return (
    <div className="space-y-6">
      <Section title="Tu plan">
        {sub && plan ? (
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex-1">
              <p className="font-semibold tracking-tight text-xl">{plan.name}</p>
              <p className="text-sm text-ink-2">
                {eur(sub.interval === "year" ? plan.yearly_price_eur : plan.monthly_price_eur)}/mes · pago {sub.interval === "year" ? "anual" : "mensual"} · <Badge tone={sub.status === "active" ? "ok" : sub.status === "trialing" ? "lime" : "warn"}>{statusLabel[sub.status]}</Badge>
              </p>
              <p className="mt-1 text-xs text-ink-3">
                {sub.status === "trialing" && sub.trial_ends_at
                  ? `La prueba termina el ${fmtDate(sub.trial_ends_at, { day: "numeric", month: "long" })}.`
                  : sub.current_period_end
                    ? `Próxima renovación: ${fmtDate(sub.current_period_end, { day: "numeric", month: "long", year: "numeric" })}.`
                    : ""}
              </p>
            </div>
            <PortalButton />
          </div>
        ) : (
          <p className="text-sm text-ink-2">No tienes un plan activo para este sitio. Elige uno abajo.</p>
        )}
      </Section>

      <Section title="Cambiar de plan" intro="El cambio se prorratea automáticamente.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {plans.map((p) => {
            const current = p.id === sub?.plan_id;
            return (
              <div key={p.id} className={cn("rounded-2xl border p-5", current ? "border-ink bg-lime/20" : "border-line bg-paper")}>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold">{p.name}</p>
                  {current && <Badge tone="lime">Tu plan</Badge>}
                </div>
                <p className="mt-1 text-sm text-ink-2">
                  {eur(p.yearly_price_eur)}/mes en anual · {eur(p.monthly_price_eur)} en mensual
                </p>
                <ul className="mt-3 space-y-1 text-sm text-ink-2">
                  <li>{p.articles_per_month} artículos al mes</li>
                  <li>{p.tracked_prompts} preguntas en IA</li>
                  <li>{p.languages} idioma(s) · {p.seats ? `${p.seats} usuario(s)` : "usuarios ilimitados"}</li>
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(!current || sub?.interval !== "year") && <ChoosePlanButton planId={p.id} interval="year" siteId={siteId} label="Anual" variant={current ? "outline" : "primary"} />}
                  {(!current || sub?.interval !== "month") && <ChoosePlanButton planId={p.id} interval="month" siteId={siteId} label="Mensual" variant="outline" />}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Facturas">
        {invoices.length ? (
          <ul className="divide-y divide-line">
            {invoices.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <span className="font-mono text-xs">{i.id}</span>
                <span className="flex-1 text-ink-2">{fmtDate(i.date, { day: "numeric", month: "long", year: "numeric" })}</span>
                <span className="tabular-nums">{eur(i.amount)}</span>
                <Badge tone={i.status === "pagada" ? "ok" : "warn"}>{i.status}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-3">Tus facturas aparecerán aquí y en el portal de pago.</p>
        )}
      </Section>

      <Section title="Cancelar suscripción" intro="Puedes cancelar cuando quieras desde el portal de pago. Conservarás el acceso hasta el final del periodo pagado.">
        <PortalButton label="Cancelar desde el portal" variant="outline" />
      </Section>
    </div>
  );
}
