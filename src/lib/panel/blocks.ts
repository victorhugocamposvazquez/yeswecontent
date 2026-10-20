/**
 * Troceo de Markdown en bloques (título, párrafo, lista, cita, imagen) para
 * insertar imágenes y enlaces en sitios con sentido sin romper el texto.
 */

export type BlockType = "heading" | "paragraph" | "list" | "quote" | "image";
export interface Block {
  type: BlockType;
  raw: string;
  /** Nivel del título (2 = ##). */
  level?: number;
  /** Título ## o ### bajo el que está el bloque. */
  section: string;
}

const isHeading = (l: string) => /^#{1,6}\s+/.test(l);
const isList = (l: string) => /^\s*([-*+]|\d+[.)])\s+/.test(l);
const isQuote = (l: string) => /^>\s?/.test(l);
const isImage = (l: string) => /^!\[[^\]]*\]\([^)\s]+\)$/.test(l.trim());

export function toBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let section = "";
  let cur: Block | null = null;
  const push = () => {
    if (cur) blocks.push(cur);
    cur = null;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      push();
      continue;
    }
    if (isHeading(line)) {
      push();
      const level = /^(#+)/.exec(line)![1].length;
      section = line.replace(/^#+\s+/, "").trim();
      blocks.push({ type: "heading", raw: line, level, section });
      continue;
    }
    if (isImage(line)) {
      push();
      blocks.push({ type: "image", raw: line.trim(), section });
      continue;
    }
    const type: BlockType = isList(line) ? "list" : isQuote(line) ? "quote" : "paragraph";
    // Las líneas de continuación de un elemento de lista siguen en la lista.
    if (cur && (cur.type === type || (cur.type === "list" && /^\s{2,}\S/.test(line)))) {
      cur.raw += `\n${line}`;
    } else {
      push();
      cur = { type, raw: line, section };
    }
  }
  push();
  return blocks;
}

export const fromBlocks = (blocks: Block[]) => `${blocks.map((b) => b.raw).join("\n\n").trim()}\n`;

/** Párrafos "reales": texto corrido de cierta longitud, sin ser una lista de enlaces. */
export function isProseParagraph(b: Block) {
  if (b.type !== "paragraph") return false;
  const text = b.raw.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  const words = text.split(/\s+/).filter(Boolean).length;
  const links = (b.raw.match(/\]\(/g) ?? []).length;
  return words >= 18 && links <= 1 && !/^\*\*[^*]+\*\*:?$/.test(b.raw.trim());
}

/** Secciones de cierre donde no conviene insertar enlaces ni imágenes. */
export const isClosingSection = (s: string) => /resumen|conclusi[oó]n|preguntas frecuentes|faq|en pocas palabras|para terminar/i.test(s);
