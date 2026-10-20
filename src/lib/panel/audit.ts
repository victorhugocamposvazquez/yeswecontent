import "server-only";
import type { AuditCheck } from "@/lib/types";

/** Sugerencias de corrección por comprobación (se muestran en el panel y en el enlace público). */
export const FIXES: Record<string, string> = {
  https: "Activa un certificado SSL (Let's Encrypt es gratuito) y redirige todo el tráfico http a https.",
  robots: "Revisa robots.txt: no bloquees /, y permite GPTBot, ClaudeBot, PerplexityBot y Google-Extended si quieres aparecer en respuestas de IA.",
  sitemap: "Genera un sitemap.xml con solo URLs que respondan 200 y enlázalo desde robots.txt.",
  llms: "Publica un llms.txt en la raíz con un resumen de tu negocio y tus páginas clave. Puedes generarlo en Ajustes › Publicación.",
  schema: "Añade datos estructurados JSON-LD (Organization en la home, Article en el blog, Product en fichas).",
  answers: "Empieza cada artículo con una respuesta directa de 40–60 palabras a la pregunta principal.",
  h1: "Deja un único H1 por página que describa su tema principal.",
  meta: "Escribe una meta descripción única de 140–160 caracteres en cada página.",
  og: "Define og:title, og:description y og:image para que tus enlaces se vean bien al compartirlos.",
  speed: "Reduce el LCP: sirve imágenes en WebP/AVIF, precarga la imagen principal y elimina scripts bloqueantes.",
  images: "Comprime las imágenes y usa formatos modernos; añade width/height para evitar saltos de diseño.",
  lang: "Declara el idioma en la etiqueta <html lang=\"es\"> y usa hreflang si tienes varias versiones.",
  canonical: "Añade una etiqueta canonical que apunte a la URL preferida de cada página.",
};

const AI_BOTS = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"];

async function get(url: string) {
  try {
    const res = await fetch(url, { headers: { "user-agent": "yeswecontent-audit/1.0" }, signal: AbortSignal.timeout(8000), redirect: "follow" });
    return { ok: res.ok, status: res.status, url: res.url, text: res.ok ? (await res.text()).slice(0, 500_000) : "" };
  } catch {
    return { ok: false, status: 0, url, text: "" };
  }
}

/** Auditoría técnica + GEO ligera sobre la home y los ficheros raíz. */
export async function runAudit(siteUrl: string): Promise<{ score: number; results: AuditCheck[] }> {
  const origin = new URL(siteUrl).origin;
  const started = Date.now();
  const [home, robots, sitemap, llms] = await Promise.all([get(origin), get(`${origin}/robots.txt`), get(`${origin}/sitemap.xml`), get(`${origin}/llms.txt`)]);
  const elapsed = Date.now() - started;
  const html = home.text;
  const r: AuditCheck[] = [];
  const add = (id: string, group: string, label: string, status: AuditCheck["status"], detail: string) => r.push({ id, group, label, status, detail });

  add("https", "Rastreo", "HTTPS activo", home.url.startsWith("https://") ? "pass" : "fail", home.url.startsWith("https://") ? "La web carga con certificado válido." : "La web no fuerza https.");

  if (!robots.ok) add("robots", "Rastreo", "robots.txt", "warn", "No encontramos robots.txt.");
  else {
    const blockedAll = /user-agent:\s*\*[\s\S]*?disallow:\s*\/\s*$/im.test(robots.text);
    const blockedBots = AI_BOTS.filter((b) => new RegExp(`user-agent:\\s*${b}[\\s\\S]*?disallow:\\s*/\\s*$`, "im").test(robots.text));
    add(
      "robots",
      "Rastreo",
      "robots.txt",
      blockedAll ? "fail" : blockedBots.length ? "warn" : "pass",
      blockedAll ? "Bloquea el rastreo de toda la web." : blockedBots.length ? `Bloquea a: ${blockedBots.join(", ")}.` : "Permite el acceso a buscadores y rastreadores de IA.",
    );
  }
  const urls = (sitemap.text.match(/<loc>/g) ?? []).length;
  add("sitemap", "Rastreo", "Sitemap XML", sitemap.ok ? "pass" : "warn", sitemap.ok ? `Encontrado, con ${urls} URLs.` : "No hay /sitemap.xml accesible.");
  add("llms", "IA", "llms.txt", llms.ok ? "pass" : "fail", llms.ok ? "Existe y es accesible." : "No existe. Te ayuda a que los modelos de IA entiendan tu web.");

  const jsonLd = (html.match(/application\/ld\+json/gi) ?? []).length;
  add("schema", "IA", "Datos estructurados", jsonLd ? "pass" : "warn", jsonLd ? `${jsonLd} bloque(s) JSON-LD en la home.` : "La home no tiene JSON-LD.");

  const h1 = (html.match(/<h1[\s>]/gi) ?? []).length;
  add("h1", "Contenido", "Un H1 por página", h1 === 1 ? "pass" : h1 === 0 ? "fail" : "warn", h1 === 1 ? "Correcto en la home." : `La home tiene ${h1} H1.`);
  const meta = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']{50,})/i.test(html) || /<meta[^>]+content=["']([^"']{50,})["'][^>]+name=["']description/i.test(html);
  add("meta", "Contenido", "Meta descripción", meta ? "pass" : "warn", meta ? "La home tiene meta descripción." : "Falta o es demasiado corta.");
  const og = /property=["']og:title/i.test(html) && /property=["']og:image/i.test(html);
  add("og", "Contenido", "Open Graph", og ? "pass" : "warn", og ? "Título e imagen definidos." : "Faltan og:title u og:image.");
  const lang = /<html[^>]+lang=/i.test(html);
  add("lang", "Contenido", "Idioma declarado", lang ? "pass" : "warn", lang ? "La etiqueta html declara el idioma." : "Falta el atributo lang.");
  const canonical = /rel=["']canonical/i.test(html);
  add("canonical", "Contenido", "Canonical", canonical ? "pass" : "warn", canonical ? "Definida en la home." : "Sin etiqueta canonical.");

  add("speed", "Rendimiento", "Tiempo de respuesta", elapsed < 1500 ? "pass" : elapsed < 3500 ? "warn" : "fail", `Primera respuesta en ${(elapsed / 1000).toFixed(1)} s (medición aproximada desde nuestro servidor).`);
  const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]);
  const legacy = imgs.filter((s) => /\.(png|jpe?g)(\?|$)/i.test(s)).length;
  add("images", "Rendimiento", "Imágenes en formato moderno", legacy === 0 ? "pass" : legacy < 5 ? "warn" : "fail", imgs.length ? `${legacy} de ${imgs.length} imágenes en PNG/JPG.` : "No se detectan imágenes en la home.");

  const pts = r.reduce((a, c) => a + (c.status === "pass" ? 1 : c.status === "warn" ? 0.5 : 0), 0);
  return { score: Math.round((pts / r.length) * 100), results: r };
}
