/**
 * Puntuación de calidad (0–100) heurística y sin dependencias. Se usa en
 * servidor (/api/ai/score, tras generar un artículo) y en el editor, en vivo.
 */
import { headings } from "./markdown";

export interface ScoreInput {
  title: string;
  body_md: string;
  keyword?: string | null;
  meta_description?: string | null;
  faq?: { q: string; a: string }[];
  schema?: boolean;
  min_words?: number;
  internal_links?: number;
}

export interface ScoreResult {
  score: number;
  breakdown: Record<string, number>;
  tips: string[];
  word_count: number;
}

export const SCORE_LABELS: Record<string, string> = {
  estructura: "Estructura y títulos",
  legibilidad: "Legibilidad",
  "palabra clave": "Uso de la palabra clave",
  enlaces: "Enlaces",
  "respuesta directa": "Respuesta directa",
  schema: "FAQ y datos estructurados",
};

const WEIGHTS: Record<string, number> = {
  estructura: 0.2,
  legibilidad: 0.15,
  "palabra clave": 0.2,
  enlaces: 0.15,
  "respuesta directa": 0.15,
  schema: 0.15,
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export function scoreArticle(input: ScoreInput): ScoreResult {
  // Las imágenes (![alt](url)) no cuentan como texto ni como enlaces.
  const body = (input.body_md ?? "").replace(/^\s*!\[[^\]]*\]\([^)\s]+\)\s*$/gm, "").replace(/!\[[^\]]*\]\([^)\s]+\)/g, "");
  const plain = body.replace(/[#*>`_[\]()-]/g, " ");
  const words = plain.trim() ? plain.trim().split(/\s+/) : [];
  const wc = words.length;
  const tips: string[] = [];
  const hs = headings(body);
  const h2 = hs.filter((h) => h.level === 2).length;
  const h3 = hs.filter((h) => h.level === 3).length;
  const minWords = input.min_words ?? 1200;

  // Estructura
  let estructura = 40;
  if (h2 >= 3) estructura += 30;
  else if (h2 >= 1) estructura += 15;
  if (h3 >= 1) estructura += 10;
  if (/^\s*[-*]\s+/m.test(body) || /^\s*\d+[.)]\s+/m.test(body)) estructura += 10;
  if (wc >= minWords) estructura += 10;
  else tips.push(`Amplía el texto: tiene ${wc} palabras y tu mínimo es ${minWords}.`);
  if (h2 < 3) tips.push("Divide el contenido en al menos 3 secciones con subtítulos (##).");

  // Legibilidad: longitud media de frase y de párrafo
  const sentences = plain.split(/[.!?¿¡]+\s/).filter((s) => s.trim().split(/\s+/).length > 2);
  const avgSentence = sentences.length ? wc / sentences.length : wc;
  const paragraphs = body.split(/\n{2,}/).filter((p) => p.trim() && !p.trim().startsWith("#"));
  const longParas = paragraphs.filter((p) => p.split(/\s+/).length > 120).length;
  let legibilidad = 100;
  if (avgSentence > 28) legibilidad -= 30;
  else if (avgSentence > 22) legibilidad -= 15;
  legibilidad -= longParas * 10;
  if (avgSentence > 22) tips.push("Acorta las frases: la media supera las 22 palabras.");
  if (longParas) tips.push(`Hay ${longParas} párrafo(s) muy largos; pártelos para leer mejor en móvil.`);

  // Palabra clave
  let kwScore = 60;
  const kw = input.keyword ? norm(input.keyword) : "";
  if (kw) {
    const nb = norm(body);
    const occurrences = nb.split(kw).length - 1;
    const density = wc ? (occurrences * kw.split(/\s+/).length * 100) / wc : 0;
    kwScore = 20;
    if (norm(input.title).includes(kw)) kwScore += 25;
    else tips.push("Incluye la palabra clave en el título.");
    if (hs.some((h) => norm(h.text).includes(kw))) kwScore += 15;
    else tips.push("Usa la palabra clave (o una variante) en algún subtítulo.");
    if (norm(nb.slice(0, 600)).includes(kw)) kwScore += 15;
    else tips.push("Menciona la palabra clave en el primer párrafo.");
    if (input.meta_description && norm(input.meta_description).includes(kw)) kwScore += 10;
    if (density >= 0.4 && density <= 2.5) kwScore += 15;
    else if (density > 2.5) tips.push("La palabra clave se repite demasiado; usa sinónimos.");
  }

  // Enlaces
  const links = [...body.matchAll(/\[[^\]]+\]\(([^)\s]+)\)/g)].map((m) => m[1]);
  const internal = links.filter((l) => l.startsWith("/") || l.includes("{{site}}")).length;
  const external = links.length - internal;
  const wantedInternal = input.internal_links ?? 3;
  let enlaces = 30 + Math.min(internal, wantedInternal) * (50 / Math.max(wantedInternal, 1)) + (external > 0 ? 20 : 0);
  if (internal < wantedInternal) tips.push(`Añade enlaces internos: ${internal} de ${wantedInternal} recomendados.`);
  if (!links.length) enlaces = 25;

  // Respuesta directa: el primer párrafo debe responder en ≤ 60 palabras
  const firstPara = paragraphs[0] ?? "";
  const firstLen = firstPara.split(/\s+/).filter(Boolean).length;
  let respuesta = 40;
  if (firstLen > 0 && firstLen <= 60) respuesta = 95;
  else if (firstLen <= 90) respuesta = 75;
  if (respuesta < 95) tips.push("Abre con una respuesta directa de 40–60 palabras: es lo que citan las IA.");

  // FAQ y schema
  const faqCount = input.faq?.length ?? 0;
  let schema = 20 + Math.min(faqCount, 4) * 15 + (input.schema !== false ? 20 : 0);
  if (faqCount < 3) tips.push("Añade al menos 3 preguntas frecuentes.");
  if (!input.meta_description) {
    schema -= 10;
    tips.push("Escribe una meta descripción (140–160 caracteres).");
  }

  const breakdown: Record<string, number> = {
    estructura: clamp(estructura),
    legibilidad: clamp(legibilidad),
    "palabra clave": clamp(kwScore),
    enlaces: clamp(enlaces),
    "respuesta directa": clamp(respuesta),
    schema: clamp(schema),
  };
  const score = clamp(Object.entries(breakdown).reduce((acc, [k, v]) => acc + v * (WEIGHTS[k] ?? 0), 0));
  return { score, breakdown, tips: tips.slice(0, 6), word_count: wc };
}

export const scoreTone = (s: number | null | undefined) => (s == null ? "neutral" : s >= 85 ? "ok" : s >= 65 ? "warn" : "bad") as "neutral" | "ok" | "warn" | "bad";
