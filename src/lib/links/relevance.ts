/**
 * Relevancia temática por solapamiento de palabras clave (coseno sobre
 * términos ponderados). Sin dependencias; pensado para español e inglés.
 */

const STOP = new Set(
  `a al algo algun alguna algunas alguno algunos ante antes aqui asi aun aunque bajo bien cada casi como con contra cual cuales cuando cuanto de del desde donde dos el ella ellas ellos en entre era eran es esa esas ese eso esos esta estan estas este esto estos esta fue fueron ha hace hacen hacer hasta hay la las le les lo los mas me mejor menos mi mis mucho muy nada ni no nos nosotros o otra otras otro otros para pero poco por porque puede pueden que quien se sea segun ser si sido sin sobre solo son su sus tambien tan tanto te tiene tienen todo todos tu tus un una unas uno unos usted ya yo
  guia como cuanto cuesta que tipos consejos paso pasos todo saber debes puedes hay ano anos dia dias vez veces forma manera cosa cosas parte tiempo ejemplo caso casos
  the and for with from that this your you are how what why when which into about more most best guide tips`.split(/\s+/),
);

export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const stem = (w: string) => (w.length > 5 && w.endsWith("es") ? w.slice(0, -2) : w.length > 4 && w.endsWith("s") ? w.slice(0, -1) : w);

export function terms(text: string): string[] {
  return normalize(text.replace(/\]\([^)]*\)/g, "]").replace(/https?:\/\/\S+/g, " "))
    .split(/[^a-z0-9ñ]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w))
    .map(stem);
}

export type TermVector = Map<string, number>;

export function vector(parts: { text: string | null | undefined; weight: number }[]): TermVector {
  const v: TermVector = new Map();
  for (const p of parts) {
    if (!p.text) continue;
    for (const t of terms(p.text)) v.set(t, (v.get(t) ?? 0) + p.weight);
  }
  return v;
}

export function cosine(a: TermVector, b: TermVector): number {
  if (!a.size || !b.size) return 0;
  let dot = 0;
  for (const [k, x] of a) {
    const y = b.get(k);
    if (y) dot += x * y;
  }
  if (!dot) return 0;
  const na = Math.sqrt([...a.values()].reduce((s, x) => s + x * x, 0));
  const nb = Math.sqrt([...b.values()].reduce((s, x) => s + x * x, 0));
  return dot / (na * nb);
}

/** Términos compartidos (para explicar por qué se eligió un enlace). */
export const sharedTerms = (a: TermVector, b: TermVector, n = 4) =>
  [...a.keys()]
    .filter((k) => b.has(k))
    .sort((x, y) => (b.get(y)! * a.get(y)!) - (b.get(x)! * a.get(x)!))
    .slice(0, n);

/** Vector del artículo: título y palabra clave pesan más que el cuerpo. */
export const articleVector = (a: { title: string; keyword?: string | null; cluster?: string | null; body_md?: string }) =>
  vector([
    { text: a.title, weight: 4 },
    { text: a.keyword, weight: 5 },
    { text: a.cluster, weight: 2 },
    { text: (a.body_md ?? "").match(/^#{2,3}\s+.*$/gm)?.join(" "), weight: 2 },
    { text: a.body_md, weight: 0.35 },
  ]);
