import Link from "next/link";
import { redirect } from "next/navigation";
import { Code2, ExternalLink, GitBranch, Globe, RefreshCw, Rss, SquareDashedMousePointer } from "lucide-react";
import { ActionForm } from "@/components/panel/action-form";
import { IntegrationKeysBanner } from "@/components/panel/integration-keys-banner";
import { LinkTabs } from "@/components/panel/tabs";
import { Badge, Card, CardHeader, Field, Input, PageHeader, Select } from "@/components/ui";
import { getCurrentSite } from "@/lib/data";
import { isDemo, siteUrl } from "@/lib/env";
import { cn, fmtDate } from "@/lib/utils";
import { createApiKey, revokeApiKey, saveFrameworkWebhook, saveGithub, testFrameworkWebhook } from "./actions";
import { HostedBlogForm } from "./hosted-blog-form";
import { getFrameworkWebhook, getGithub, getHostedBlogForPanel, listApiKeys } from "./data";
import { CopyCode, RevealForm } from "./forms";
import { snippet, type SnippetId } from "./snippets";

export const metadata = { title: "Integraciones" };

const TABS = [
  { id: "api", label: "API y claves" },
  { id: "frameworks", label: "Frameworks" },
  { id: "revalidacion", label: "Revalidación" },
  { id: "github", label: "GitHub" },
  { id: "blog", label: "Blog alojado" },
  { id: "widget", label: "Widget" },
];

const FRAMEWORKS = [
  { id: "nextjs", label: "Next.js" },
  { id: "nuxt", label: "Nuxt 3" },
  { id: "astro", label: "Astro" },
  { id: "react", label: "React SPA" },
  { id: "php", label: "PHP / Laravel" },
];

type Props = { searchParams: Promise<{ tab?: string; fw?: string }> };

/* ───────── piezas ───────── */

function Code({ title, code, lang }: { title: string; code: string; lang?: string }) {
  return (
    <figure className="min-w-0 overflow-hidden rounded-xl border border-ink/10 bg-ink text-paper">
      <figcaption className="flex items-center justify-between gap-2 border-b border-white/10 py-1 pl-4 pr-1.5">
        <span className="min-w-0 truncate font-mono text-xs text-paper/70">
          {title}
          {lang && <span className="sr-only"> ({lang})</span>}
        </span>
        <CopyCode text={code} />
      </figcaption>
      <pre className="max-h-[28rem] overflow-auto p-4 font-mono text-[12.5px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </figure>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="relative min-w-0 pl-10">
      <span className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-signal-soft text-xs font-semibold text-signal ring-1 ring-signal/20" aria-hidden>
        {n}
      </span>
      <h3 className="pt-1 text-[15px] font-semibold tracking-tight">{title}</h3>
      <div className="mt-2 min-w-0 space-y-3 text-[13px] leading-relaxed text-ink-2">{children}</div>
    </li>
  );
}

function Section({ title, intro, children, className }: { title: string; intro?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("min-w-0 overflow-hidden", className)}>
      <CardHeader title={title} intro={intro} />
      <div className="min-w-0 p-4 sm:p-5">{children}</div>
    </Card>
  );
}

const Mono = ({ children }: { children: React.ReactNode }) => <code className="break-all rounded bg-paper-2 px-1.5 py-0.5 font-mono text-[12.5px] text-ink">{children}</code>;

/* ───────── página ───────── */

export default async function IntegracionesPage({ searchParams }: Props) {
  const site = await getCurrentSite();
  if (!site) redirect("/onboarding");
  const sp = await searchParams;
  const tab = TABS.some((t) => t.id === sp.tab) ? sp.tab! : "api";
  const fw = FRAMEWORKS.some((f) => f.id === sp.fw) ? sp.fw! : "nextjs";

  const origin = siteUrl.replace(/\/$/, "");
  const api = `${origin}/api/v1/sites/${site.id}`;
  const s = (id: SnippetId) => snippet(id, { api, site: site.id, origin });
  const cnameTarget = process.env.HOSTED_BLOG_CNAME_TARGET ?? "blogs.yeswecontent.com";

  const [keys, github, webhook, hosted] = await Promise.all([listApiKeys(site.id), getGithub(site.id), getFrameworkWebhook(site.id), getHostedBlogForPanel(site.id)]);
  const activeKeys = keys.filter((k) => !k.revoked_at);

  const paths = [
    { tab: "blog", icon: Globe, title: "Blog alojado", badge: "Sin código", text: "Nosotros servimos el blog en blog.tudominio.com. Solo hay que crear un registro DNS." },
    { tab: "widget", icon: SquareDashedMousePointer, title: "Widget", badge: "2 líneas", text: "Pega un fragmento HTML y el blog aparece dentro de cualquier página." },
    { tab: "frameworks", icon: Code2, title: "API headless", badge: "Recomendado", text: "Next.js, Nuxt, Astro, React o PHP leen los artículos con una clave y se revalidan solos." },
    { tab: "github", icon: GitBranch, title: "GitHub", badge: "Jamstack", text: "Cada artículo llega como fichero .mdx a tu repositorio y tu CI lo despliega." },
  ];

  return (
    <>
      <PageHeader
        title="Integraciones"
        intro={
          <>
            Si tu web no usa WordPress, Shopify, Webflow ni Ghost, también puede recibir el contenido. Elige el camino que mejor encaje con tu equipo: desde cero código hasta una API completa.
          </>
        }
      />

      {!isDemo && <IntegrationKeysBanner />}

      <ul className="mb-6 grid grid-cols-2 gap-2.5 sm:mb-8 sm:gap-3 xl:grid-cols-4">
        {paths.map((p) => (
          <li key={p.tab} className="min-w-0">
            <Link href={`/panel/integraciones?tab=${p.tab}`} className={cn("flex h-full min-h-11 flex-col rounded-2xl border bg-card p-3 shadow-[var(--shadow-xs)] transition-all duration-150 hover:border-line-2 hover:shadow-[var(--shadow-sm)] sm:p-4", tab === p.tab ? "border-signal ring-1 ring-signal" : "border-line")}>
              <span className="flex items-center justify-between gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-signal-soft text-signal">
                  <p.icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <Badge tone={p.badge === "Recomendado" ? "lime" : "neutral"}>{p.badge}</Badge>
              </span>
              <span className="mt-3 text-sm font-semibold tracking-tight sm:text-[15px]">{p.title}</span>
              <span className="mt-1 hidden text-[13px] leading-snug text-ink-2 sm:block">{p.text}</span>
            </Link>
          </li>
        ))}
      </ul>

      <LinkTabs tabs={TABS} current={tab} basePath="/panel/integraciones" />

      {/* ───────── API y claves ───────── */}
      {tab === "api" && (
        <div className="grid min-w-0 gap-4 md:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-4 md:space-y-5">
            <Section title="Datos de tu sitio" intro="Los necesitarás en cualquier integración.">
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-ink-3">ID del sitio</dt>
                  <dd className="mt-1"><Mono>{site.id}</Mono></dd>
                </div>
                <div>
                  <dt className="text-ink-3">URL base de la API</dt>
                  <dd className="mt-1"><Mono>{api}</Mono></dd>
                </div>
                <div>
                  <dt className="text-ink-3">Feeds públicos (sin clave)</dt>
                  <dd className="mt-1 flex flex-wrap gap-2">
                    {["feed.xml", "feed.json", "sitemap.xml"].map((f) => (
                      <a key={f} href={`${api}/${f}`} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 text-xs font-medium shadow-[var(--shadow-xs)] transition-colors hover:bg-paper-2">
                        <Rss className="h-3.5 w-3.5" aria-hidden /> {f}
                      </a>
                    ))}
                  </dd>
                </div>
              </dl>
            </Section>

            <Section title="Crear una clave" intro="Las claves secretas (ywc_live_) van en el servidor. Las públicas (ywc_pub_) pueden ir en el navegador y se limitan a tu dominio.">
              <RevealForm action={createApiKey} submitLabel="Crear clave" pendingLabel="Creando…">
                <Field label="Nombre" hint="Para reconocerla luego, p. ej. «Web en producción».">
                  <Input name="name" placeholder="Web en producción" maxLength={80} />
                </Field>
                <Field label="Tipo">
                  <Select name="kind" defaultValue="secret">
                    <option value="secret">Secreta · para el servidor</option>
                    <option value="public">Pública · para el navegador</option>
                  </Select>
                </Field>
                <Field label="Orígenes permitidos (solo claves públicas)" hint="Separados por comas. Vacío = cualquier origen.">
                  <Input name="origins" placeholder="https://tudominio.com, https://www.tudominio.com" />
                </Field>
              </RevealForm>
              {isDemo && (
                <p className="mt-4 rounded-lg bg-sky-soft px-3 py-2 text-xs text-ink-2">
                  En modo demo la clave que verás funciona de verdad contra la API de prueba del sitio <Mono>s_tierrafina</Mono>.
                </p>
              )}
            </Section>

            <Section title={`Claves activas (${activeKeys.length})`}>
              {keys.length ? (
                <ul className="divide-y divide-line">
                  {keys.map((k) => (
                    <li key={k.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                          {k.name}
                          <Badge tone={k.kind === "public" ? "sky" : "neutral"}>{k.kind === "public" ? "Pública" : "Secreta"}</Badge>
                          {k.revoked_at && <Badge tone="bad">Revocada</Badge>}
                        </p>
                        <p className="mt-1 font-mono text-xs text-ink-3">{k.prefix}••••••••</p>
                        <p className="mt-0.5 text-xs text-ink-3">
                          Creada el {fmtDate(k.created_at, { day: "numeric", month: "short", year: "numeric" })} · {k.last_used_at ? `último uso ${fmtDate(k.last_used_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : "sin usar"}
                          {!!k.allowed_origins.length && ` · ${k.allowed_origins.join(", ")}`}
                        </p>
                      </div>
                      {!k.revoked_at && (
                        <ActionForm action={revokeApiKey} submitLabel="Revocar" pendingLabel="Revocando…" variant="outline" inline className="shrink-0">
                          <input type="hidden" name="id" value={k.id} />
                        </ActionForm>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-2">Aún no has creado ninguna clave.</p>
              )}
            </Section>
          </div>

          <div className="min-w-0 space-y-4 md:space-y-5">
            <Section title="Probar la API" intro="Solo devuelve artículos publicados. Paginación con ?page y ?per_page (máx. 100), filtros ?lang y ?tag, y ?include=content para traer el HTML en la lista.">
              <div className="space-y-4">
                <Code title="Terminal" lang="bash" code={s("curl")} />
                <Code title="Respuesta de /articles/{slug}" lang="json" code={s("response")} />
              </div>
            </Section>
            <Section title="Detalles técnicos">
              <ul className="list-disc space-y-2 pl-5 text-sm text-ink-2">
                <li>Autenticación con <Mono>Authorization: Bearer ywc_live_…</Mono>. Guardamos solo el hash SHA-256 de cada clave.</li>
                <li>CORS abierto, <Mono>ETag</Mono> y <Mono>If-None-Match</Mono> (respuestas 304) y <Mono>Cache-Control</Mono> en todas las respuestas.</li>
                <li>Límite de 600 peticiones por minuto y clave. Consulta <Mono>X-RateLimit-Remaining</Mono>; si lo superas, 429 con <Mono>Retry-After</Mono>.</li>
                <li>Cabecera <Mono>Link</Mono> y <Mono>X-Total-Count</Mono> para paginar.</li>
                <li>Cada artículo incluye <Mono>json_ld</Mono> (BlogPosting + FAQPage) listo para pegar en un <Mono>&lt;script type=&quot;application/ld+json&quot;&gt;</Mono>.</li>
              </ul>
            </Section>
          </div>
        </div>
      )}

      {/* ───────── Frameworks ───────── */}
      {tab === "frameworks" && (
        <div className="min-w-0">
          <nav aria-label="Framework" className="no-scrollbar -mx-1 mb-6 flex gap-2 overflow-x-auto px-1">
            {FRAMEWORKS.map((f) => (
              <Link
                key={f.id}
                href={`/panel/integraciones?tab=frameworks&fw=${f.id}`}
                aria-current={fw === f.id ? "page" : undefined}
                className={cn("inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-[13px] font-medium transition-colors duration-150 max-sm:h-10", fw === f.id ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink-2 hover:border-line-2 hover:bg-paper-2 hover:text-ink")}
              >
                {f.label}
              </Link>
            ))}
          </nav>

          {fw === "nextjs" && (
            <ol className="space-y-8">
              <Step n={1} title="Variables de entorno">
                <p>Crea una clave secreta en «API y claves» y el secreto del webhook en «Revalidación».</p>
                <Code title=".env.local" code={s("nextEnv")} />
              </Step>
              <Step n={2} title="Cliente de la API con caché por etiquetas">
                <p>Cada petición se etiqueta para poder invalidarla desde el webhook sin reconstruir toda la web.</p>
                <Code title="lib/yeswecontent.ts" lang="ts" code={s("nextLib")} />
              </Step>
              <Step n={3} title="Página del artículo con generateStaticParams">
                <p>Páginas estáticas en el build, metadatos SEO y JSON-LD incluidos. Los artículos nuevos se generan al primer acceso.</p>
                <Code title="app/blog/[slug]/page.tsx" lang="tsx" code={s("nextPage")} />
              </Step>
              <Step n={4} title="Ruta del webhook de revalidación">
                <p>
                  Verifica la firma y llama a <Mono>revalidateTag</Mono> y <Mono>revalidatePath</Mono>. Después pega <Mono>https://tu-web.com/api/ywc-revalidate</Mono> en la pestaña «Revalidación».
                </p>
                <Code title="app/api/ywc-revalidate/route.ts" lang="ts" code={s("nextWebhook")} />
              </Step>
            </ol>
          )}

          {fw === "nuxt" && (
            <ol className="space-y-8">
              <Step n={1} title="Rutas de servidor (la clave no sale del servidor)">
                <p>
                  Guarda la clave en <Mono>NUXT_YWC_API_KEY</Mono> y cachea las respuestas con <Mono>defineCachedEventHandler</Mono>.
                </p>
                <Code title="server/api/blog/*.get.ts" lang="ts" code={s("nuxtServer")} />
              </Step>
              <Step n={2} title="Página con useFetch y useSeoMeta">
                <Code title="pages/blog/[slug].vue" lang="vue" code={s("nuxtPage")} />
              </Step>
              <Step n={3} title="Webhook que vacía la caché">
                <p>
                  Pega <Mono>https://tu-web.com/api/ywc-webhook</Mono> en «Revalidación». Si generas la web estática (<Mono>nuxi generate</Mono>), usa en su lugar el Deploy Hook de tu hosting.
                </p>
                <Code title="server/api/ywc-webhook.post.ts" lang="ts" code={s("nuxtWebhook")} />
              </Step>
            </ol>
          )}

          {fw === "astro" && (
            <ol className="space-y-8">
              <Step n={1} title="Colección con content loader">
                <p>
                  Astro descarga todos los artículos en el build. Añade <Mono>YWC_API_KEY</Mono> a las variables de entorno de tu hosting.
                </p>
                <Code title="src/content.config.ts" lang="ts" code={s("astroConfig")} />
              </Step>
              <Step n={2} title="Página del artículo">
                <Code title="src/pages/blog/[slug].astro" lang="astro" code={s("astroPage")} />
              </Step>
              <Step n={3} title="Reconstrucción al publicar">
                <p>
                  En Vercel, Netlify o Cloudflare Pages crea un <strong>Deploy Hook</strong> y pégalo como URL en «Revalidación». Cada artículo publicado lanzará un build nuevo. Esto mismo sirve para Gatsby, Hugo, Eleventy o SvelteKit estático.
                </p>
              </Step>
            </ol>
          )}

          {fw === "react" && (
            <ol className="space-y-8">
              <Step n={1} title="Crea una clave pública limitada a tu dominio">
                <p>
                  En «API y claves» elige <strong>Pública</strong> y añade tu origen (p. ej. <Mono>https://tudominio.com</Mono>). Es de solo lectura y solo funciona desde ese dominio.
                </p>
              </Step>
              <Step n={2} title="Hook y componente">
                <Code title="useArticles.tsx" lang="tsx" code={s("react")} />
              </Step>
              <Step n={3} title="Ojo con el SEO">
                <p className="rounded-lg border border-warn/30 bg-warn-soft px-3 py-2 text-ink">
                  En una SPA el contenido se pinta en el navegador. Google lo acaba indexando, pero más tarde y peor; la mayoría de rastreadores de IA (ChatGPT, Perplexity, Claude) no ejecutan JavaScript y no lo verán. Si puedes, usa prerenderizado (Vite SSG, react-snap) o el blog alojado.
                </p>
              </Step>
            </ol>
          )}

          {fw === "php" && (
            <ol className="space-y-8">
              <Step n={1} title="PHP sin framework">
                <p>Funciona en cualquier hosting compartido. Guarda una caché de 10 minutos en disco.</p>
                <Code title="blog.php" lang="php" code={s("php")} />
              </Step>
              <Step n={2} title="Laravel">
                <p>
                  Servicio con caché por etiquetas, ruta del blog y webhook que la vacía al publicar. Configura <Mono>services.ywc.key</Mono> y <Mono>services.ywc.webhook_secret</Mono>.
                </p>
                <Code title="app/Services/YesWeContent.php" lang="php" code={s("laravel")} />
              </Step>
            </ol>
          )}
        </div>
      )}

      {/* ───────── Revalidación ───────── */}
      {tab === "revalidacion" && (
        <div className="grid min-w-0 gap-4 md:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Section
            title="Webhook de revalidación"
            intro="Cada vez que publicamos un artículo enviamos un POST firmado a tu web para que actualice su caché o lance un build."
          >
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
              {webhook?.url ? <Badge tone="ok">Configurado</Badge> : <Badge tone="neutral">Sin configurar</Badge>}
              {webhook?.url && <span className="min-w-0 break-all text-ink-3">{webhook.url}</span>}
            </div>
            <RevealForm action={saveFrameworkWebhook} submitLabel="Guardar webhook" secretTitle="Secreto de firma" secretHint="Guárdalo como YWC_WEBHOOK_SECRET en tu web. No volveremos a mostrarlo.">
              <Field label="URL del webhook" hint="Tu ruta de revalidación o un Deploy Hook de Vercel, Netlify o Cloudflare.">
                <Input name="url" type="url" required inputMode="url" placeholder="https://tu-web.com/api/ywc-revalidate" defaultValue={webhook?.url ?? ""} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Framework">
                  <Select name="framework" defaultValue={webhook?.framework ?? "nextjs"}>
                    <option value="nextjs">Next.js</option>
                    <option value="nuxt">Nuxt</option>
                    <option value="astro">Astro</option>
                    <option value="sveltekit">SvelteKit</option>
                    <option value="gatsby">Gatsby</option>
                    <option value="hugo">Hugo</option>
                    <option value="remix">Remix</option>
                    <option value="laravel">Laravel</option>
                    <option value="static">Web estática (Deploy Hook)</option>
                    <option value="other">Otro</option>
                  </Select>
                </Field>
                <Field label="Ruta del blog" hint="Para calcular las rutas a revalidar.">
                  <Input name="base_path" placeholder="/blog" defaultValue={webhook?.base_path ?? "/blog"} />
                </Field>
              </div>
              {webhook?.has_secret && (
                <label className="flex min-h-11 items-center gap-2 text-sm text-ink-2">
                  <input type="checkbox" name="rotate" className="h-4 w-4 accent-[var(--signal)]" /> Generar un secreto nuevo (invalida el anterior)
                </label>
              )}
            </RevealForm>
            <div className="mt-5 border-t border-line pt-5">
              <ActionForm action={testFrameworkWebhook} submitLabel={<><RefreshCw className="h-4 w-4" aria-hidden /> Enviar evento de prueba</>} pendingLabel="Enviando…" variant="outline" />
            </div>
          </Section>
          <div className="min-w-0 space-y-4 md:space-y-5">
            <Section title="Qué recibe tu web" intro="Rechaza la petición si la firma no coincide o si t tiene más de 5 minutos.">
              <Code title="article.published" lang="http" code={s("webhookPayload")} />
            </Section>
            <Section title="Cómo se firma">
              <p className="text-sm text-ink-2">
                <Mono>X-YWC-Signature: t=&lt;unix&gt;,v1=&lt;hex&gt;</Mono>, donde <Mono>hex = HMAC-SHA256(secreto, t + &quot;.&quot; + cuerpo)</Mono>. Reintentamos hasta 3 veces si tu web responde 5xx o 429. Tienes ejemplos de verificación en la pestaña «Frameworks».
              </p>
            </Section>
          </div>
        </div>
      )}

      {/* ───────── GitHub ───────── */}
      {tab === "github" && (
        <div className="grid min-w-0 gap-4 md:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Section title="Publicar en un repositorio de GitHub" intro="Para webs estáticas y Jamstack: Astro, Hugo, Next.js con MDX, Nuxt Content, Eleventy, Jekyll o Gatsby.">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
              {github?.owner ? <Badge tone="ok">Conectado · {github.owner}</Badge> : <Badge tone="neutral">Sin conectar</Badge>}
            </div>
            <ActionForm action={saveGithub} submitLabel="Probar conexión y guardar" pendingLabel="Comprobando acceso…">
              <Field label="Repositorio" hint="propietario/repositorio">
                <Input name="repo" required placeholder="tierrafina/web" defaultValue={github?.owner ?? ""} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Rama" hint="Vacío = rama por defecto.">
                  <Input name="branch" placeholder="main" defaultValue={github?.branch ?? ""} />
                </Field>
                <Field label="Formato">
                  <Select name="format" defaultValue={github?.format ?? "mdx"}>
                    <option value="mdx">MDX (.mdx)</option>
                    <option value="md">Markdown (.md)</option>
                  </Select>
                </Field>
              </div>
              <Field label="Ruta del fichero" hint="Variables: {slug}, {lang}, {yyyy}, {mm}, {dd}.">
                <Input name="path_template" placeholder="content/blog/{slug}.mdx" defaultValue={github?.path_template ?? ""} spellCheck={false} />
              </Field>
              <Field label="Modo">
                <Select name="mode" defaultValue={github?.mode ?? "commit"}>
                  <option value="commit">Commit directo (se publica al desplegar)</option>
                  <option value="pull_request">Pull request (lo revisas antes)</option>
                </Select>
              </Field>
              <Field label="URL pública del artículo (opcional)" hint="Para enlazarlo desde el panel. Usa {slug}.">
                <Input name="public_url_template" placeholder="https://tudominio.com/blog/{slug}" defaultValue={github?.public_url_template ?? ""} />
              </Field>
              <Field label="Token fine-grained" hint={github?.has_token ? "Ya hay un token guardado. Déjalo vacío para conservarlo." : "GitHub → Settings → Developer settings → Fine-grained tokens. Solo este repositorio, permiso Contents: Read and write (y Pull requests si usas PR)."}>
                <Input name="token" type="password" autoComplete="off" placeholder={github?.has_token ? "••••••••••••" : "github_pat_…"} />
              </Field>
            </ActionForm>
          </Section>
          <Section title="Así llega cada artículo" intro="Frontmatter compatible con Astro, Hugo, Nuxt Content, Contentlayer y Velite. La FAQ va en el frontmatter para que la pintes y generes su schema.">
            <Code title="content/blog/vajilla-artesanal.mdx" lang="mdx" code={s("frontmatter")} />
          </Section>
        </div>
      )}

      {/* ───────── Blog alojado ───────── */}
      {tab === "blog" && (
        <div className="grid min-w-0 gap-4 md:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Section title="Blog alojado" intro="Un blog rápido y con SEO completo (canonical, Open Graph, JSON-LD, sitemap y RSS), con los colores de tu marca. Tu equipo no toca nada de la web.">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {hosted?.enabled ? <Badge tone="ok">Activo</Badge> : <Badge tone="neutral">Desactivado</Badge>}
              <a href={`/blog-hosted/${site.id}`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-signal underline underline-offset-4">
                Ver vista previa <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>
            <HostedBlogForm siteId={site.id} siteName={site.name} siteUrl={site.url} hosted={hosted} cnameTarget={cnameTarget} previewPath={`${origin}/blog-hosted/${site.id}`} />
          </Section>
          <div className="min-w-0 space-y-4 md:space-y-5">
            <Section title="Opción A · Subdominio (recomendada)">
              <ol className="space-y-6">
                <Step n={1} title="Crea un registro CNAME en tu DNS">
                  <div className="overflow-x-auto rounded-lg border border-line">
                    <table className="w-full min-w-[320px] text-left text-[13px]">
                      <thead className="bg-paper-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">
                        <tr>
                          <th className="px-3 py-2 font-medium">Tipo</th>
                          <th className="px-3 py-2 font-medium">Nombre</th>
                          <th className="px-3 py-2 font-medium">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="font-mono text-[13px]">
                          <td className="px-3 py-2">CNAME</td>
                          <td className="px-3 py-2">blog</td>
                          <td className="break-all px-3 py-2">{cnameTarget}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>En Cloudflare, deja la nube en gris (solo DNS) hasta que el certificado esté emitido.</p>
                </Step>
                <Step n={2} title="Escribe el dominio aquí y activa el blog">
                  <p>Emitimos el certificado HTTPS automáticamente. Suele tardar menos de 10 minutos.</p>
                </Step>
                <Step n={3} title="Enlázalo desde tu web">
                  <p>Añade «Blog» al menú principal apuntando a tu subdominio. El sitemap y el RSS ya están en <Mono>/sitemap.xml</Mono> y <Mono>/feed.xml</Mono>.</p>
                </Step>
              </ol>
            </Section>
            <Section title="Opción B · Carpeta /blog con proxy inverso" intro="Mejor para el SEO si quieres sumar autoridad al dominio principal. Requiere un cambio puntual en tu servidor.">
              <div className="space-y-4">
                <Code title="nginx.conf" lang="nginx" code={s("nginx")} />
                <Code title="next.config.js · Vercel" lang="js" code={s("nextRewrites")} />
              </div>
            </Section>
          </div>
        </div>
      )}

      {/* ───────── Widget ───────── */}
      {tab === "widget" && (
        <div className="grid min-w-0 gap-4 md:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Section title="Widget para incrustar" intro="Para webs donde nadie puede tocar el código del servidor: Wix, Squarespace, Framer, Carrd, Jimdo o una página HTML. Pesa menos de 5 KB y no necesita clave.">
            <Code title="Pega esto en tu página" lang="html" code={s("embed")} />
            <ul className="mt-5 list-disc space-y-2 pl-5 text-sm text-ink-2">
              <li>Muestra la lista de artículos y, al pulsar uno, el artículo completo (con la ruta <Mono>#/slug</Mono>).</li>
              <li>Hereda la tipografía de tu web. Puedes desactivar nuestros estilos con <Mono>data-styles=&quot;none&quot;</Mono>.</li>
              <li>Lee el feed público, así que no expone ninguna clave.</li>
            </ul>
          </Section>
          <Section title="Antes de usarlo, ten en cuenta el SEO">
            <div className="space-y-3 text-sm text-ink-2">
              <p className="rounded-lg border border-warn/30 bg-warn-soft px-3 py-2 text-ink">
                El widget pinta el contenido con JavaScript en el navegador. Google puede indexarlo, pero tarda más y le da menos peso, y los rastreadores de IA (ChatGPT, Perplexity, Claude) normalmente no lo ven.
              </p>
              <p>
                Úsalo como solución rápida o temporal. Para posicionar de verdad, elige el <Link href="/panel/integraciones?tab=blog" className="font-medium text-signal underline">blog alojado</Link> (cero código, HTML servido desde el servidor) o la <Link href="/panel/integraciones?tab=frameworks" className="font-medium text-signal underline">API</Link>.
              </p>
              <p>Para compensar, inserta el JSON-LD de cada artículo y enlaza al RSS desde tu web.</p>
            </div>
          </Section>
        </div>
      )}
    </>
  );
}
