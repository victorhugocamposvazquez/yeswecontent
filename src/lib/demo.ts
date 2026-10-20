/**
 * Datos de ejemplo para el modo demo (sin Supabase).
 * Empresa ficticia: "Tierrafina", tienda online de cerámica artesanal.
 */
import type {
  AdminUserRow,
  AiCheck,
  AiPrompt,
  Article,
  Audit,
  BacklinkLink,
  CaseStudy,
  ContentItem,
  Integration,
  Lead,
  Plan,
  Profile,
  ProductUpdate,
  Site,
  SocialPost,
  Subscription,
  TrafficPoint,
} from "./types";

const day = 86_400_000;
const today = new Date("2026-10-20T09:00:00Z").getTime();
const iso = (offsetDays: number) => new Date(today + offsetDays * day).toISOString();
const date = (offsetDays: number) => iso(offsetDays).slice(0, 10);

export const demoProfile: Profile = {
  id: "u_demo",
  email: "lucia@tierrafina.es",
  full_name: "Lucía Robles",
  role: "admin",
  created_at: iso(-64),
};

export const plans: Plan[] = [
  {
    id: "semilla",
    name: "Semilla",
    monthly_price_eur: 7900,
    yearly_price_eur: 3900,
    articles_per_month: 20,
    tracked_prompts: 10,
    languages: 1,
    seats: 1,
    social_cadence: "weekly",
    backlink_credits: 20,
    features: ["Plan editorial mensual", "Autopublicación en tu CMS", "Auditoría técnica", "Seguimiento en 3 modelos de IA", "Soporte por email"],
    active: true,
    sort: 1,
  },
  {
    id: "cosecha",
    name: "Cosecha",
    monthly_price_eur: 29900,
    yearly_price_eur: 14900,
    articles_per_month: 80,
    tracked_prompts: 40,
    languages: 4,
    seats: null,
    social_cadence: "daily",
    backlink_credits: 60,
    features: ["Todo lo de Semilla", "4 idiomas", "Agentes de Reddit y Quora", "Editora de contenidos asignada", "Soporte prioritario"],
    active: true,
    sort: 2,
  },
];

export const volumeDiscounts = [
  { from: 2, to: 4, pct: 8 },
  { from: 5, to: 9, pct: 14 },
  { from: 10, to: 19, pct: 18 },
  { from: 20, to: null, pct: 25 },
];

export const demoSite: Site = {
  id: "s_tierrafina",
  workspace_id: "w_demo",
  url: "https://tierrafina.es",
  name: "Tierrafina",
  language: "es",
  extra_languages: ["en"],
  niche: "Cerámica artesanal y vajilla hecha a mano",
  audience: "Personas que cuidan su casa y buscan piezas únicas; restaurantes de cocina de autor",
  description: "Taller de cerámica en Talavera que vende vajilla, tazas y jarrones esmaltados a mano.",
  brand_voice: { tone: "Cercano y sereno, con detalle de oficio", person: "nosotros", avoid: ["lujo", "barato"], examples: [] },
  seo_settings: { min_words: 1400, internal_links: 4, faq: true, schema: true },
  visual_style: { style: "Fotografía cálida de producto", palette: "terracota y crema" },
  schedule: { days: ["mon", "wed", "fri"], time: "09:00", mode: "drip" },
  onboarding_step: "done",
  created_at: iso(-64),
};

export const demoSites: Site[] = [
  demoSite,
  { ...demoSite, id: "s_huerto", name: "Huerto Vertical", url: "https://huertovertical.com", niche: "Jardines verticales para interior", onboarding_step: "done" },
];

export const demoSubscription: Subscription = {
  id: "sub_demo",
  site_id: demoSite.id,
  plan_id: "cosecha",
  status: "active",
  interval: "year",
  trial_ends_at: null,
  current_period_end: iso(301),
};

const topics: [string, string, string, number, number][] = [
  ["Cómo elegir una vajilla artesanal que dure años", "vajilla artesanal", "Vajilla", 2400, 28],
  ["Gres vs. porcelana: diferencias reales para el día a día", "gres o porcelana", "Materiales", 1900, 22],
  ["Se puede meter la cerámica hecha a mano en el lavavajillas", "ceramica lavavajillas", "Cuidados", 3600, 18],
  ["Ideas para regalar cerámica en una boda", "regalo boda ceramica", "Regalos", 880, 15],
  ["Qué es el esmalte reactivo y por qué cada pieza es única", "esmalte reactivo", "Oficio", 720, 12],
  ["Guía para montar una mesa de otoño con piezas de barro", "mesa de otoño", "Inspiración", 1300, 20],
  ["Vajilla para restaurantes: qué piden los chefs", "vajilla para restaurantes", "Hostelería", 1600, 34],
  ["Tazas de cerámica: tamaños y formas para cada café", "tazas de ceramica", "Tazas", 5400, 31],
  ["Cómo reparar una pieza con kintsugi en casa", "kintsugi casero", "Cuidados", 2900, 25],
  ["Cerámica de Talavera: historia y cómo reconocerla", "ceramica de talavera", "Oficio", 4400, 30],
  ["Jarrones para flores secas: proporciones que funcionan", "jarron flores secas", "Decoración", 1100, 16],
  ["Platos llanos, hondos y de postre: medidas estándar", "medidas platos", "Vajilla", 2100, 14],
];

const statuses: ContentItem["status"][] = ["published", "published", "published", "published", "scheduled", "scheduled", "review", "writing", "planned", "planned", "planned", "planned"];

export const contentItems: ContentItem[] = topics.map(([title, keyword, cluster, vol, kd], i) => ({
  id: `ci_${i + 1}`,
  site_id: demoSite.id,
  title,
  keyword,
  cluster,
  intent: i % 4 === 0 ? "commercial" : "informational",
  search_volume: vol,
  difficulty: kd,
  language: "es",
  scheduled_for: date(-12 + i * 2),
  status: statuses[i],
  kind: i === 9 ? "refresh" : "new",
}));

const body = (title: string) => `## Lo esencial

${title} es una de las dudas que más nos llegan al taller. Aquí lo contamos sin rodeos, con lo que hemos aprendido en quince años de torno y horno.

## Qué mirar antes de decidir

- **El tipo de barro.** El gres cocido a alta temperatura es más resistente que la loza.
- **El esmalte.** Que sea apto para uso alimentario y esté bien vitrificado.
- **El peso y el borde.** Una pieza bien hecha se siente equilibrada en la mano.

## Cómo lo hacemos en Tierrafina

Cada pieza pasa por dos cocciones y una revisión a mano. Si algo no nos convence, no sale del taller.

## En resumen

Elige por material, uso y mantenimiento. Y si dudas, escríbenos: te ayudamos a acertar.
`;

export const articles: Article[] = contentItems
  .filter((c) => ["published", "scheduled", "review"].includes(c.status))
  .map((c, i) => {
    const status: Article["status"] = c.status === "published" ? "published" : c.status === "scheduled" ? "scheduled" : "review";
    return {
      id: `a_${i + 1}`,
      site_id: demoSite.id,
      content_item_id: c.id,
      title: c.title,
      slug: c.keyword.replace(/\s+/g, "-"),
      meta_description: `${c.title}. Consejos de taller para acertar a la primera.`,
      body_md: body(c.title),
      faq: [
        { q: `¿Merece la pena invertir en ${c.keyword}?`, a: "Si buscas piezas que duren y se disfruten a diario, sí." },
        { q: "¿Hacéis envíos a toda España?", a: "Sí, en 48–72 horas y con embalaje reforzado." },
      ],
      cover_url: null,
      language: "es",
      word_count: 1450 + i * 120,
      quality_score: [92, 88, 95, 84, 90, 79, 86][i] ?? 85,
      quality_breakdown: { estructura: 95, legibilidad: 88, "palabra clave": 90, enlaces: 80, "respuesta directa": 92, schema: 100 },
      status,
      published_url: status === "published" ? `https://tierrafina.es/blog/${c.keyword.replace(/\s+/g, "-")}` : null,
      published_at: status === "published" ? iso(-12 + i * 2) : null,
      created_at: iso(-14 + i * 2),
      updated_at: iso(-13 + i * 2),
    };
  });

export const aiPrompts: AiPrompt[] = [
  "mejor tienda de cerámica artesanal online en España",
  "dónde comprar vajilla hecha a mano",
  "vajilla de gres para restaurante proveedores",
  "regalo de boda original de cerámica",
  "tazas de cerámica artesanal bonitas",
  "cerámica de Talavera comprar online",
].map((prompt, i) => ({ id: `p_${i + 1}`, site_id: demoSite.id, prompt, active: true }));

const models: AiCheck["model"][] = ["chatgpt", "claude", "gemini", "perplexity"];
export const aiChecks: AiCheck[] = aiPrompts.flatMap((p, i) =>
  models.map((model, j) => {
    const mentioned = (i + j) % 3 !== 0;
    return {
      id: `c_${i}_${j}`,
      prompt_id: p.id,
      model,
      mentioned,
      position: mentioned ? ((i + j) % 4) + 1 : null,
      cited_urls: mentioned ? ["https://tierrafina.es/blog/vajilla-artesanal"] : [],
      competitors_mentioned: ["barroyfuego.com", "lalozadecasa.es"].slice(0, ((i + j) % 2) + 1),
      answer_excerpt: mentioned
        ? "…entre los talleres que venden online destaca Tierrafina, con vajilla de gres esmaltada a mano en Talavera…"
        : "…algunas opciones conocidas son Barro y Fuego y La Loza de Casa…",
      checked_at: iso(0),
    };
  }),
);

export const visibilityHistory = Array.from({ length: 12 }, (_, i) => ({
  week: `S${i + 31}`,
  share: Math.round(18 + i * 3.1 + (i % 3) * 2),
}));

export const traffic: TrafficPoint[] = Array.from({ length: 90 }, (_, i) => {
  const base = 80 + i * 2.4;
  const wobble = Math.sin(i / 3) * 14 + ((i * 37) % 11);
  return {
    date: date(-89 + i),
    clicks: Math.round(base + wobble),
    impressions: Math.round((base + wobble) * 31),
    ai_visits: Math.round(4 + i * 0.35 + ((i * 13) % 5)),
  };
});

export const topQueries = [
  { query: "tazas de ceramica artesanal", clicks: 412, impressions: 9800, position: 4.2 },
  { query: "ceramica lavavajillas", clicks: 377, impressions: 12100, position: 3.1 },
  { query: "vajilla artesanal", clicks: 298, impressions: 15400, position: 6.8 },
  { query: "ceramica de talavera", clicks: 214, impressions: 8200, position: 7.4 },
  { query: "kintsugi casero", clicks: 167, impressions: 5100, position: 5.0 },
];

export const aiReferrers = [
  { source: "ChatGPT", visits: 231 },
  { source: "Perplexity", visits: 88 },
  { source: "Gemini", visits: 61 },
  { source: "Claude", visits: 37 },
  { source: "Copilot", visits: 19 },
];

export const demoAudit: Audit = {
  id: "au_1",
  site_id: demoSite.id,
  url: demoSite.url,
  score: 78,
  share_token: "tf-7c21a9",
  created_at: iso(-2),
  results: [
    { id: "https", group: "Rastreo", label: "HTTPS activo", status: "pass", detail: "Todas las páginas cargan con certificado válido." },
    { id: "robots", group: "Rastreo", label: "robots.txt", status: "pass", detail: "Permite el acceso a buscadores y a los rastreadores de IA." },
    { id: "sitemap", group: "Rastreo", label: "Sitemap XML", status: "warn", detail: "El sitemap tiene 14 URLs que devuelven 404." },
    { id: "llms", group: "IA", label: "llms.txt", status: "fail", detail: "No existe. Lo generamos por ti en Ajustes > Publicación." },
    { id: "schema", group: "IA", label: "Datos estructurados", status: "warn", detail: "Falta schema Product en 32 fichas de producto." },
    { id: "answers", group: "IA", label: "Respuestas directas", status: "pass", detail: "El 81% de los artículos responde la pregunta en el primer párrafo." },
    { id: "h1", group: "Contenido", label: "Un H1 por página", status: "pass", detail: "Correcto en todas las páginas analizadas." },
    { id: "meta", group: "Contenido", label: "Meta descripciones", status: "warn", detail: "9 páginas sin meta descripción." },
    { id: "og", group: "Contenido", label: "Open Graph", status: "pass", detail: "Título e imagen definidos." },
    { id: "speed", group: "Rendimiento", label: "Velocidad (LCP)", status: "warn", detail: "LCP de 3,1 s en móvil. Objetivo: menos de 2,5 s." },
    { id: "images", group: "Rendimiento", label: "Imágenes optimizadas", status: "fail", detail: "47 imágenes de más de 400 KB sin formato moderno." },
  ],
};

export const backlinks: BacklinkLink[] = [
  { id: "b1", direction: "received", partner_domain: "casaycampo-blog.es", source_article_url: "https://casaycampo-blog.es/mesas-otono", target_url: "https://tierrafina.es/blog/mesa-de-otono", anchor: "mesa de otoño con piezas de barro", domain_rating: 46, status: "live", created_at: iso(-20) },
  { id: "b2", direction: "received", partner_domain: "cocinadetemporada.com", source_article_url: "https://cocinadetemporada.com/emplatar", target_url: "https://tierrafina.es/vajilla", anchor: "vajilla de gres", domain_rating: 52, status: "live", created_at: iso(-16) },
  { id: "b3", direction: "given", partner_domain: "huertovertical.com", source_article_url: "https://tierrafina.es/blog/jarron-flores-secas", target_url: "https://huertovertical.com/plantas-interior", anchor: "plantas de interior", domain_rating: 31, status: "live", created_at: iso(-14) },
  { id: "b4", direction: "received", partner_domain: "regalosconalma.es", source_article_url: null, target_url: "https://tierrafina.es/blog/regalo-boda-ceramica", anchor: "regalar cerámica en una boda", domain_rating: 38, status: "pending", created_at: iso(-3) },
  { id: "b5", direction: "received", partner_domain: "hosteleriahoy.net", source_article_url: "https://hosteleriahoy.net/proveedores", target_url: "https://tierrafina.es/restaurantes", anchor: "vajilla para restaurantes", domain_rating: 61, status: "live", created_at: iso(-9) },
  { id: "b6", direction: "given", partner_domain: "cafeteriasconencanto.es", source_article_url: "https://tierrafina.es/blog/tazas-de-ceramica", target_url: "https://cafeteriasconencanto.es/guia", anchor: "cafeterías con encanto", domain_rating: 29, status: "pending", created_at: iso(-1) },
];

export const socialPosts: SocialPost[] = [
  { id: "sp1", site_id: demoSite.id, article_id: "a_3", channel: "reddit", kind: "reply", thread_url: "https://reddit.com/r/Spain/comments/ejemplo", content: "Nosotros tenemos piezas de gres que van al lavavajillas sin problema desde hace años. La clave es que el esmalte esté bien vitrificado; si suena 'a cristal' al golpearlo suave, buena señal.", slides: null, status: "suggested", scheduled_for: null, created_at: iso(-1) },
  { id: "sp2", site_id: demoSite.id, article_id: "a_2", channel: "quora", kind: "reply", thread_url: "https://es.quora.com/ejemplo", content: "La porcelana es más fina y translúcida; el gres es más robusto y aguanta mejor los golpes del día a día. Para casa con niños, gres.", slides: null, status: "approved", scheduled_for: iso(1), created_at: iso(-2) },
  { id: "sp3", site_id: demoSite.id, article_id: "a_1", channel: "instagram", kind: "carousel", thread_url: null, content: "5 cosas que mirar antes de comprar vajilla artesanal", slides: ["5 cosas antes de comprar vajilla artesanal", "1. El barro: gres > loza", "2. Esmalte apto alimentario", "3. Peso equilibrado", "4. Bordes sin rebabas", "Guárdalo para tu próxima compra"], status: "scheduled", scheduled_for: iso(2), created_at: iso(-1) },
  { id: "sp4", site_id: demoSite.id, article_id: "a_4", channel: "facebook", kind: "carousel", thread_url: null, content: "Regalos de boda que se usan (de verdad)", slides: ["Regalos de boda que se usan", "Juego de tazas", "Fuente para compartir", "Jarrón de bienvenida"], status: "published", scheduled_for: iso(-3), created_at: iso(-4) },
];

export const integrations: Integration[] = [
  { id: "i1", site_id: demoSite.id, provider: "wordpress", status: "connected", created_at: iso(-60) },
  { id: "i2", site_id: demoSite.id, provider: "gsc", status: "connected", created_at: iso(-60) },
  { id: "i3", site_id: demoSite.id, provider: "ga4", status: "connected", created_at: iso(-58) },
];

export const teamMembers = [
  { email: "lucia@tierrafina.es", name: "Lucía Robles", role: "owner" },
  { email: "marcos@tierrafina.es", name: "Marcos Gil", role: "editor" },
];

export const productUpdates: ProductUpdate[] = [
  { id: "pu1", title: "Carruseles automáticos para Instagram y Facebook", body_md: "Cada artículo nuevo puede convertirse en un carrusel listo para publicar.", tag: "Nuevo", published_at: iso(-5) },
  { id: "pu2", title: "Perplexity entra en el seguimiento de visibilidad", body_md: "Ya medimos tus menciones en cuatro modelos.", tag: "Mejora", published_at: iso(-18) },
  { id: "pu3", title: "Actualización de artículos antiguos", body_md: "Detectamos artículos que pierden posiciones y proponemos una versión renovada.", tag: "Nuevo", published_at: iso(-33) },
];

export const caseStudies: CaseStudy[] = [
  { id: "cs1", slug: "tierrafina", company: "Tierrafina", sector: "E-commerce de cerámica", summary: "De 2.300 a 9.100 clics orgánicos al mes en seis meses, y mencionada por ChatGPT en 4 de cada 6 búsquedas clave.", body_md: "", metric_before: 2300, metric_after: 9100, metric_label: "clics orgánicos/mes", published: true },
  { id: "cs2", slug: "clinica-azahar", company: "Clínica Azahar", sector: "Fisioterapia local", summary: "Primera posición en búsquedas locales de su ciudad y un 60% más de citas desde la web.", body_md: "", metric_before: 140, metric_after: 610, metric_label: "visitas/mes desde Google", published: true },
  { id: "cs3", slug: "rutas-norte", company: "Rutas Norte", sector: "Turismo activo", summary: "Contenido en tres idiomas que multiplicó por cinco las reservas desde Alemania.", body_md: "", metric_before: 380, metric_after: 2050, metric_label: "clics orgánicos/mes", published: true },
  { id: "cs4", slug: "legalclaro", company: "LegalClaro", sector: "Despacho de abogados", summary: "Recomendado por Perplexity y Gemini como despacho de referencia en derecho laboral.", body_md: "", metric_before: 510, metric_after: 3320, metric_label: "clics orgánicos/mes", published: true },
  { id: "cs5", slug: "pedalea", company: "Pedalea", sector: "Tienda de bicicletas", summary: "Integración con su catálogo de Shopify y un 35% de ventas atribuidas a contenido orgánico.", body_md: "", metric_before: 900, metric_after: 4700, metric_label: "clics orgánicos/mes", published: true },
  { id: "cs6", slug: "nido-studio", company: "Nido Studio", sector: "Agencia de marketing", summary: "Gestiona 18 clientes con marca blanca desde un solo panel.", body_md: "", metric_before: 3, metric_after: 18, metric_label: "clientes gestionados", published: false },
];

export const leads: Lead[] = [
  { id: "l1", email: "info@panaderiasol.es", url: "https://panaderiasol.es", tool: "auditoria-ia", created_at: iso(-0.2) },
  { id: "l2", email: null, url: "https://mueblesrivera.com", tool: "robots-txt", created_at: iso(-0.5) },
  { id: "l3", email: "hola@yogaflow.es", url: "https://yogaflow.es", tool: "visibilidad-chatgpt", created_at: iso(-1) },
  { id: "l4", email: null, url: "https://gestoriaplus.es", tool: "meta-descripcion", created_at: iso(-1.3) },
  { id: "l5", email: "marta@vinosdelsur.com", url: "https://vinosdelsur.com", tool: "auditoria-ia", created_at: iso(-2) },
];

export const adminUsers: AdminUserRow[] = [
  { id: "u_demo", email: "lucia@tierrafina.es", full_name: "Lucía Robles", workspace: "Tierrafina", sites: 2, plan_id: "cosecha", status: "active", mrr_eur: 29800, created_at: iso(-64) },
  { id: "u2", email: "pablo@clinicaazahar.es", full_name: "Pablo Medina", workspace: "Clínica Azahar", sites: 1, plan_id: "semilla", status: "active", mrr_eur: 3900, created_at: iso(-120) },
  { id: "u3", email: "ana@rutasnorte.com", full_name: "Ana Etxeberria", workspace: "Rutas Norte", sites: 1, plan_id: "cosecha", status: "active", mrr_eur: 14900, created_at: iso(-95) },
  { id: "u4", email: "javier@legalclaro.es", full_name: "Javier Prieto", workspace: "LegalClaro", sites: 1, plan_id: "semilla", status: "past_due", mrr_eur: 7900, created_at: iso(-40) },
  { id: "u5", email: "irene@nidostudio.es", full_name: "Irene Sanz", workspace: "Nido Studio (agencia)", sites: 18, plan_id: "agencia", status: "active", mrr_eur: 168000, created_at: iso(-210) },
  { id: "u6", email: "dani@pedalea.shop", full_name: "Dani Ortega", workspace: "Pedalea", sites: 1, plan_id: "semilla", status: "trialing", mrr_eur: 0, created_at: iso(-1) },
  { id: "u7", email: "sara@yogaflow.es", full_name: "Sara León", workspace: "YogaFlow", sites: 1, plan_id: "semilla", status: "canceled", mrr_eur: 0, created_at: iso(-150) },
];

export const mrrHistory = Array.from({ length: 12 }, (_, i) => ({
  month: new Intl.DateTimeFormat("es-ES", { month: "short" }).format(new Date(2025, 10 + i, 1)),
  mrr: Math.round(1200 + i * 190 + (i % 4) * 60),
}));

export const generationQueue = [
  { id: "q1", site: "Tierrafina", title: "Tazas de cerámica: tamaños y formas para cada café", stage: "writing", started_at: iso(-0.02) },
  { id: "q2", site: "Rutas Norte", title: "Wanderrouten in Kantabrien für Familien", stage: "images", started_at: iso(-0.04) },
  { id: "q3", site: "Clínica Azahar", title: "Dolor de espalda al teletrabajar: 6 ejercicios", stage: "publishing", started_at: iso(-0.05) },
  { id: "q4", site: "LegalClaro", title: "Despido disciplinario: plazos y cómo reclamar", stage: "failed", started_at: iso(-0.3) },
];
