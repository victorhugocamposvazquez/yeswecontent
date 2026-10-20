/**
 * Inserción de enlaces contextuales dentro de párrafos reales del Markdown
 * (nunca en títulos, listas, citas, pies ni bloques de enlaces).
 */
import { fromBlocks, isClosingSection, isProseParagraph, toBlocks, type Block } from "@/lib/panel/blocks";
import { cosine, normalize, vector, type TermVector } from "./relevance";

export interface InsertOptions {
  /** Texto de la página de destino para elegir el párrafo más afín. */
  targetVector: TermVector;
  /** Si se indica, se intenta envolver esta expresión si ya aparece en el texto. */
  phrase?: string | null;
  /** Frase completa (con el enlace) a añadir al final del párrafo elegido. */
  sentence: (paragraph: string) => Promise<string> | string;
  url: string;
}

const hasLink = (raw: string) => /\]\(/.test(raw);
const linkCount = (md: string, url: string) => md.split(`](${url})`).length - 1;

/** Párrafos candidatos ordenados por afinidad (sin la respuesta directa ni el cierre). */
export function rankParagraphs(blocks: Block[], target: TermVector, { allowLinked = false } = {}) {
  const firstPara = blocks.findIndex((b) => b.type === "paragraph");
  return blocks
    .map((b, i) => ({ b, i }))
    .filter(({ b, i }) => i !== firstPara && isProseParagraph(b) && !isClosingSection(b.section) && (allowLinked || !hasLink(b.raw)))
    .map(({ b, i }) => ({ i, score: cosine(vector([{ text: b.raw, weight: 1 }, { text: b.section, weight: 1.5 }]), target) }))
    .sort((x, y) => y.score - x.score);
}

/** Busca la expresión fuera de enlaces ya existentes y la envuelve con el enlace. */
export function wrapPhrase(raw: string, phrase: string, url: string): string | null {
  if (phrase.trim().length < 4) return null;
  const segments = raw.split(/(!?\[[^\]]*\]\([^)]*\))/);
  const needle = normalize(phrase);
  for (let s = 0; s < segments.length; s++) {
    const seg = segments[s];
    if (/^!?\[[^\]]*\]\([^)]*\)$/.test(seg)) continue;
    const at = normalize(seg).indexOf(needle);
    if (at < 0) continue;
    // Evita cortar palabras por la mitad.
    const before = seg[at - 1];
    const after = seg[at + phrase.length];
    if ((before && /[\p{L}\d]/u.test(before)) || (after && /[\p{L}\d]/u.test(after))) continue;
    if (/\*\*$/.test(seg.slice(0, at))) continue;
    segments[s] = `${seg.slice(0, at)}[${seg.slice(at, at + phrase.length)}](${url})${seg.slice(at + phrase.length)}`;
    return segments.join("");
  }
  return null;
}

/**
 * Inserta un enlace: primero intenta envolver la expresión en un párrafo afín;
 * si no aparece, añade una frase natural al párrafo más relacionado.
 */
export async function insertContextualLink(md: string, opts: InsertOptions): Promise<{ body_md: string; anchor: string; paragraph: string } | null> {
  if (linkCount(md, opts.url)) return null;
  const blocks = toBlocks(md);
  const ranked = rankParagraphs(blocks, opts.targetVector);
  if (!ranked.length) return null;

  if (opts.phrase) {
    for (const { i } of ranked) {
      const wrapped = wrapPhrase(blocks[i].raw, opts.phrase, opts.url);
      if (wrapped) {
        blocks[i] = { ...blocks[i], raw: wrapped };
        return { body_md: fromBlocks(blocks), anchor: opts.phrase, paragraph: wrapped };
      }
    }
  }

  const { i } = ranked[0];
  const sentence = (await opts.sentence(blocks[i].raw)).trim();
  const anchor = /\[([^\]]+)\]\(/.exec(sentence)?.[1];
  if (!anchor || !sentence.includes(`](${opts.url})`)) return null;
  const para = blocks[i].raw.replace(/\s*$/, "");
  const joined = `${para}${/[.!?…:]$/.test(para) ? "" : "."} ${sentence}`;
  blocks[i] = { ...blocks[i], raw: joined };
  return { body_md: fromBlocks(blocks), anchor, paragraph: joined };
}

const pick = <T,>(arr: T[], seed: string) => arr[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % arr.length];
const lowerFirst = (s: string) => (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/** Frases de respaldo (sin IA) para enlaces internos. */
export function internalSentence(anchor: string, url: string) {
  const a = lowerFirst(anchor);
  return pick(
    [
      `Lo explicamos con más detalle en [${a}](${url}).`,
      `Si quieres profundizar, échale un vistazo a [${a}](${url}).`,
      `Te lo contamos paso a paso en [${a}](${url}).`,
      `Aquí tienes más contexto sobre [${a}](${url}).`,
    ],
    url,
  );
}

/** Frases de respaldo (sin IA) para enlaces hacia webs de la red. */
export function partnerSentence(anchor: string, url: string, partnerName: string) {
  const a = lowerFirst(anchor);
  return pick(
    [
      `Si te interesa este punto, en ${partnerName} explican muy bien [${a}](${url}).`,
      `Para ampliar, merece la pena leer sobre [${a}](${url}).`,
      `Hay una buena guía sobre [${a}](${url}) que complementa esta idea.`,
      `En ${partnerName} tienen más información útil sobre [${a}](${url}).`,
    ],
    url + anchor,
  );
}
