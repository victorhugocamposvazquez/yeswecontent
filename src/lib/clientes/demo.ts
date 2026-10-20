/**
 * Datos de ejemplo del portal de clientes (modo demo, sin Supabase).
 * Agencia ficticia: "Nido Studio", que revende yeswecontent a tres clientes.
 */
import type { AiCheck, AiModel, Article, ContentItem, Site, TrafficPoint } from "@/lib/types";
import type { Agency, AgencyClient, ClientInvoice, ClientMember, ClientMessage, ClientSiteSettings } from "./types";

const DAY = 86_400_000;
const TODAY = new Date("2026-10-20T09:00:00Z").getTime();
const iso = (d: number) => new Date(TODAY + d * DAY).toISOString();
const date = (d: number) => iso(d).slice(0, 10);

export const demoAgency: Agency = {
  id: "w_nido",
  name: "Nido Studio",
  white_label: {
    brand_name: "Nido Studio",
    primary_color: "#2f5bea",
    logo_url: "",
    custom_domain: "clientes.nidostudio.es",
    support_email: "hola@nidostudio.es",
  },
};

export const demoAgencyUser = { id: "u_nido", name: "Marta Ibáñez", email: "marta@nidostudio.es" };

interface Seed {
  site: Site;
  client: AgencyClient;
  topics: [string, string, number][];
  base: number;
  shareBias: number;
  contact: { name: string; email: string };
}

const site = (id: string, name: string, url: string, niche: string): Site => ({
  id,
  workspace_id: demoAgency.id,
  url,
  name,
  language: "es",
  extra_languages: [],
  niche,
  audience: null,
  description: null,
  brand_voice: { tone: "cercano", person: "tú" },
  seo_settings: { min_words: 1200, faq: true, schema: true },
  visual_style: {},
  schedule: { days: ["mon", "thu"], time: "09:00", mode: "drip" },
  onboarding_step: "done",
  created_at: iso(-160),
});

const SEEDS: Seed[] = [
  {
    site: site("s_arboleda", "Clínica Dental Arboleda", "https://clinicaarboleda.es", "Odontología"),
    client: {
      site_id: "s_arboleda",
      agency_workspace_id: demoAgency.id,
      client_name: "Clínica Dental Arboleda",
      client_email: "direccion@clinicaarboleda.es",
      visibility_mode: "completo",
      price_cents: 69000,
      currency: "EUR",
      booking_url: "https://cal.com/nidostudio/seguimiento",
      created_at: iso(-160),
    },
    topics: [
      ["Ortodoncia invisible en adultos: plazos reales y precio orientativo", "ortodoncia invisible adultos", 6600],
      ["Implante dental o puente: cómo decidir según tu caso", "implante o puente dental", 2900],
      ["Sangrado de encías al cepillarte: causas y cuándo preocuparte", "sangrado encias", 12100],
      ["Blanqueamiento dental en clínica frente a kits caseros", "blanqueamiento dental", 18100],
      ["Primera visita al dentista de tu hijo: a qué edad y qué esperar", "primera visita dentista niños", 1900],
      ["Bruxismo: señales de que aprietas los dientes por la noche", "bruxismo sintomas", 8100],
      ["Carillas de composite o porcelana: diferencias que importan", "carillas composite porcelana", 3600],
      ["Qué hacer si se te rompe un diente en fin de semana", "diente roto urgencia", 2400],
      ["Higiene dental con aparatos: rutina en cinco minutos", "limpieza con brackets", 1300],
      ["Periodoncia: tratamientos y cuánto dura la recuperación", "tratamiento periodontitis", 4400],
    ],
    base: 140,
    shareBias: 0,
    contact: { name: "Elena Arboleda", email: "direccion@clinicaarboleda.es" },
  },
  {
    site: site("s_candela", "Horno Candela", "https://hornocandela.es", "Panadería artesana"),
    client: {
      site_id: "s_candela",
      agency_workspace_id: demoAgency.id,
      client_name: "Horno Candela",
      client_email: "pedidos@hornocandela.es",
      visibility_mode: "resultados",
      price_cents: 45000,
      currency: "EUR",
      booking_url: "https://cal.com/nidostudio/seguimiento",
      created_at: iso(-95),
    },
    topics: [
      ["Pan de masa madre: por qué sienta mejor y cómo conservarlo", "pan masa madre", 9900],
      ["Roscón de Reyes artesano: cuándo encargarlo y qué lo hace bueno", "roscon de reyes artesano", 5400],
      ["Harinas antiguas: espelta, centeno y trigo sarraceno", "harinas antiguas", 1600],
      ["Cómo congelar pan sin que pierda textura", "congelar pan", 4400],
      ["Panes sin gluten de obrador: lo que debes saber", "pan sin gluten artesano", 3600],
      ["Cruasán de mantequilla: cómo reconocer uno de verdad", "cruasan mantequilla", 2900],
      ["Catering de desayunos para oficinas en Madrid", "catering desayuno oficina madrid", 880],
      ["Fermentación lenta: el secreto de un pan con sabor", "fermentacion lenta pan", 1000],
    ],
    base: 70,
    shareBias: 1,
    contact: { name: "Iván Candela", email: "pedidos@hornocandela.es" },
  },
  {
    site: site("s_iriarte", "Iriarte Abogados", "https://iriarteabogados.es", "Despacho laboralista"),
    client: {
      site_id: "s_iriarte",
      agency_workspace_id: demoAgency.id,
      client_name: "Iriarte Abogados",
      client_email: "socios@iriarteabogados.es",
      visibility_mode: "resultados",
      price_cents: 89000,
      currency: "EUR",
      booking_url: null,
      created_at: iso(-40),
    },
    topics: [
      ["Despido improcedente: plazos para reclamar y cálculo de la indemnización", "despido improcedente indemnizacion", 22200],
      ["Finiquito: conceptos que debe incluir y cómo revisarlo", "que incluye el finiquito", 14800],
      ["Baja por ansiedad: derechos del trabajador y del empresario", "baja por ansiedad derechos", 6600],
      ["Modificación sustancial de condiciones: cuándo puedes negarte", "modificacion sustancial condiciones", 2900],
      ["Teletrabajo y gastos: qué debe pagar la empresa", "gastos teletrabajo empresa", 1900],
      ["ERTE: qué cobras y cómo afecta a tus vacaciones", "erte que cobro", 8100],
      ["Acoso laboral: cómo documentarlo antes de denunciar", "acoso laboral denunciar", 5400],
    ],
    base: 55,
    shareBias: 2,
    contact: { name: "Begoña Iriarte", email: "socios@iriarteabogados.es" },
  },
];

export const demoClients: AgencyClient[] = SEEDS.map((s) => s.client);
export const demoClientSites: Site[] = SEEDS.map((s) => s.site);
const seed = (siteId: string) => SEEDS.find((s) => s.site.id === siteId) ?? SEEDS[0];

const STATUSES: ContentItem["status"][] = ["published", "published", "published", "published", "published", "scheduled", "review", "writing", "planned", "planned"];

export function demoContentItems(siteId: string): ContentItem[] {
  const s = seed(siteId);
  return s.topics.map(([title, keyword, vol], i) => ({
    id: `${siteId}_ci_${i + 1}`,
    site_id: siteId,
    title,
    keyword,
    cluster: null,
    intent: i % 3 === 0 ? "commercial" : "informational",
    search_volume: vol,
    difficulty: 18 + ((i * 7) % 30),
    language: "es",
    scheduled_for: date(-16 + i * 3),
    status: STATUSES[i] ?? "planned",
    kind: "new",
  }));
}

const body = (title: string, brand: string) => `## La respuesta corta

${title}: te lo explicamos con lo que vemos cada semana en ${brand}, sin tecnicismos y con ejemplos reales.

## Lo que conviene tener en cuenta

- **Tu situación concreta.** No hay dos casos iguales: el contexto cambia la decisión.
- **Los plazos.** Muchas dudas se resuelven antes si actúas pronto.
- **A quién preguntar.** Un profesional te ahorra errores caros.

## Cómo lo trabajamos

Escuchamos, revisamos tu caso y te proponemos un plan claro, con precios cerrados desde el principio.

## En pocas palabras

Infórmate, compara y, si tienes dudas, escríbenos: te orientamos sin compromiso.
`;

export function demoClientArticles(siteId: string): Article[] {
  const s = seed(siteId);
  const host = s.site.url.replace(/^https?:\/\//, "");
  return demoContentItems(siteId)
    .filter((c) => ["published", "scheduled", "review"].includes(c.status))
    .map((c, i) => {
      const status: Article["status"] = c.status === "published" ? "published" : c.status === "scheduled" ? "scheduled" : "review";
      const slug = c.keyword.replace(/\s+/g, "-");
      return {
        id: `${siteId}_a_${i + 1}`,
        site_id: siteId,
        content_item_id: c.id,
        title: c.title,
        slug,
        meta_description: `${c.title}. Guía clara para decidir con criterio.`,
        body_md: body(c.title, s.site.name),
        faq: [{ q: `¿Cuánto tarda en notarse ${c.keyword}?`, a: "Depende de cada caso; te lo explicamos en una primera consulta." }],
        cover_url: null,
        language: "es",
        word_count: 1320 + i * 140,
        quality_score: [91, 87, 94, 86, 89, 83, 90][i] ?? 85,
        quality_breakdown: null,
        status,
        published_url: status === "published" ? `https://${host}/blog/${slug}` : null,
        published_at: status === "published" ? iso(-16 + i * 3) : null,
        created_at: iso(-18 + i * 3),
        updated_at: iso(-17 + i * 3),
      };
    });
}

export function demoClientTraffic(siteId: string): TrafficPoint[] {
  const s = seed(siteId);
  return Array.from({ length: 90 }, (_, i) => {
    const base = s.base + i * (s.base / 60);
    const wobble = Math.sin(i / 3) * (s.base / 9) + ((i * 37) % 11);
    return {
      date: date(-89 + i),
      clicks: Math.round(base + wobble),
      impressions: Math.round((base + wobble) * 28),
      ai_visits: Math.round(s.base / 30 + i * 0.2 + ((i * 13) % 5)),
    };
  });
}

const MODELS: AiModel[] = ["chatgpt", "claude", "gemini", "perplexity"];
export function demoClientChecks(siteId: string): AiCheck[] {
  const s = seed(siteId);
  return Array.from({ length: 6 }).flatMap((_, i) =>
    MODELS.map((model, j) => {
      const mentioned = (i + j + s.shareBias) % 3 !== 0;
      return {
        id: `${siteId}_c_${i}_${j}`,
        prompt_id: `${siteId}_p_${i}`,
        model,
        mentioned,
        position: mentioned ? ((i + j) % 4) + 1 : null,
        cited_urls: [],
        competitors_mentioned: [],
        answer_excerpt: null,
        checked_at: iso(-1),
      };
    }),
  );
}

export const demoInvoices: ClientInvoice[] = SEEDS.flatMap((s, k) =>
  [0, 1, 2, 3].map((m) => {
    const issued = new Date(Date.UTC(2026, 9 - m, 1));
    const status: ClientInvoice["status"] = m === 0 ? (k === 1 ? "sent" : k === 2 ? "draft" : "paid") : "paid";
    return {
      id: `${s.site.id}_inv_${m}`,
      workspace_id: demoAgency.id,
      site_id: s.site.id,
      number: `NIDO-2026-${String(40 + k * 4 + (3 - m)).padStart(4, "0")}`,
      concept: `Contenidos y posicionamiento · ${new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(issued)}`,
      amount_cents: s.client.price_cents,
      currency: "EUR",
      status,
      issued_at: issued.toISOString().slice(0, 10),
      due_at: new Date(issued.getTime() + 15 * DAY).toISOString().slice(0, 10),
      pdf_url: null,
    };
  }),
).filter((inv) => !(inv.site_id === "s_iriarte" && inv.issued_at < "2026-09-01"));

export const demoMessages: ClientMessage[] = SEEDS.flatMap((s) => [
  {
    id: `${s.site.id}_m1`,
    site_id: s.site.id,
    author_name: "Marta Ibáñez",
    author_side: "agency" as const,
    body: `¡Hola! Ya tienes el plan de noviembre preparado. Hemos priorizado los temas con más búsquedas en tu zona. Si quieres cambiar algo, dímelo por aquí.`,
    created_at: iso(-6),
  },
  {
    id: `${s.site.id}_m2`,
    site_id: s.site.id,
    author_name: s.contact.name,
    author_side: "client" as const,
    body: "Genial, gracias. ¿Podemos meter algo sobre las promociones de diciembre?",
    created_at: iso(-5),
  },
  {
    id: `${s.site.id}_m3`,
    site_id: s.site.id,
    author_name: "Marta Ibáñez",
    author_side: "agency" as const,
    body: "Hecho: lo añadimos para la primera semana de diciembre. Te avisamos cuando esté publicado.",
    created_at: iso(-5),
  },
]);

export const demoMembers: ClientMember[] = SEEDS.flatMap((s, k) => [
  { id: `${s.site.id}_u1`, site_id: s.site.id, email: s.contact.email, full_name: s.contact.name, role: "admin" as const, status: "active" as const, invited_at: s.client.created_at },
  ...(k === 0
    ? [{ id: `${s.site.id}_u2`, site_id: s.site.id, email: "recepcion@clinicaarboleda.es", full_name: "Sara Núñez", role: "member" as const, status: "invited" as const, invited_at: iso(-2) }]
    : []),
]);

export function demoSiteSettings(siteId: string): ClientSiteSettings {
  if (siteId === "s_arboleda")
    return {
      site_id: siteId,
      brand: {
        logo_url: "",
        colors: ["#0f766e", "#f0fdfa", "#134e4a"],
        fonts: "Titulares en serif, texto en sans",
        guidelines: "Tono cercano y tranquilizador. Evita palabras que den miedo (dolor, aguja). Habla de la salud bucal como cuidado diario.",
        do: ["Explicar el porqué de cada tratamiento", "Mencionar la financiación sin intereses"],
        dont: ["Prometer resultados garantizados", "Comparar con otras clínicas por su nombre"],
      },
      custom_domain: "blog.clinicaarboleda.es",
      domain_verified_at: iso(-30),
    };
  return { site_id: siteId, brand: {}, custom_domain: null, domain_verified_at: null };
}

export const demoContact = (siteId: string) => seed(siteId).contact;
