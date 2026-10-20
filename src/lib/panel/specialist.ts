/**
 * Especialista SEO/GEO: contexto del sitio, prompt de sistema, herramientas
 * (propuestas que el usuario confirma) y respuestas de ejemplo sin clave de API.
 */
import "server-only";
import { randomUUID } from "node:crypto";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getLatestAudit, getSubscription, getVisibility, listArticles, listContentItems, listPlans } from "@/lib/data";
import { getAnalytics, listCompetitors } from "@/lib/panel/data";
import { MODEL_LABEL, competitorCounts, latestByPromptModel, overallShare, shareByModel } from "@/lib/panel/visibility";
import type { AiModel, Audit, ContentItem, Site } from "@/lib/types";
import { fmtDate, num } from "@/lib/utils";
import type { Proposal, ProposalKind } from "./specialist-types";

const MODELS: AiModel[] = ["chatgpt", "claude", "gemini", "perplexity"];
const domainOf = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
};
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/* ───────── contexto ───────── */

export interface SpecialistContext {
  site: Site;
  plan: { id: string | null; name: string | null; trackedLimit: number };
  hasDedicatedSpecialist: boolean;
  audit: Audit | null;
  analytics: {
    connected: boolean;
    last7: number;
    prev7: number;
    deltaPct: number;
    aiLast7: number;
    aiPrev7: number;
    topQueries: { query: string; clicks: number; impressions: number; position: number }[];
    aiReferrers: { source: string; visits: number }[];
  };
  visibility: {
    overall: number;
    byModel: { model: AiModel; label: string; share: number; hits: number; total: number }[];
    competitors: { label: string; value: number }[];
    prompts: { prompt: string; active: boolean; results: Partial<Record<AiModel, { mentioned: boolean; position: number | null; competitors: string[] }>> }[];
  };
  content: {
    counts: Record<string, number>;
    upcoming: ContentItem[];
    titles: string[];
  };
  articles: { title: string; keyword: string | null; score: number | null; status: string; words: number; url: string | null; published: string | null }[];
  competitors: { name: string; domain: string }[];
}

export async function getSpecialistContext(site: Site): Promise<SpecialistContext> {
  const [sub, plans, audit, vis, items, arts, analytics, comps] = await Promise.all([
    getSubscription(site.id),
    listPlans(),
    getLatestAudit(site.id),
    getVisibility(site.id),
    listContentItems(site.id),
    listArticles(site.id),
    getAnalytics(),
    listCompetitors(site.id),
  ]);
  const plan = plans.find((p) => p.id === sub?.plan_id) ?? null;
  const active = sub && sub.status !== "canceled";

  const tr = analytics.traffic;
  const sum = (from: number, to: number, k: "clicks" | "ai_visits") => tr.slice(from, to).reduce((a, p) => a + p[k], 0);
  const last7 = sum(-7, tr.length, "clicks");
  const prev7 = sum(-14, -7, "clicks");
  const aiLast7 = sum(-7, tr.length, "ai_visits");
  const aiPrev7 = sum(-14, -7, "ai_visits");

  const latest = latestByPromptModel(vis.checks);
  const itemById = new Map(items.map((c) => [c.id, c]));

  const counts: Record<string, number> = {};
  items.forEach((c) => (counts[c.status] = (counts[c.status] ?? 0) + 1));

  return {
    site,
    plan: { id: plan?.id ?? null, name: active ? (plan?.name ?? null) : null, trackedLimit: plan?.tracked_prompts ?? 10 },
    hasDedicatedSpecialist: !!active && plan?.id === "cosecha",
    audit,
    analytics: {
      connected: analytics.connected,
      last7,
      prev7,
      deltaPct: prev7 ? Math.round(((last7 - prev7) / prev7) * 100) : 0,
      aiLast7,
      aiPrev7,
      topQueries: analytics.topQueries,
      aiReferrers: analytics.aiReferrers,
    },
    visibility: {
      overall: overallShare(vis.checks),
      byModel: shareByModel(vis.checks),
      competitors: competitorCounts(vis.checks),
      prompts: vis.prompts.map((p) => ({
        prompt: p.prompt,
        active: p.active,
        results: Object.fromEntries(
          MODELS.flatMap((m) => {
            const c = latest.get(`${p.id}:${m}`);
            return c ? [[m, { mentioned: c.mentioned, position: c.position, competitors: c.competitors_mentioned }]] : [];
          }),
        ),
      })),
    },
    content: {
      counts,
      upcoming: items.filter((c) => ["planned", "writing", "review", "scheduled"].includes(c.status)).slice(0, 8),
      titles: items.map((c) => c.title),
    },
    articles: arts.slice(0, 10).map((a) => ({
      title: a.title,
      keyword: (a.content_item_id && itemById.get(a.content_item_id)?.keyword) || null,
      score: a.quality_score,
      status: a.status,
      words: a.word_count,
      url: a.published_url,
      published: a.published_at,
    })),
    competitors: comps.map((c) => ({ name: c.name ?? domainOf(c.url), domain: domainOf(c.url) })),
  };
}

/* ───────── prompt de sistema ───────── */

const STATUS_LABEL: Record<string, string> = { planned: "planificados", writing: "en redacción", review: "en revisión", scheduled: "programados", published: "publicados", skipped: "descartados" };

export function buildSystemPrompt(ctx: SpecialistContext): string {
  const { site, audit, analytics: a, visibility: v } = ctx;
  const voice = site.brand_voice ?? {};
  const lines: string[] = [];

  lines.push(
    `Eres el Especialista SEO de yeswecontent: un consultor sénior de SEO y GEO (optimización para respuestas de IA como ChatGPT, Claude, Gemini y Perplexity) que trabaja para ${site.name} (${site.url}).`,
    "",
    "Cómo respondes:",
    "- En español de España, tuteando, con tono cercano y directo. Nada de relleno ni frases de manual.",
    "- Basa cada diagnóstico en los datos del sitio que tienes abajo y cita las cifras concretas. Si un dato no está, dilo y explica cómo conseguirlo; nunca inventes cifras, posiciones ni volúmenes.",
    "- Estructura: una respuesta directa en 1–2 frases, luego el porqué y los pasos priorizados. Usa Markdown sencillo (##, listas, **negrita**). Sin tablas.",
    "- Respuestas de 120–350 palabras salvo que te pidan más detalle.",
    "- Cuando recomiendes una acción concreta que el panel puede ejecutar, usa la herramienta correspondiente (como máximo 3 propuestas por respuesta):",
    "  · propose_content_topic: añadir un tema nuevo o una actualización al plan de contenidos.",
    "  · propose_tracked_prompt: empezar a seguir una pregunta en los modelos de IA.",
    "  · propose_audit_fix: abrir una tarea para corregir un punto de la auditoría.",
    "- Las herramientas solo crean propuestas: el usuario las confirma o descarta en el panel. Menciona en el texto que te dejas la propuesta preparada; nunca digas que ya está hecho.",
    "- No propongas temas que ya estén en el plan ni preguntas que ya se sigan.",
    "",
    "## El negocio",
    `- Nombre: ${site.name} · Web: ${site.url} · Idioma principal: ${site.language}${site.extra_languages?.length ? ` (también ${site.extra_languages.join(", ")})` : ""}`,
    `- Nicho: ${site.niche ?? "—"}`,
    `- Público: ${site.audience ?? "—"}`,
    `- Descripción: ${site.description ?? "—"}`,
    `- Voz de marca: tono «${voice.tone ?? "—"}», escribe en «${voice.person ?? "—"}»${voice.avoid?.length ? `, nunca usa: ${voice.avoid.join(", ")}` : ""}.`,
    `- Plan contratado: ${ctx.plan.name ?? "sin plan activo"} (hasta ${ctx.plan.trackedLimit} preguntas seguidas en IA).`,
    `- Competidores declarados: ${ctx.competitors.map((c) => `${c.name} (${c.domain})`).join(", ") || "ninguno"}.`,
    "",
  );

  lines.push("## Auditoría técnica");
  if (audit) {
    lines.push(`Última auditoría el ${fmtDate(audit.created_at, { day: "numeric", month: "long" })}: ${audit.score ?? "—"}/100.`);
    audit.results.forEach((r) => lines.push(`- [${r.status === "pass" ? "OK" : r.status === "warn" ? "AVISO" : "FALLO"}] (${r.id}) ${r.group} · ${r.label}: ${r.detail}`));
  } else lines.push("Aún no hay auditoría.");
  lines.push("");

  lines.push("## Búsqueda orgánica (Search Console)");
  if (a.connected) {
    lines.push(
      `- Clics últimos 7 días: ${num(a.last7)} · 7 días anteriores: ${num(a.prev7)} (${a.deltaPct >= 0 ? "+" : ""}${a.deltaPct}%).`,
      `- Visitas desde asistentes de IA últimos 7 días: ${num(a.aiLast7)} · anteriores: ${num(a.aiPrev7)}.`,
      "- Consultas principales (28 días):",
      ...a.topQueries.map((q) => `  · «${q.query}»: ${num(q.clicks)} clics, ${num(q.impressions)} impresiones, posición media ${q.position.toLocaleString("es-ES")}`),
      `- Referencias desde IA (28 días): ${a.aiReferrers.map((r) => `${r.source} ${r.visits}`).join(", ") || "—"}.`,
    );
  } else lines.push("Search Console y GA4 no están conectados: no tienes datos de tráfico. Si te preguntan por tráfico, explícalo y sugiere conectarlos en Ajustes › Integraciones.");
  lines.push("");

  lines.push("## Visibilidad en IA (última revisión)");
  lines.push(`- Cuota de voz global: ${v.overall}% de respuestas mencionan a ${site.name}.`);
  lines.push(`- Por modelo: ${v.byModel.map((m) => `${m.label} ${m.share}% (${m.hits}/${m.total})`).join(", ")}.`);
  lines.push(`- Competidores más citados: ${v.competitors.map((c) => `${c.label} (${c.value})`).join(", ") || "—"}.`);
  lines.push("- Preguntas seguidas:");
  v.prompts.forEach((p) => {
    const res = MODELS.filter((m) => p.results[m])
      .map((m) => {
        const r = p.results[m]!;
        return `${MODEL_LABEL[m]}: ${r.mentioned ? `sí (#${r.position ?? "?"})` : "no"}`;
      })
      .join("; ");
    lines.push(`  · «${p.prompt}»${p.active ? "" : " (en pausa)"} → ${res || "sin datos"}`);
  });
  lines.push("");

  lines.push("## Plan de contenidos");
  lines.push(
    `- Estado: ${Object.entries(ctx.content.counts)
      .map(([k, n]) => `${n} ${STATUS_LABEL[k] ?? k}`)
      .join(", ") || "vacío"}.`,
  );
  lines.push("- Próximos temas:");
  ctx.content.upcoming.forEach((c) => lines.push(`  · ${c.title} («${c.keyword}», ${c.kind === "refresh" ? "actualización" : "nuevo"}, ${STATUS_LABEL[c.status] ?? c.status}${c.scheduled_for ? `, ${c.scheduled_for}` : ""})`));
  lines.push(`- Todos los títulos del plan (para no repetir): ${ctx.content.titles.join(" | ") || "—"}`);
  lines.push("");

  lines.push("## Artículos recientes");
  ctx.articles.forEach((ar) =>
    lines.push(`- ${ar.title} · ${ar.status}${ar.published ? ` el ${ar.published.slice(0, 10)}` : ""} · ${num(ar.words)} palabras · puntuación ${ar.score ?? "—"}/100${ar.keyword ? ` · palabra clave «${ar.keyword}»` : ""}${ar.url ? ` · ${ar.url}` : ""}`),
  );
  if (!ctx.articles.length) lines.push("- Aún no hay artículos.");
  lines.push("", `Fecha de hoy: ${new Date().toISOString().slice(0, 10)}.`);

  return lines.join("\n");
}

/* ───────── herramientas ───────── */

export function specialistTools(ctx: SpecialistContext): Anthropic.Tool[] {
  const checkIds = ctx.audit?.results.map((r) => r.id) ?? [];
  return [
    {
      name: "propose_content_topic",
      description:
        "Propone añadir un tema al plan de contenidos del sitio (artículo nuevo o actualización de uno existente). Úsala cuando recomiendes escribir o renovar un contenido concreto. El usuario decide si lo añade.",
      input_schema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título de trabajo del artículo, en el idioma del sitio." },
          keyword: { type: "string", description: "Palabra clave principal, en minúsculas." },
          cluster: { type: "string", description: "Clúster temático al que pertenece." },
          intent: { type: "string", enum: ["informational", "commercial", "transactional", "navigational"] },
          kind: { type: "string", enum: ["new", "refresh"], description: "new = artículo nuevo; refresh = actualizar uno publicado." },
          reason: { type: "string", description: "Por qué merece la pena, en una frase y con el dato que lo justifica." },
        },
        required: ["title", "keyword", "kind", "reason"],
      },
    },
    {
      name: "propose_tracked_prompt",
      description:
        "Propone empezar a seguir una pregunta en ChatGPT, Claude, Gemini y Perplexity para medir si recomiendan al sitio. Úsala con preguntas reales que haría un cliente.",
      input_schema: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "La pregunta tal y como la escribiría un cliente." },
          reason: { type: "string", description: "Qué aprenderemos al seguirla, en una frase." },
        },
        required: ["prompt", "reason"],
      },
    },
    {
      name: "propose_audit_fix",
      description: "Propone abrir una tarea para corregir un punto concreto de la auditoría técnica, con los pasos para hacerlo.",
      input_schema: {
        type: "object",
        properties: {
          check_id: checkIds.length ? { type: "string", enum: checkIds, description: "Identificador de la comprobación de la auditoría." } : { type: "string" },
          title: { type: "string", description: "Título corto de la tarea." },
          steps: { type: "array", items: { type: "string" }, description: "De 2 a 5 pasos concretos." },
          priority: { type: "string", enum: ["alta", "media", "baja"] },
          reason: { type: "string", description: "Impacto esperado, en una frase." },
        },
        required: ["check_id", "title", "steps", "priority", "reason"],
      },
    },
  ];
}

const toolSchemas = {
  propose_content_topic: z.object({
    title: z.string().min(3).max(200),
    keyword: z.string().min(2).max(120),
    cluster: z.string().max(80).nullish(),
    intent: z.enum(["informational", "commercial", "transactional", "navigational"]).nullish(),
    kind: z.enum(["new", "refresh"]).default("new"),
    reason: z.string().max(400).default(""),
  }),
  propose_tracked_prompt: z.object({ prompt: z.string().min(5).max(300), reason: z.string().max(400).default("") }),
  propose_audit_fix: z.object({
    check_id: z.string().min(1).max(60),
    title: z.string().min(3).max(200),
    steps: z.array(z.string().max(400)).min(1).max(8),
    priority: z.enum(["alta", "media", "baja"]).default("media"),
    reason: z.string().max(400).default(""),
  }),
};

const KIND_BY_TOOL: Record<keyof typeof toolSchemas, ProposalKind> = {
  propose_content_topic: "content_topic",
  propose_tracked_prompt: "tracked_prompt",
  propose_audit_fix: "audit_fix",
};

/** Convierte una llamada a herramienta en una propuesta validada (o null si no es válida). */
export function toolUseToProposal(name: string, input: unknown): Proposal | null {
  if (!(name in toolSchemas)) return null;
  const key = name as keyof typeof toolSchemas;
  const parsed = toolSchemas[key].safeParse(input);
  if (!parsed.success) return null;
  return { id: randomUUID(), kind: KIND_BY_TOOL[key], status: "pending", data: parsed.data } as Proposal;
}

/** Esquema para validar propuestas que vuelven del cliente (al aplicar). */
export const proposalSchema = z.discriminatedUnion("kind", [
  z.object({ id: z.string(), kind: z.literal("content_topic"), status: z.string(), data: toolSchemas.propose_content_topic }),
  z.object({ id: z.string(), kind: z.literal("tracked_prompt"), status: z.string(), data: toolSchemas.propose_tracked_prompt }),
  z.object({ id: z.string(), kind: z.literal("audit_fix"), status: z.string(), data: toolSchemas.propose_audit_fix }),
]);

/* ───────── preguntas sugeridas ───────── */

export function starterQuestions(ctx: SpecialistContext): string[] {
  const out: string[] = [];
  const a = ctx.analytics;
  if (a.connected) out.push(a.last7 < a.prev7 ? "¿Por qué ha bajado el tráfico esta semana?" : "¿Qué ha hecho subir el tráfico esta semana?");
  else out.push("¿Qué datos necesito conectar para entender mi tráfico?");

  if (ctx.articles.some((x) => x.status === "published")) out.push("¿Qué artículo debería actualizar primero?");

  const gap = findVisibilityGap(ctx);
  if (gap) out.push(`¿Cómo consigo que ${MODEL_LABEL[gap.model]} me recomiende para «${gap.prompt}»?`);
  else out.push("¿Cómo consigo que ChatGPT me recomiende?");

  const fails = ctx.audit?.results.filter((r) => r.status === "fail") ?? [];
  if (fails.length) out.push("¿Qué arreglo primero de la auditoría?");
  out.push("¿Qué temas añadirías al plan del mes que viene?");
  return out.slice(0, 5);
}

function findVisibilityGap(ctx: SpecialistContext) {
  const order = [...ctx.visibility.byModel].sort((x, y) => (y.model === "chatgpt" ? 1 : 0) - (x.model === "chatgpt" ? 1 : 0) || x.share - y.share);
  for (const m of order) {
    const p = ctx.visibility.prompts.find((pr) => pr.active && pr.results[m.model] && !pr.results[m.model]!.mentioned);
    if (p) return { model: m.model, prompt: p.prompt, competitors: p.results[m.model]!.competitors };
  }
  return null;
}

/* ───────── respuestas de ejemplo (sin ANTHROPIC_API_KEY) ───────── */

type DemoProposal = { kind: "content_topic"; data: Proposal["data"] } | { kind: "tracked_prompt"; data: Proposal["data"] } | { kind: "audit_fix"; data: Proposal["data"] };

export function demoAnswer(ctx: SpecialistContext, question: string): { text: string; proposals: Proposal[] } {
  const q = norm(question);
  let res: { text: string; proposals: DemoProposal[] };
  if (/trafico|visitas|clics|bajad|subid|caid/.test(q)) res = demoTraffic(ctx);
  else if (/actualiz|renov|refresc|articulo/.test(q)) res = demoRefresh(ctx);
  else if (/chatgpt|perplexity|gemini|claude|recomiend|\bia\b|geo|llm|cuota/.test(q)) res = demoGeo(ctx);
  else if (/auditor|arregl|tecnic|velocidad|schema|llms|sitemap|imagen/.test(q)) res = demoAudit(ctx);
  else if (/plan|tema|escrib|idea|mes que viene|contenido/.test(q)) res = demoPlan(ctx);
  else res = demoOverview(ctx);
  return { text: res.text, proposals: res.proposals.map((p) => ({ ...p, id: randomUUID(), status: "pending" }) as Proposal) };
}

function demoTraffic(ctx: SpecialistContext) {
  const a = ctx.analytics;
  if (!a.connected)
    return {
      text: `Ahora mismo no puedo verlo: **Search Console y GA4 no están conectados**, así que no tengo clics ni visitas de ${ctx.site.name}.\n\nConéctalos en **Ajustes › Integraciones** (tarda dos minutos) y en cuanto entren los datos te digo qué páginas y consultas se han movido.`,
      proposals: [],
    };
  const down = a.last7 < a.prev7;
  const q = [...a.topQueries].sort((x, y) => y.impressions - x.impressions);
  const lowCtr = q.find((x) => x.position > 5) ?? q[0];
  const speed = ctx.audit?.results.find((r) => r.id === "speed" && r.status !== "pass");
  const sitemap = ctx.audit?.results.find((r) => r.id === "sitemap" && r.status !== "pass");
  const text = down
    ? `Has pasado de **${num(a.prev7)} a ${num(a.last7)} clics** (${a.deltaPct}%) de una semana a otra. Es una bajada moderada y, por los datos, no apunta a una penalización sino a una mezcla de estacionalidad y algún frente técnico.

## Lo que veo
- Las visitas desde asistentes de IA van en otra dirección: ${num(a.aiPrev7)} → **${num(a.aiLast7)}**. Parte de quien antes buscaba en Google ahora pregunta a ChatGPT.
- «${lowCtr.query}» tiene **${num(lowCtr.impressions)} impresiones** pero está en posición ${lowCtr.position.toLocaleString("es-ES")}: con pequeñas oscilaciones ahí se pierden muchos clics.
${speed ? `- La auditoría marca **${speed.label.toLowerCase()}**: ${speed.detail}\n` : ""}${sitemap ? `- ${sitemap.detail} Google pierde tiempo rastreando páginas que ya no existen.\n` : ""}
## Qué haría esta semana
1. Revisar en Search Console qué páginas concentran la caída (Rendimiento › Páginas, comparando semanas).
2. Corregir el sitemap para que solo incluya URLs que respondan 200.
3. Reforzar el artículo de «${lowCtr.query}» para subirlo al top 3.

Te dejo la tarea del sitemap preparada por si quieres abrirla.`
    : `Buenas noticias: has pasado de **${num(a.prev7)} a ${num(a.last7)} clics** (+${a.deltaPct}%) de una semana a otra, y las visitas desde IA de ${num(a.aiPrev7)} a **${num(a.aiLast7)}**.

## De dónde sale
- Los artículos publicados en las últimas semanas ya están posicionando: «${q[0].query}» suma ${num(q[0].impressions)} impresiones.
- ChatGPT sigue siendo tu primera fuente de IA (${a.aiReferrers[0]?.visits ?? 0} visitas en 28 días).

## Para mantenerlo
1. Subir al top 3 «${lowCtr.query}» (ahora en posición ${lowCtr.position.toLocaleString("es-ES")}).
2. Corregir lo pendiente de la auditoría${sitemap ? ", empezando por el sitemap" : ""}.
3. Seguir publicando con la cadencia actual: la constancia es lo que está tirando.`;
  const proposals: DemoProposal[] = [];
  if (sitemap)
    proposals.push({
      kind: "audit_fix",
      data: {
        check_id: "sitemap",
        title: "Limpiar URLs rotas del sitemap",
        steps: ["Exportar las URLs del sitemap con error 404.", "Redirigir con 301 las que tengan equivalente; quitar el resto.", "Regenerar sitemap.xml y reenviarlo en Search Console."],
        priority: "alta",
        reason: sitemap.detail,
      },
    });
  return { text, proposals };
}

function demoRefresh(ctx: SpecialistContext) {
  const pub = ctx.articles.filter((x) => x.status === "published");
  if (!pub.length) return { text: "Aún no tienes artículos publicados, así que no hay nada que actualizar. Centrémonos en publicar los primeros del plan.", proposals: [] };
  const withQuery = pub
    .map((ar) => ({ ar, q: ctx.analytics.topQueries.find((tq) => ar.keyword && norm(tq.query).includes(norm(ar.keyword))) }))
    .filter((x) => x.q && x.q.position > 4)
    .sort((x, y) => y.q!.impressions - x.q!.impressions);
  const pick = withQuery[0] ?? { ar: [...pub].sort((x, y) => (x.score ?? 100) - (y.score ?? 100))[0], q: undefined };
  const { ar, q } = pick;
  const text = `Empieza por **«${ar.title}»**.

## Por qué este
${q ? `- Su consulta principal, «${q.query}», tiene **${num(q.impressions)} impresiones** pero está en **posición ${q.position.toLocaleString("es-ES")}**. Es la zona donde una mejora pequeña se traduce en muchos más clics: pasar al top 3 suele duplicar el CTR.\n` : ""}- Puntuación de calidad: **${ar.score ?? "—"}/100** con ${num(ar.words)} palabras.
- Es un tema que también se pregunta a la IA, así que mejorarlo ayuda en Google y en ChatGPT a la vez.

## Qué cambiaría
1. Reescribir el primer párrafo como respuesta directa de 40–60 palabras.
2. Añadir una sección comparativa con criterios claros (material, uso diario, precio por pieza).
3. Sumar 2–3 preguntas frecuentes reales y enlazar desde tus artículos más visitados.
4. Actualizar la fecha y las fotos con piezas actuales del taller.

Te dejo la actualización preparada para añadirla al plan.`;
  return {
    text,
    proposals: [
      {
        kind: "content_topic",
        data: { title: ar.title, keyword: ar.keyword ?? q?.query ?? ar.title.toLowerCase(), cluster: null, intent: "informational", kind: "refresh", reason: q ? `Posición ${q.position.toLocaleString("es-ES")} con ${num(q.impressions)} impresiones: a un paso del top 3.` : `Puntuación ${ar.score}/100, la más baja de los publicados.` },
      },
    ] as DemoProposal[],
  };
}

function demoGeo(ctx: SpecialistContext) {
  const gap = findVisibilityGap(ctx);
  const v = ctx.visibility;
  const weakest = [...v.byModel].sort((x, y) => x.share - y.share)[0];
  const llms = ctx.audit?.results.find((r) => r.id === "llms" && r.status !== "pass");
  const schema = ctx.audit?.results.find((r) => r.id === "schema" && r.status !== "pass");
  const model = gap ? MODEL_LABEL[gap.model] : "ChatGPT";
  const comps = gap?.competitors.length ? gap.competitors.join(" y ") : (v.competitors[0]?.label ?? "tus competidores");
  const tracked = new Set(v.prompts.map((p) => norm(p.prompt)));
  const newPrompt = ["mejor vajilla de gres para uso diario", "taller de cerámica en Talavera que venda online", "vajilla artesanal que se pueda meter en el lavavajillas"].find((p) => !tracked.has(norm(p)));

  const text = `${gap ? `Ahora mismo, cuando alguien pregunta a ${model} «${gap.prompt}», **no te nombra** y en su lugar cita a ${comps}.` : `Tu cuota de voz en IA es del **${v.overall}%**.`} Tu cuota global es del **${v.overall}%** y el modelo donde más flojeas es **${weakest.label} (${weakest.share}%)**.

## Por qué pasa
- Los modelos recomiendan a quien encuentran **citado en varias fuentes** (blogs, foros, comparativas) y con páginas que responden la pregunta tal cual.
- ${comps} aparece${gap && gap.competitors.length > 1 ? "n" : ""} en reseñas y listados que los modelos usan como referencia.
${llms ? `- No tienes **llms.txt**: los modelos no tienen un resumen fiable de quién eres y qué vendes.\n` : ""}${schema ? `- ${schema.detail}\n` : ""}
## Plan para las próximas 4 semanas
1. **Una página que responda exactamente esa pregunta**, con criterios, precios orientativos y por qué tu taller encaja.
2. **Menciones fuera de tu web**: hilos de Reddit y Quora donde se pregunta esto${ctx.plan.id === "cosecha" ? " (tus agentes de Reddit y Quora ya pueden proponer respuestas)" : ""}, y 2–3 blogs de decoración.
3. ${llms ? "Publicar llms.txt (se genera en Ajustes › Publicación)." : "Mantener actualizado tu llms.txt con las páginas nuevas."}
4. Seguir una variante de la pregunta para ver si el cambio se generaliza.

Te dejo el tema y la pregunta preparados para que los confirmes.`;

  const proposals: DemoProposal[] = [];
  if (gap)
    proposals.push({
      kind: "content_topic",
      data: { title: `${gap.prompt.charAt(0).toUpperCase()}${gap.prompt.slice(1)}: guía honesta para elegir`, keyword: gap.prompt.toLowerCase(), cluster: "Comparativas", intent: "commercial", kind: "new", reason: `${model} no te menciona para esta pregunta y sí a ${comps}.` },
    });
  if (newPrompt) proposals.push({ kind: "tracked_prompt", data: { prompt: newPrompt, reason: "Variante cercana para comprobar si la mejora se extiende a otras formas de preguntar." } });
  return { text, proposals };
}

function demoAudit(ctx: SpecialistContext) {
  const audit = ctx.audit;
  if (!audit) return { text: "Todavía no hay ninguna auditoría de tu web. Lánzala desde **Auditoría** y te digo por dónde empezar.", proposals: [] };
  const fails = audit.results.filter((r) => r.status === "fail");
  const warns = audit.results.filter((r) => r.status === "warn");
  const top = [...fails, ...warns].slice(0, 3);
  const steps: Record<string, string[]> = {
    llms: ["Generar el llms.txt desde Ajustes › Publicación.", "Revisar que enlace a categorías, guías y página de contacto.", "Publicarlo en la raíz del dominio y comprobar que responde 200."],
    images: ["Convertir las imágenes de más de 400 KB a WebP o AVIF.", "Añadir width y height a cada imagen.", "Activar carga diferida (lazy) por debajo del primer pantallazo."],
    schema: ["Añadir JSON-LD Product a las fichas (nombre, precio, disponibilidad, reseñas).", "Validar con la prueba de resultados enriquecidos de Google."],
    speed: ["Precargar la imagen principal de cada página.", "Servir imágenes en formato moderno.", "Aplazar los scripts de terceros que no sean críticos."],
    meta: ["Listar las páginas sin meta descripción.", "Escribir una de 140–160 caracteres para cada una."],
    sitemap: ["Quitar del sitemap las URLs que devuelven 404.", "Reenviar el sitemap en Search Console."],
  };
  const titles: Record<string, string> = { llms: "Publicar llms.txt", images: "Optimizar las imágenes pesadas", schema: "Añadir schema Product a las fichas", speed: "Bajar el LCP en móvil", meta: "Completar meta descripciones", sitemap: "Limpiar URLs rotas del sitemap" };
  const text = `Tu auditoría está en **${audit.score}/100**. Yo iría en este orden:

${top.map((r, i) => `${i + 1}. **${r.label}** (${r.status === "fail" ? "fallo" : "aviso"}): ${r.detail}`).join("\n")}

## Por qué este orden
- ${fails.some((f) => f.id === "llms") ? "**llms.txt** es lo más rápido (minutos) y afecta directamente a cómo te describen ChatGPT y compañía." : "Los fallos primero: son los que más puntos y visibilidad te restan."}
- ${fails.some((f) => f.id === "images") ? "Las **imágenes pesadas** son la causa principal de tu LCP lento en móvil, y la velocidad influye en el posicionamiento y en la conversión." : "Después, los avisos que afectan a móvil, que es donde entra la mayoría de tu tráfico."}

Te dejo las tareas preparadas; las abres con un toque.`;
  return {
    text,
    proposals: top
      .filter((r) => r.status === "fail")
      .slice(0, 2)
      .map((r) => ({ kind: "audit_fix", data: { check_id: r.id, title: titles[r.id] ?? r.label, steps: steps[r.id] ?? ["Revisar el detalle en Auditoría.", "Aplicar la corrección sugerida.", "Relanzar la auditoría."], priority: "alta", reason: r.detail } })) as DemoProposal[],
  };
}

function demoPlan(ctx: SpecialistContext) {
  const existing = new Set(ctx.content.titles.map(norm));
  const ideas = [
    { title: "Cómo curar una cazuela de barro antes del primer uso", keyword: "curar cazuela de barro", cluster: "Cuidados", intent: "informational" as const, reason: "Pregunta muy frecuente en ChatGPT y foros de cocina; encaja con tu clúster de Cuidados." },
    { title: "Vajilla de gres para restaurante: cuánto dura y cuánto cuesta reponerla", keyword: "vajilla gres restaurante", cluster: "Hostelería", intent: "commercial" as const, reason: "Ataca la pregunta de proveedores para restaurante, donde la IA aún cita a la competencia." },
    { title: "Lista de bodas con piezas artesanas: cómo montarla", keyword: "lista de bodas ceramica", cluster: "Regalos", intent: "commercial" as const, reason: "Complementa «regalo de boda» con intención de compra más alta." },
  ].filter((i) => !existing.has(norm(i.title)));
  const text = `Mirando tu plan (${ctx.content.counts.planned ?? 0} temas planificados y ${ctx.content.counts.scheduled ?? 0} programados) y lo que preguntan a la IA, añadiría estos:

${ideas.map((i, n) => `${n + 1}. **${i.title}** — ${i.reason}`).join("\n")}

## El criterio
- Huecos donde la IA recomienda a otros y tú no tienes página que responda.
- Intención comercial para equilibrar un plan que ahora es sobre todo informativo.
- Temas que enlazan de forma natural con artículos que ya posicionan.

Te dejo los temas preparados; elige los que quieras añadir.`;
  return { text, proposals: ideas.map((i) => ({ kind: "content_topic", data: { ...i, kind: "new" } })) as DemoProposal[] };
}

function demoOverview(ctx: SpecialistContext) {
  const a = ctx.analytics;
  const v = ctx.visibility;
  const best = [...v.byModel].sort((x, y) => y.share - x.share)[0];
  const worst = [...v.byModel].sort((x, y) => x.share - y.share)[0];
  const text = `Te resumo cómo está ${ctx.site.name} ahora mismo:

- **Google**: ${a.connected ? `${num(a.last7)} clics en los últimos 7 días (${a.deltaPct >= 0 ? "+" : ""}${a.deltaPct}% frente a la semana anterior).` : "sin datos, falta conectar Search Console."}
- **IA**: te mencionan en el **${v.overall}%** de las respuestas. Mejor en ${best.label} (${best.share}%), peor en ${worst.label} (${worst.share}%).
- **Técnico**: auditoría en **${ctx.audit?.score ?? "—"}/100**${ctx.audit ? `, con ${ctx.audit.results.filter((r) => r.status === "fail").length} fallos pendientes` : ""}.
- **Contenido**: ${ctx.content.counts.published ?? 0} publicados y ${(ctx.content.counts.planned ?? 0) + (ctx.content.counts.scheduled ?? 0)} en camino.

Pregúntame lo que quieras: por qué se mueve el tráfico, qué artículo renovar, cómo aparecer en ${worst.label} o qué arreglar primero de la auditoría.`;
  return { text, proposals: [] as DemoProposal[] };
}
