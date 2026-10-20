/**
 * Historias paso a paso para ScrollSteps: cada una es una lista de pasos y una pantalla del
 * producto por paso que se va completando con el scroll. Dentro de cada pantalla, `at(k, t)`
 * hace que un elemento aparezca cuando el avance del paso llega a k/t. Marca de ejemplo: Tierrafina.
 */
import type { CSSProperties, ReactNode } from "react";
import { CalendarDays, Check, CircleAlert, CircleCheck, CircleX, Clock, FileText, Globe, ImageIcon, KeyRound, Link2, MessageSquare, Palette, PenLine, Plug, Search, Send, Share2, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { EngineLogo } from "./primitives";
import { ScrollSteps, type Step, type StepPanel } from "./scroll-fx";

const at = (k: number, t: number) => ({ "--k": k, "--t": t }) as CSSProperties;

/* ───────── Piezas comunes ───────── */

function Screen({ title, aside, children }: { title: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex h-full flex-col p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-[13px] font-semibold">{title}</p>
        {aside && <span className="shrink-0 text-[11px] text-ink-3">{aside}</span>}
      </div>
      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2">{children}</div>
    </div>
  );
}

function Row({ k, t, icon, title, sub, right, tone = "card" }: { k: number; t: number; icon?: ReactNode; title: ReactNode; sub?: ReactNode; right?: ReactNode; tone?: "card" | "soft" | "ok" }) {
  return (
    <div
      className={cn(
        "sx-at flex items-center gap-3 rounded-xl border px-3 py-2 shadow-[var(--shadow-xs)]",
        tone === "card" && "border-line bg-card",
        tone === "soft" && "border-signal/25 bg-signal-soft",
        tone === "ok" && "border-ok/20 bg-ok-soft",
      )}
      style={at(k, t)}
    >
      {icon && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-paper-2 text-ink-2 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium">{title}</span>
        {sub && <span className="block truncate text-[11.5px] text-ink-3">{sub}</span>}
      </span>
      {right && <span className="shrink-0">{right}</span>}
    </div>
  );
}

const Done = () => (
  <span className="grid h-5 w-5 place-items-center rounded-full bg-ok text-white">
    <Check className="h-3 w-3" aria-hidden />
  </span>
);

function Bar({ label, value, k, t }: { label: string; value: number; k: number; t: number }) {
  return (
    <div className="sx-at" style={at(k, t)}>
      <div className="flex justify-between text-[11.5px]">
        <span className="text-ink-2">{label}</span>
        <span className="tabular font-semibold">{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-3">
        <span className="sx-bar block h-full origin-left rounded-full bg-signal" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Lines({ k, t, widths = [100, 92, 97, 64] }: { k: number; t: number; widths?: number[] }) {
  return (
    <div className="sx-at space-y-1.5" style={at(k, t)} aria-hidden>
      {widths.map((w, i) => (
        <span key={i} className="block h-1.5 rounded-full bg-paper-3" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

/* ───────── 1. Así nace un artículo ───────── */

const articleSteps: Step[] = [
  { n: "01", title: "Un brief con intención", text: "Partimos de una búsqueda real del plan: qué quiere saber quien busca, qué responden hoy los primeros resultados y qué puedes aportar tú." },
  { n: "02", title: "Un borrador con tu voz", text: "Se escribe con tu tono y tus productos, con respuesta directa arriba, preguntas frecuentes y datos con fuente." },
  { n: "03", title: "Imágenes y enlaces", text: "Portada con texto alternativo, enlaces internos a tus páginas clave y, si quieres, enlaces desde webs afines de la red." },
  { n: "04", title: "Nota, y a publicar", text: "Se puntúa la calidad; si no llega a tu umbral, se reescribe. Cuando pasa, se programa en tu web a su hora." },
];

const articlePanels: StepPanel[] = [
  {
    url: "app.yeswecontent.com/articulos/nuevo",
    node: (
      <Screen title="Brief · vajilla de gres" aside="intención: comparar y comprar">
        <Row k={1} t={5} icon={<Search />} title="«cómo elegir vajilla de gres»" sub="2.400 búsquedas/mes · dificultad baja" />
        <Row k={2} t={5} icon={<FileText />} title="Lo que ya responde el top 5" sub="Listas genéricas, sin cuidados ni precios" />
        <Row k={3} t={5} icon={<Sparkles />} title="Tu ángulo" sub="Taller propio: cocción a 1.250 °C y esmaltes sin plomo" tone="soft" />
        <Row k={4} t={5} icon={<CalendarDays />} title="Encaja en el clúster «Compra»" sub="Enlazará a 3 artículos y 2 categorías" />
      </Screen>
    ),
  },
  {
    url: "app.yeswecontent.com/articulos/128",
    node: (
      <Screen title="Borrador · 1.840 palabras" aside="tono: cercano">
        <p className="sx-at font-display text-[1.35rem] leading-tight sm:text-2xl" style={at(1, 6)}>
          Cómo elegir una vajilla de gres que te dure veinte años
        </p>
        <div className="sx-at rounded-lg border border-line bg-lime-soft px-3 py-2 text-[12px] leading-snug" style={at(2, 6)}>
          <strong>Respuesta corta:</strong> busca gres cocido a más de 1.200 °C, esmalte sin plomo y apto para lavavajillas.
        </div>
        <Lines k={3} t={6} />
        <div className="sx-at flex flex-wrap gap-1.5" style={at(4.5, 6)}>
          {["FAQ · 4 preguntas", "3 fuentes citadas", "Tabla comparativa"].map((x) => (
            <Badge key={x} className="px-2 text-[10.5px]">
              {x}
            </Badge>
          ))}
        </div>
      </Screen>
    ),
  },
  {
    url: "app.yeswecontent.com/articulos/128/medios",
    node: (
      <Screen title="Imágenes y enlaces" aside="4 internos · 1 externo">
        <div className="sx-at grid grid-cols-[5.5rem_1fr] gap-3 rounded-xl border border-line bg-card p-2.5 shadow-[var(--shadow-xs)]" style={at(1, 6)}>
          <span className="grid aspect-[4/3] place-items-center rounded-lg bg-sky-soft text-ink-2">
            <ImageIcon className="h-6 w-6" aria-hidden />
          </span>
          <span className="min-w-0 self-center">
            <span className="block truncate text-[13px] font-medium">Portada generada</span>
            <span className="block truncate text-[11.5px] text-ink-3">alt: «Platos de gres esmaltado en verde»</span>
          </span>
        </div>
        <Row k={2.5} t={6} icon={<Link2 />} title="→ /coleccion/vajillas" sub="«vajillas de gres hechas a mano»" />
        <Row k={3.5} t={6} icon={<Link2 />} title="→ /blog/gres-o-porcelana" sub="«diferencias con la porcelana»" />
        <Row k={4.5} t={6} icon={<Share2 />} title="Enlace desde decohogar.es" sub="Red de enlaces · pendiente de tu visto bueno" tone="soft" />
      </Screen>
    ),
  },
  {
    url: "app.yeswecontent.com/articulos/128/revision",
    node: (
      <Screen title="Control de calidad" aside="umbral: 85">
        <Bar label="Utilidad" value={94} k={1} t={6} />
        <Bar label="Voz de marca" value={90} k={1.6} t={6} />
        <Bar label="SEO on-page" value={92} k={2.2} t={6} />
        <Bar label="Preparado para IA" value={88} k={2.8} t={6} />
        <Row k={4.2} t={6} icon={<Send />} title="Programado en WordPress" sub="Jueves 9:00 · FAQPage + Article" right={<Done />} tone="ok" />
      </Screen>
    ),
  },
];

/* ───────── 2. Conectar tu web y publicar solo ───────── */

const publishSteps: Step[] = [
  { n: "01", title: "Eliges dónde publicas", text: "WordPress, Shopify, Webflow, Ghost o cualquier web con nuestra API, Git o blog alojado." },
  { n: "02", title: "Conectas en un minuto", text: "Una clave de aplicación o un permiso de OAuth. Comprobamos que podemos escribir y no tocamos nada más." },
  { n: "03", title: "Y se publica solo", text: "Eliges días y hora. Cada artículo llega maquetado, con imagen, categoría, autor y datos estructurados." },
];

const cms = ["WordPress", "Shopify", "Webflow", "Ghost", "API / Next.js", "Blog alojado"];

const publishPanels: StepPanel[] = [
  {
    url: "app.yeswecontent.com/ajustes/publicacion",
    node: (
      <Screen title="¿Dónde está tu web?" aside="paso 1 de 3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {cms.map((c, i) => (
            <span
              key={c}
              className={cn("sx-at grid h-14 place-items-center rounded-xl border text-[13px] font-semibold shadow-[var(--shadow-xs)]", i === 0 ? "border-signal bg-signal-soft text-ink" : "border-line bg-card text-ink-2")}
              style={at(1 + i * 0.6, 6)}
            >
              {c}
            </span>
          ))}
        </div>
        <p className="sx-at mt-auto text-[11.5px] text-ink-3" style={at(5, 6)}>
          ¿Otra plataforma? Webhook o RSS: también vale.
        </p>
      </Screen>
    ),
  },
  {
    url: "app.yeswecontent.com/ajustes/publicacion/wordpress",
    node: (
      <Screen title="Conectar WordPress" aside="paso 2 de 3">
        <Row k={1} t={6} icon={<Globe />} title="tierrafina.es" sub="URL de tu WordPress" />
        <Row k={2} t={6} icon={<KeyRound />} title="•••• •••• •••• 7Qk2" sub="Contraseña de aplicación · cifrada" />
        <Row k={3.2} t={6} icon={<Plug />} title="Probando conexión…" sub="Leer categorías · crear borrador · subir imagen" />
        <Row k={4.6} t={6} icon={<CircleCheck />} title="Conectado" sub="Permisos de autor · sin acceso a plugins ni usuarios" right={<Done />} tone="ok" />
      </Screen>
    ),
  },
  {
    url: "app.yeswecontent.com/publicacion",
    node: (
      <Screen title="Cola de publicación" aside="mar y jue · 9:00">
        {[
          ["Mar 21", "Cómo elegir una vajilla de gres", "Publicado"],
          ["Jue 23", "Esmaltes sin plomo: qué mirar", "Publicado"],
          ["Mar 28", "Regalos de cerámica para bodas", "Programado"],
          ["Jue 30", "¿El gres va al lavavajillas?", "Programado"],
        ].map(([d, t, s], i) => (
          <Row
            key={t}
            k={1 + i * 1.1}
            t={6}
            icon={<Clock />}
            title={t}
            sub={`${d} · WordPress`}
            right={
              <Badge tone={s === "Publicado" ? "ok" : "neutral"} dot className="px-2 text-[10px] leading-4">
                {s}
              </Badge>
            }
          />
        ))}
      </Screen>
    ),
  },
];

/* ───────── 3. Visibilidad en IA ───────── */

const aiSteps: Step[] = [
  { n: "01", title: "Eliges las preguntas", text: "Las que haría tu cliente antes de comprar. Te sugerimos las más probables a partir de tu web y tu sector." },
  { n: "02", title: "Las preguntamos cada día", text: "A ChatGPT, Claude, Gemini y Perplexity. Guardamos si sales, en qué posición, con qué fuentes y junto a quién." },
  { n: "03", title: "Ves cuándo te citan", text: "Y qué contenido lo ha conseguido. Las preguntas donde aún no sales se convierten en temas para el plan." },
];

const models = ["ChatGPT", "Claude", "Gemini", "Perplexity"];

const aiPanels: StepPanel[] = [
  {
    url: "app.yeswecontent.com/visibilidad/preguntas",
    node: (
      <Screen title="Preguntas seguidas" aside="6 de 18">
        {["¿Dónde comprar vajilla de gres artesanal?", "¿Gres o porcelana para uso diario?", "Regalo de boda original hecho a mano", "¿Qué vajilla aguanta el lavavajillas?"].map((q, i) => (
          <Row key={q} k={1 + i} t={5.5} icon={<MessageSquare />} title={`«${q}»`} right={<Done />} />
        ))}
      </Screen>
    ),
  },
  {
    url: "app.yeswecontent.com/visibilidad/hoy",
    node: (
      <Screen title="Consultando asistentes · hoy" aside="cada día a las 7:00">
        {models.map((m, i) => (
          <div key={m} className="sx-at flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-2.5 shadow-[var(--shadow-xs)]" style={at(1 + i, 6)}>
            <EngineLogo name={m} size={18} alt="" />
            <span className="w-20 shrink-0 text-[13px] font-medium">{m}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-3">
              <span className="sx-bar block h-full origin-left rounded-full bg-ink" style={{ width: `${[72, 61, 50, 83][i]}%` }} />
            </span>
            <span className="tabular w-10 text-right text-[11.5px] text-ink-3">{["13", "11", "9", "15"][i]}/18</span>
          </div>
        ))}
      </Screen>
    ),
  },
  {
    url: "app.yeswecontent.com/visibilidad/citas",
    node: (
      <Screen title="Nueva cita" aside="hace 2 h">
        <div className="sx-at rounded-xl border border-line bg-ink p-3.5 text-[12.5px] leading-relaxed text-paper shadow-[var(--shadow-md)]" style={at(1, 5)}>
          <p className="flex items-center gap-2 text-[11px] text-paper/60">
            <EngineLogo name="Perplexity" size={14} alt="" /> «¿Dónde comprar vajilla de gres artesanal?»
          </p>
          <p className="mt-2">
            …una buena opción es <mark className="rounded bg-lime px-1 text-ink">Tierrafina</mark>, que explica cómo elegir gres apto para diario…
          </p>
          <p className="sx-at mt-2 inline-flex rounded-full border border-paper/20 px-2 py-0.5 font-mono text-[10.5px] text-lime" style={at(2.2, 5)}>
            1 tierrafina.es/blog/vajilla-gres
          </p>
        </div>
        <Row k={3.4} t={5} icon={<Sparkles />} title="Posición #1 en Perplexity" sub="El artículo del jueves es la fuente" tone="ok" />
      </Screen>
    ),
  },
];

/* ───────── 4. Red de enlaces ───────── */

const linkSteps: Step[] = [
  { n: "01", title: "Tu web entra en la red", text: "Indicamos tu temática y tus páginas importantes. Solo te emparejamos con webs afines y reales." },
  { n: "02", title: "Buscamos encajes", text: "Párrafos de otros artículos donde un enlace a ti ayuda al lector, y al revés. Sin reciprocidad obvia." },
  { n: "03", title: "Tú decides", text: "Ves cada enlace en su contexto antes de que se publique. Lo apruebas o lo rechazas con un clic." },
];

const linkPanels: StepPanel[] = [
  {
    url: "app.yeswecontent.com/enlaces/alta",
    node: (
      <Screen title="Tu perfil en la red" aside="créditos: 8">
        <Row k={1} t={5} icon={<Globe />} title="tierrafina.es" sub="Cerámica y hogar · ES" />
        <div className="sx-at flex flex-wrap gap-1.5" style={at(2, 5)}>
          {["cerámica", "decoración", "regalos", "cocina", "artesanía"].map((x) => (
            <Badge key={x} tone="signal" className="px-2 text-[11px]">
              {x}
            </Badge>
          ))}
        </div>
        <Row k={3} t={5} icon={<Link2 />} title="Páginas que quieres empujar" sub="/coleccion/vajillas · /taller · /regalos" />
        <Row k={4} t={5} icon={<Users />} title="214 webs afines en la red" sub="Ninguna de tu competencia directa" tone="soft" />
      </Screen>
    ),
  },
  {
    url: "app.yeswecontent.com/enlaces/encajes",
    node: (
      <Screen title="Encajes encontrados" aside="esta semana">
        {[
          ["decohogar.es", "Ideas para una mesa de otoño", 92],
          ["casaycampo.com", "Qué regalar en una boda", 88],
          ["cocinalenta.es", "Utensilios que duran toda la vida", 81],
        ].map(([s, t, v], i) => (
          <Row key={s as string} k={1 + i * 1.3} t={5.5} icon={<Share2 />} title={t} sub={s as string} right={<span className="tabular text-[11.5px] font-semibold text-ok">{v}% afinidad</span>} />
        ))}
      </Screen>
    ),
  },
  {
    url: "app.yeswecontent.com/enlaces/revisar",
    node: (
      <Screen title="Revisar enlace" aside="decohogar.es">
        <div className="sx-at rounded-xl border border-line bg-card p-3.5 text-[12.5px] leading-relaxed text-ink-2 shadow-[var(--shadow-xs)]" style={at(1, 5)}>
          …para la mesa, mejor platos que soporten el uso diario. Una{" "}
          <span className="rounded bg-signal-soft px-1 font-medium text-signal underline decoration-signal/40 underline-offset-2">vajilla de gres hecha a mano</span> aguanta horno y lavavajillas y envejece bien…
        </div>
        <div className="sx-at flex gap-2" style={at(2.4, 5)}>
          <span className="flex-1 rounded-lg border border-line bg-card py-2 text-center text-[12px] font-semibold text-ink-2">Rechazar</span>
          <span className="flex-1 rounded-lg bg-ink py-2 text-center text-[12px] font-semibold text-paper">Aprobar</span>
        </div>
        <Row k={3.8} t={5} icon={<CircleCheck />} title="Enlace publicado" sub="Dentro del artículo, no en el pie" right={<Done />} tone="ok" />
      </Screen>
    ),
  },
];

/* ───────── 5. Social: de un artículo, muchas piezas ───────── */

const socialSteps: Step[] = [
  { n: "01", title: "Partimos de un artículo", text: "Cada texto publicado es materia prima: ideas, datos y preguntas que ya han funcionado en tu web." },
  { n: "02", title: "Lo convertimos en piezas", text: "Un carrusel para Instagram y LinkedIn, y respuestas útiles para hilos de Reddit y Quora donde preguntan por lo tuyo." },
  { n: "03", title: "Queda programado", text: "Tú revisas y apruebas. Publicamos a la hora en que tu público está mirando." },
];

const socialPanels: StepPanel[] = [
  {
    url: "app.yeswecontent.com/social/origen",
    node: (
      <Screen title="Artículo de origen" aside="publicado el jueves">
        <p className="sx-at font-display text-[1.3rem] leading-tight sm:text-2xl" style={at(1, 5)}>
          Cómo elegir una vajilla de gres que te dure veinte años
        </p>
        <Lines k={2} t={5} widths={[100, 94, 88]} />
        <Row k={3} t={5} icon={<Sparkles />} title="5 ideas aprovechables" sub="temperatura · esmaltes · cuidados · precio · regalo" tone="soft" />
      </Screen>
    ),
  },
  {
    url: "app.yeswecontent.com/social/piezas",
    node: (
      <Screen title="Piezas generadas" aside="3 formatos">
        <div className="grid grid-cols-3 gap-2">
          {["5 señales de un gres de calidad", "Lo que no te cuentan del esmalte", "¿Va al lavavajillas?"].map((t, i) => (
            <span
              key={t}
              className={cn("sx-at flex aspect-[4/5] flex-col justify-between rounded-xl p-2.5 text-[11.5px] font-semibold leading-tight shadow-[var(--shadow-sm)]", ["bg-signal text-white", "bg-ink text-paper", "bg-lime text-ink"][i])}
              style={at(1 + i * 0.8, 6)}
            >
              <span className="opacity-70">{i + 1}/5</span>
              {t}
            </span>
          ))}
        </div>
        <Row k={4} t={6} icon={<MessageSquare />} title="Respuesta para r/Cooking" sub="«¿Qué platos aguantan el día a día?»" />
      </Screen>
    ),
  },
  {
    url: "app.yeswecontent.com/social/calendario",
    node: (
      <Screen title="Programado" aside="esta semana">
        {[
          ["Lun 18:30", "Carrusel · Instagram", "ok"],
          ["Mar 9:00", "Carrusel · LinkedIn", "ok"],
          ["Mié 20:00", "Respuesta · Reddit", "neutral"],
          ["Vie 12:00", "Respuesta · Quora", "neutral"],
        ].map(([d, t, tone], i) => (
          <Row
            key={t}
            k={1 + i}
            t={5.5}
            icon={<CalendarDays />}
            title={t}
            sub={d}
            right={
              <Badge tone={tone as "ok" | "neutral"} dot className="px-2 text-[10px] leading-4">
                {tone === "ok" ? "Aprobado" : "Por revisar"}
              </Badge>
            }
          />
        ))}
      </Screen>
    ),
  },
];

/* ───────── 6. Auditoría técnica y GEO ───────── */

const auditSteps: Step[] = [
  { n: "01", title: "Rastreamos tu web", text: "Como lo haría un buscador y como lo haría un asistente: rastreo, etiquetas, velocidad, schema y llms.txt." },
  { n: "02", title: "Lo ordenamos por impacto", text: "No una lista de 300 avisos: lo que más te frena primero, con cuánto esfuerzo cuesta arreglarlo." },
  { n: "03", title: "Lo arreglamos contigo", text: "Lo que podemos hacer nosotros, lo hacemos. Lo demás llega con instrucciones claras para tu web." },
];

const auditPanels: StepPanel[] = [
  {
    url: "app.yeswecontent.com/auditoria/rastreo",
    node: (
      <Screen title="Rastreando tierrafina.es" aside="186 URLs">
        <div className="h-1.5 overflow-hidden rounded-full bg-paper-3" aria-hidden>
          <span className="sx-bar block h-full origin-left rounded-full bg-signal" />
        </div>
        {["robots.txt y sitemap", "Títulos y descripciones", "Velocidad en móvil", "Datos estructurados", "Preparación para IA"].map((x, i) => (
          <Row key={x} k={1 + i * 0.9} t={6} title={x} right={<Done />} />
        ))}
      </Screen>
    ),
  },
  {
    url: "app.yeswecontent.com/auditoria/prioridades",
    node: (
      <Screen title="Prioridades" aside="impacto · esfuerzo">
        <Row k={1} t={5} icon={<CircleX className="text-bad" />} title="Falta llms.txt" sub="Alto impacto en IA · 5 min" right={<Badge tone="signal" className="px-2 text-[10px]">1º</Badge>} />
        <Row k={2} t={5} icon={<CircleAlert className="text-warn" />} title="LCP de 3,1 s en móvil" sub="Imágenes sin comprimir · 30 min" right={<Badge className="px-2 text-[10px]">2º</Badge>} />
        <Row k={3} t={5} icon={<CircleAlert className="text-warn" />} title="6 títulos duplicados" sub="Categorías · 15 min" right={<Badge className="px-2 text-[10px]">3º</Badge>} />
        <Row k={4} t={5} icon={<CircleCheck className="text-ok" />} title="Schema Article y FAQPage" sub="Correcto" />
      </Screen>
    ),
  },
  {
    url: "app.yeswecontent.com/auditoria",
    node: (
      <Screen title="Nota técnica" aside="tras los arreglos">
        <div className="sx-at flex items-end gap-3" style={at(1, 5)}>
          <span className="tabular text-[3rem] leading-none font-semibold tracking-tight">91</span>
          <span className="pb-1.5 text-[12px] text-ink-3">/ 100 · antes 72</span>
        </div>
        <Bar label="Técnica" value={96} k={2} t={5} />
        <Bar label="Contenido" value={88} k={2.6} t={5} />
        <Bar label="Preparación IA" value={90} k={3.2} t={5} />
        <Row k={4.2} t={5} icon={<CircleCheck />} title="llms.txt generado y publicado" right={<Done />} tone="ok" />
      </Screen>
    ),
  },
];

/* ───────── 7. Plan de contenidos ───────── */

const planSteps: Step[] = [
  { n: "01", title: "Investigamos tus búsquedas", text: "Lo que busca tu cliente, lo que puedes ganar de verdad y lo que ya responde tu competencia." },
  { n: "02", title: "Lo agrupamos en clústeres", text: "Temas que se apoyan entre sí: un artículo pilar y varios satélites enlazados, para ganar autoridad por bloques." },
  { n: "03", title: "Te damos el calendario", text: "Fechas, títulos y su porqué. Lo apruebas, lo cambias o lo dejas en automático." },
];

const planPanels: StepPanel[] = [
  {
    url: "app.yeswecontent.com/plan/investigacion",
    node: (
      <Screen title="Oportunidades" aside="búsquedas/mes · dificultad">
        {[
          ["vajilla de gres", "2,4k", "Baja"],
          ["gres o porcelana", "1,9k", "Media"],
          ["regalo boda original", "8,1k", "Alta"],
          ["platos artesanales", "1,1k", "Baja"],
        ].map(([q, v, d], i) => (
          <Row key={q} k={1 + i} t={5.5} icon={<Search />} title={q} right={<span className="tabular text-[11.5px] text-ink-2">{v} · {d}</span>} />
        ))}
      </Screen>
    ),
  },
  {
    url: "app.yeswecontent.com/plan/clusteres",
    node: (
      <Screen title="Clústeres" aside="3 bloques">
        {[
          ["Compra", "bg-lime-soft", ["Cómo elegir", "Gres o porcelana", "Precio justo"]],
          ["Cuidado", "bg-signal-soft", ["Lavavajillas", "Quitar manchas"]],
          ["Regalo", "bg-sky-soft", ["Bodas", "Navidad", "Amigo invisible"]],
        ].map(([name, c, items], i) => (
          <div key={name as string} className={cn("sx-at rounded-xl border border-line p-3", c as string)} style={at(1 + i * 1.3, 5.5)}>
            <p className="text-[12.5px] font-semibold">{name as string}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {(items as string[]).map((x) => (
                <span key={x} className="rounded-md bg-card px-2 py-0.5 text-[11px] shadow-[var(--shadow-xs)]">
                  {x}
                </span>
              ))}
            </div>
          </div>
        ))}
      </Screen>
    ),
  },
  {
    url: "app.yeswecontent.com/plan",
    node: (
      <Screen title="Noviembre" aside="12 artículos">
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 21 }).map((_, i) => {
            const on = [1, 3, 6, 8, 10, 13, 15, 17, 20].includes(i);
            return (
              <span
                key={i}
                className={cn("sx-at grid aspect-square place-items-center rounded-lg border text-[10.5px] tabular", on ? "border-signal/30 bg-signal-soft font-semibold text-signal" : "border-line bg-card text-ink-3")}
                style={at(1 + i * 0.16, 5)}
              >
                {i + 1}
              </span>
            );
          })}
        </div>
        <Row k={4.4} t={5} icon={<Check />} title="Plan aprobado" sub="En automático: se escribe y publica solo" tone="ok" />
      </Screen>
    ),
  },
];

/* ───────── 8. Agencias ───────── */

const agencySteps: Step[] = [
  { n: "01", title: "Hablamos 15 minutos", text: "Cuántos clientes tienes, qué vendes y si encajamos. Sin presentaciones eternas." },
  { n: "02", title: "Lo ponemos con tu marca", text: "Logo, colores, subdominio y remitente de los emails. Tus clientes ven tu servicio, no el nuestro." },
  { n: "03", title: "Das de alta clientes", text: "Cada web nueva arranca con su plan y su auditoría, y suma al descuento por volumen." },
];

const agencyPanels: StepPanel[] = [
  {
    url: "agenda · llamada de 15 min",
    node: (
      <Screen title="Martes, 10:30" aside="videollamada">
        <Row k={1} t={5} icon={<Users />} title="Estudio Norte · agencia" sub="18 clientes · e-commerce y servicios" />
        <Row k={2} t={5} icon={<MessageSquare />} title="Qué necesitáis" sub="Contenido constante sin contratar redactores" />
        <Row k={3} t={5} icon={<Check />} title="Encaja" sub="Plan de agencia · marca blanca" tone="ok" right={<Done />} />
      </Screen>
    ),
  },
  {
    url: "panel.estudionorte.com/ajustes/marca",
    node: (
      <Screen title="Tu marca" aside="marca blanca">
        <div className="sx-at flex items-center gap-3 rounded-xl border border-line bg-card p-3 shadow-[var(--shadow-xs)]" style={at(1, 5)}>
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#1d4ed8] text-[13px] font-bold text-white">EN</span>
          <span className="text-[14px] font-semibold">Estudio Norte</span>
        </div>
        <div className="sx-at flex items-center gap-2" style={at(2, 5)}>
          <Palette className="h-4 w-4 text-ink-3" aria-hidden />
          {["#1d4ed8", "#0f172a", "#f59e0b"].map((c) => (
            <span key={c} className="h-6 w-6 rounded-full border border-line" style={{ background: c }} />
          ))}
        </div>
        <Row k={3} t={5} icon={<Globe />} title="panel.estudionorte.com" sub="Subdominio propio · SSL activo" />
        <Row k={4} t={5} icon={<Send />} title="informes@estudionorte.com" sub="Remitente de los emails" />
      </Screen>
    ),
  },
  {
    url: "panel.estudionorte.com/clientes",
    node: (
      <Screen title="Clientes" aside="descuento por volumen">
        {[
          ["tierrafina.es", "Activo"],
          ["clinicaazahar.com", "Activo"],
          ["rutasnorte.es", "Configurando"],
        ].map(([w, s], i) => (
          <Row key={w} k={1 + i} t={5} icon={<Globe />} title={w} right={<Badge tone={s === "Activo" ? "ok" : "warn"} dot className="px-2 text-[10px] leading-4">{s}</Badge>} />
        ))}
        <Row k={4} t={5} icon={<PenLine />} title="Descuento por volumen aplicado" sub="Cuantas más webs, menos pagas por cada una" tone="soft" />
      </Screen>
    ),
  },
];

/* ───────── Registro ───────── */

const stories = {
  articulo: [articleSteps, articlePanels],
  publicacion: [publishSteps, publishPanels],
  ia: [aiSteps, aiPanels],
  enlaces: [linkSteps, linkPanels],
  social: [socialSteps, socialPanels],
  auditoria: [auditSteps, auditPanels],
  plan: [planSteps, planPanels],
  agencias: [agencySteps, agencyPanels],
} as const satisfies Record<string, readonly [Step[], StepPanel[]]>;

export type StoryName = keyof typeof stories;

/** Historia que mejor cuenta cada página de producto (las que no tienen, usan sus pasos normales). */
export const storyForProduct: Partial<Record<string, StoryName>> = {
  "redactor-ia": "articulo",
  "agente-seo": "articulo",
  "plan-de-contenidos": "plan",
  autopublicacion: "publicacion",
  shopify: "publicacion",
  "red-de-enlaces": "enlaces",
  "visibilidad-ia": "ia",
  "auditoria-geo": "auditoria",
  social: "social",
};

export function StepStory({ name, className }: { name: StoryName; className?: string }) {
  const [steps, panels] = stories[name];
  return <ScrollSteps steps={steps} panels={panels} className={className} />;
}
