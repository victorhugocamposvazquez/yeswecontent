"use client";

import { useMemo, useState } from "react";
import { Monitor, Plus, Smartphone, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AI_CRAWLERS as AI_CRAWLER_LIST } from "@/lib/marketing/crawlers";
import { OutputBlock } from "./tool-runner";

const field = "w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-3 focus:ring-4 focus:ring-lime";
const panel = "rounded-2xl border border-line bg-card p-5 shadow-[0_12px_32px_-16px_rgba(21,19,15,0.22)] sm:p-6";
const Lbl = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
  <label htmlFor={htmlFor} className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">
    {children}
  </label>
);

/* ═════════════ Vista previa SERP ═════════════ */

let ctx: CanvasRenderingContext2D | null = null;
function textWidth(text: string, font: string) {
  if (typeof document === "undefined") return text.length * 9;
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return text.length * 9;
  ctx.font = font;
  return ctx.measureText(text).width;
}
function truncatePx(text: string, max: number, font: string) {
  if (textWidth(text, font) <= max) return { text, cut: false };
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (textWidth(text.slice(0, mid) + " …", font) <= max) lo = mid;
    else hi = mid - 1;
  }
  return { text: text.slice(0, lo).trimEnd() + " …", cut: true };
}

export function SerpPreviewTool() {
  const [title, setTitle] = useState("Vajillas de gres artesanales hechas a mano | Tierrafina");
  const [desc, setDesc] = useState("Platos, cuencos y tazas de gres cocido a alta temperatura, aptos para lavavajillas. Envío en 48 h y devoluciones gratis durante 30 días.");
  const [url, setUrl] = useState("https://tierrafina.es/vajillas/gres");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  const titleFont = device === "desktop" ? "20px Arial" : "18px Arial";
  const t = truncatePx(title, device === "desktop" ? 600 : 520, titleFont);
  const descMax = device === "desktop" ? 158 : 120;
  const d = desc.length > descMax ? { text: desc.slice(0, descMax).replace(/\s+\S*$/, "") + " …", cut: true } : { text: desc, cut: false };
  let crumbs = url;
  try {
    const u = new URL(url);
    crumbs = [u.host, ...u.pathname.split("/").filter(Boolean)].join(" › ");
  } catch {
    /* URL a medio escribir */
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className={cn(panel, "space-y-5")}>
        <div>
          <Lbl htmlFor="serp-title">Título</Lbl>
          <input id="serp-title" value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
          <Counter n={title.length} ok={[30, 60]} />
        </div>
        <div>
          <Lbl htmlFor="serp-desc">Meta descripción</Lbl>
          <textarea id="serp-desc" rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} className={field} />
          <Counter n={desc.length} ok={[70, 158]} />
        </div>
        <div>
          <Lbl htmlFor="serp-url">URL</Lbl>
          <input id="serp-url" value={url} onChange={(e) => setUrl(e.target.value)} className={field} />
        </div>
      </div>
      <div>
        <div className="mb-4 inline-flex rounded-lg border border-line bg-card p-1">
          {(["desktop", "mobile"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setDevice(k)}
              aria-pressed={device === k}
              className={cn("inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-semibold", device === k ? "bg-ink text-paper" : "text-ink-2")}
            >
              {k === "desktop" ? <Monitor className="h-4 w-4" aria-hidden /> : <Smartphone className="h-4 w-4" aria-hidden />}
              {k === "desktop" ? "Escritorio" : "Móvil"}
            </button>
          ))}
        </div>
        <div className={cn("rounded-2xl border border-line bg-white p-5 font-[Arial,sans-serif]", device === "mobile" && "max-w-[380px]")}>
          <div className="flex items-center gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f1f3f4] text-xs font-bold text-[#5f6368]">{crumbs.charAt(0).toUpperCase() || "?"}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm text-[#202124]">{crumbs.split(" › ")[0]}</span>
              <span className="block truncate text-xs text-[#4d5156]">{crumbs}</span>
            </span>
          </div>
          <p className={cn("mt-2 text-[#1a0dab]", device === "desktop" ? "text-xl" : "text-lg")}>{t.text || "Escribe un título"}</p>
          <p className="mt-1 text-sm leading-snug text-[#4d5156]">{d.text || "Escribe una descripción"}</p>
        </div>
        <ul className="mt-5 space-y-2 text-sm">
          <li className={t.cut ? "text-warn" : "text-ok"}>{t.cut ? "• El título se cortará. Mueve lo importante al principio." : "• El título cabe entero."}</li>
          <li className={d.cut ? "text-warn" : "text-ok"}>{d.cut ? "• La descripción se cortará." : "• La descripción cabe entera."}</li>
          <li className="text-ink-3">• Es una aproximación: Google puede reescribir títulos y descripciones.</li>
        </ul>
      </div>
    </div>
  );
}

function Counter({ n, ok }: { n: number; ok: [number, number] }) {
  const good = n >= ok[0] && n <= ok[1];
  return (
    <p className={cn("mt-1 text-right font-mono text-xs", good ? "text-ok" : "text-warn")}>
      {n} caracteres · recomendado {ok[0]}–{ok[1]}
    </p>
  );
}

/* ═════════════ Generador de schema ═════════════ */

type SchemaType = "FAQPage" | "Article" | "Product" | "LocalBusiness";

export function SchemaGeneratorTool() {
  const [type, setType] = useState<SchemaType>("FAQPage");
  const [faq, setFaq] = useState([
    { q: "¿Las piezas son aptas para lavavajillas?", a: "Sí, todo nuestro gres está cocido a 1.250 °C y es apto para lavavajillas y microondas." },
    { q: "¿Cuánto tarda el envío?", a: "Entre 24 y 72 horas en la península." },
  ]);
  const [article, setArticle] = useState({ headline: "", author: "", date: new Date().toISOString().slice(0, 10), image: "", publisher: "", url: "" });
  const [product, setProduct] = useState({ name: "", description: "", image: "", brand: "", sku: "", price: "", currency: "EUR", availability: "InStock", rating: "", reviews: "" });
  const [biz, setBiz] = useState({ name: "", type: "LocalBusiness", phone: "", street: "", city: "", postal: "", region: "", country: "ES", url: "", hours: "Mo-Fr 09:00-19:00", lat: "", lng: "" });

  const json = useMemo(() => {
    const clean = (o: Record<string, unknown>): Record<string, unknown> =>
      Object.fromEntries(
        Object.entries(o)
          .map(([k, v]) => [k, v && typeof v === "object" && !Array.isArray(v) ? clean(v as Record<string, unknown>) : v])
          .filter(([, v]) => v !== "" && v !== undefined && !(v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).filter((x) => x !== "@type").length === 0)),
      );
    let data: Record<string, unknown>;
    if (type === "FAQPage")
      data = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.filter((f) => f.q && f.a).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      };
    else if (type === "Article")
      data = clean({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.headline,
        image: article.image,
        datePublished: article.date,
        author: { "@type": "Person", name: article.author },
        publisher: { "@type": "Organization", name: article.publisher },
        mainEntityOfPage: article.url,
      });
    else if (type === "Product")
      data = clean({
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: product.image,
        sku: product.sku,
        brand: { "@type": "Brand", name: product.brand },
        offers: { "@type": "Offer", price: product.price, priceCurrency: product.price ? product.currency : "", availability: product.price ? `https://schema.org/${product.availability}` : "" },
        aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.rating ? product.reviews : "" },
      });
    else
      data = clean({
        "@context": "https://schema.org",
        "@type": biz.type,
        name: biz.name,
        url: biz.url,
        telephone: biz.phone,
        address: { "@type": "PostalAddress", streetAddress: biz.street, addressLocality: biz.city, postalCode: biz.postal, addressRegion: biz.region, addressCountry: biz.country },
        geo: { "@type": "GeoCoordinates", latitude: biz.lat, longitude: biz.lng },
        openingHours: biz.hours,
      });
    return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`;
  }, [type, faq, article, product, biz]);

  const input = <T extends Record<string, string>>(state: T, set: (v: T) => void, key: keyof T, label: string, props: React.ComponentProps<"input"> = {}) => (
    <div>
      <Lbl htmlFor={`sc-${String(key)}`}>{label}</Lbl>
      <input id={`sc-${String(key)}`} value={state[key]} onChange={(e) => set({ ...state, [key]: e.target.value })} className={field} {...props} />
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className={panel}>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Tipo de schema">
          {(["FAQPage", "Article", "Product", "LocalBusiness"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={type === t}
              onClick={() => setType(t)}
              className={cn("rounded-lg border border-line px-3.5 py-1.5 text-sm font-semibold", type === t ? "bg-ink text-paper" : "bg-paper hover:bg-paper-2")}
            >
              {t === "FAQPage" ? "FAQ" : t}
            </button>
          ))}
        </div>
        <div className="mt-6 space-y-4">
          {type === "FAQPage" && (
            <>
              {faq.map((f, i) => (
                <div key={i} className="rounded-xl border border-dashed border-line p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-ink-3">Pregunta {i + 1}</span>
                    {faq.length > 1 && (
                      <button type="button" aria-label="Eliminar pregunta" onClick={() => setFaq(faq.filter((_, j) => j !== i))} className="-m-2 grid h-10 w-10 place-items-center text-ink-3 hover:text-bad">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <input aria-label={`Pregunta ${i + 1}`} value={f.q} onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} placeholder="Pregunta" className={cn(field, "mt-2")} />
                  <textarea aria-label={`Respuesta ${i + 1}`} value={f.a} onChange={(e) => setFaq(faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} placeholder="Respuesta" rows={2} className={cn(field, "mt-2")} />
                </div>
              ))}
              <button type="button" onClick={() => setFaq([...faq, { q: "", a: "" }])} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:bg-paper-2">
                <Plus className="h-4 w-4" aria-hidden /> Añadir pregunta
              </button>
            </>
          )}
          {type === "Article" && (
            <>
              {input(article, setArticle, "headline", "Titular")}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {input(article, setArticle, "author", "Autor")}
                {input(article, setArticle, "date", "Fecha de publicación", { type: "date" })}
              </div>
              {input(article, setArticle, "publisher", "Editor (organización)")}
              {input(article, setArticle, "image", "URL de la imagen", { placeholder: "https://" })}
              {input(article, setArticle, "url", "URL del artículo", { placeholder: "https://" })}
            </>
          )}
          {type === "Product" && (
            <>
              {input(product, setProduct, "name", "Nombre del producto")}
              {input(product, setProduct, "description", "Descripción")}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {input(product, setProduct, "brand", "Marca")}
                {input(product, setProduct, "sku", "SKU")}
                {input(product, setProduct, "price", "Precio", { inputMode: "decimal", placeholder: "39.90" })}
                <div>
                  <Lbl htmlFor="sc-avail">Disponibilidad</Lbl>
                  <select id="sc-avail" value={product.availability} onChange={(e) => setProduct({ ...product, availability: e.target.value })} className={field}>
                    <option value="InStock">En stock</option>
                    <option value="OutOfStock">Agotado</option>
                    <option value="PreOrder">Preventa</option>
                  </select>
                </div>
                {input(product, setProduct, "rating", "Valoración media", { inputMode: "decimal", placeholder: "4.7" })}
                {input(product, setProduct, "reviews", "Nº de reseñas", { inputMode: "numeric" })}
              </div>
              {input(product, setProduct, "image", "URL de la imagen", { placeholder: "https://" })}
            </>
          )}
          {type === "LocalBusiness" && (
            <>
              {input(biz, setBiz, "name", "Nombre del negocio")}
              <div>
                <Lbl htmlFor="sc-btype">Tipo</Lbl>
                <select id="sc-btype" value={biz.type} onChange={(e) => setBiz({ ...biz, type: e.target.value })} className={field}>
                  {["LocalBusiness", "Restaurant", "Store", "MedicalClinic", "Dentist", "LegalService", "HairSalon", "AutoRepair", "RealEstateAgent", "LodgingBusiness"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {input(biz, setBiz, "phone", "Teléfono", { type: "tel" })}
                {input(biz, setBiz, "url", "Web", { placeholder: "https://" })}
                {input(biz, setBiz, "street", "Dirección")}
                {input(biz, setBiz, "city", "Ciudad")}
                {input(biz, setBiz, "postal", "Código postal")}
                {input(biz, setBiz, "region", "Provincia")}
                {input(biz, setBiz, "lat", "Latitud")}
                {input(biz, setBiz, "lng", "Longitud")}
              </div>
              {input(biz, setBiz, "hours", "Horario", { placeholder: "Mo-Fr 09:00-19:00" })}
            </>
          )}
        </div>
      </div>
      <div className="lg:sticky lg:top-24 lg:h-fit">
        <OutputBlock filename="schema.jsonld.html" content={json} />
        <p className="mt-3 text-sm text-ink-3">Pégalo en el &lt;head&gt; o al final del &lt;body&gt; de la página. Solo marca lo que el usuario ve en la página.</p>
      </div>
    </div>
  );
}

/* ═════════════ Densidad de palabras ═════════════ */

const STOP = new Set(
  "a al algo algunas algunos ante antes como con contra cual cuando de del desde donde durante e el ella ellas ellos en entre era eres es esa esas ese eso esos esta estas este esto estos fue fueron ha hace han hasta hay la las le les lo los mas más me mi mis mucho muy nada ni no nos nosotros o os otra otro para pero poco por porque que qué quien se sea ser si sí sin sobre son su sus también tan te tiene tienen todo todos tu tus un una uno unos unas y ya yo the of and to in is for on that with your you it this are be as at by or an from".split(
    " ",
  ),
);

export function KeywordDensityTool() {
  const [text, setText] = useState("");
  const [kw, setKw] = useState("");
  const stats = useMemo(() => {
    const words = (text.toLowerCase().match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? []).filter((w) => w.length > 1);
    const total = words.length;
    const freq = new Map<string, number>();
    const bi = new Map<string, number>();
    words.forEach((w, i) => {
      if (!STOP.has(w)) freq.set(w, (freq.get(w) ?? 0) + 1);
      const n = words[i + 1];
      if (n && !STOP.has(w) && !STOP.has(n)) bi.set(`${w} ${n}`, (bi.get(`${w} ${n}`) ?? 0) + 1);
    });
    const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
    const topBi = [...bi.entries()].filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]).slice(0, 10);
    let kwCount = 0;
    const k = kw.trim().toLowerCase();
    if (k) {
      const esc = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      kwCount = (text.toLowerCase().match(new RegExp(`(?<![\\p{L}\\p{N}])${esc}(?![\\p{L}\\p{N}])`, "gu")) ?? []).length;
    }
    const kwWords = k ? k.split(/\s+/).length : 1;
    return { total, top, topBi, kwCount, kwDensity: total ? ((kwCount * kwWords) / total) * 100 : 0, minutes: Math.max(1, Math.round(total / 220)) };
  }, [text, kw]);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr]">
      <div className={cn(panel, "space-y-4")}>
        <div>
          <Lbl htmlFor="kd-text">Tu texto</Lbl>
          <textarea id="kd-text" rows={14} value={text} onChange={(e) => setText(e.target.value)} placeholder="Pega aquí tu artículo…" className={field} />
        </div>
        <div>
          <Lbl htmlFor="kd-kw">Palabra clave principal (opcional)</Lbl>
          <input id="kd-kw" value={kw} onChange={(e) => setKw(e.target.value)} placeholder="vajilla de gres" className={field} />
        </div>
      </div>
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            ["Palabras", stats.total.toLocaleString("es-ES")],
            ["Lectura", `${stats.minutes} min`],
            ["Densidad", kw ? `${stats.kwDensity.toFixed(1)}%` : "—"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-line bg-card p-3">
              <p className="text-xs text-ink-3">{k}</p>
              <p className="text-xl font-semibold tabular-nums">{v}</p>
            </div>
          ))}
        </div>
        {kw && stats.total > 0 && (
          <p className={cn("rounded-xl border p-3 text-sm", stats.kwDensity > 3 ? "border-warn bg-warn/10" : stats.kwCount === 0 ? "border-bad bg-bad/10" : "border-ok bg-ok/10")}>
            «{kw}» aparece {stats.kwCount} {stats.kwCount === 1 ? "vez" : "veces"}.{" "}
            {stats.kwDensity > 3 ? "Quizá la repites demasiado: usa sinónimos." : stats.kwCount === 0 ? "No aparece ni una vez." : "Frecuencia natural."}
          </p>
        )}
        <FreqTable title="Palabras más usadas" rows={stats.top} total={stats.total} />
        {stats.topBi.length > 0 && <FreqTable title="Parejas de palabras" rows={stats.topBi} total={stats.total} />}
      </div>
    </div>
  );
}

function FreqTable({ title, rows, total }: { title: string; rows: [string, number][]; total: number }) {
  const max = rows[0]?.[1] ?? 1;
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-3">Pega un texto para ver resultados.</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map(([w, c]) => (
            <li key={w} className="grid grid-cols-[1fr_5rem_3.5rem] items-center gap-2 text-sm">
              <span className="truncate">{w}</span>
              <span className="h-2 rounded-full bg-paper-2">
                <span className="block h-full rounded-full bg-signal" style={{ width: `${(c / max) * 100}%` }} />
              </span>
              <span className="text-right font-mono text-xs tabular-nums">
                {c} · {((c / Math.max(total, 1)) * 100).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ═════════════ Generador de robots.txt ═════════════ */

export function RobotsGeneratorTool() {
  const [allowAll, setAllowAll] = useState(true);
  const [blocked, setBlocked] = useState<Record<string, boolean>>({});
  const [paths, setPaths] = useState("/wp-admin/\n/carrito/\n/checkout/");
  const [sitemap, setSitemap] = useState("https://tuweb.com/sitemap.xml");

  const content = useMemo(() => {
    const lines: string[] = ["# robots.txt generado con yeswecontent", ""];
    const blockedBots = AI_CRAWLER_LIST.filter((c) => blocked[c.agent]);
    for (const b of blockedBots) lines.push(`User-agent: ${b.agent}`, "Disallow: /", "");
    lines.push("User-agent: *");
    if (!allowAll) lines.push("Disallow: /");
    else {
      const ps = paths.split("\n").map((p) => p.trim()).filter(Boolean);
      if (ps.length) ps.forEach((p) => lines.push(`Disallow: ${p.startsWith("/") ? p : `/${p}`}`));
      else lines.push("Allow: /");
      if (paths.includes("/wp-admin/")) lines.push("Allow: /wp-admin/admin-ajax.php");
    }
    if (sitemap.trim()) lines.push("", `Sitemap: ${sitemap.trim()}`);
    return lines.join("\n") + "\n";
  }, [allowAll, blocked, paths, sitemap]);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className={cn(panel, "space-y-6")}>
        <div>
          <p className="font-semibold">Rastreadores de IA</p>
          <p className="text-sm text-ink-3">Activa los que quieres dejar entrar.</p>
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
            {AI_CRAWLER_LIST.map((c) => {
              const on = !blocked[c.agent];
              return (
                <li key={c.agent} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block font-mono text-sm font-semibold">{c.agent}</span>
                    <span className="block text-xs text-ink-3">
                      {c.owner} · {c.purpose}
                    </span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={`Permitir ${c.agent}`}
                    onClick={() => setBlocked({ ...blocked, [c.agent]: on })}
                    className={cn("relative h-7 w-12 shrink-0 rounded-full border border-line transition", on ? "bg-lime" : "bg-paper-2")}
                  >
                    <span className={cn("absolute top-0.5 h-5 w-5 rounded-full border border-line bg-card transition-all", on ? "left-[22px]" : "left-0.5")} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={!allowAll} onChange={(e) => setAllowAll(!e.target.checked)} className="h-4 w-4 accent-[var(--signal)]" />
          Bloquear todo el sitio a todos los robots (por ejemplo, en una web en pruebas)
        </label>
        <div>
          <Lbl htmlFor="rg-paths">Rutas privadas (una por línea)</Lbl>
          <textarea id="rg-paths" rows={4} value={paths} onChange={(e) => setPaths(e.target.value)} className={cn(field, "font-mono")} disabled={!allowAll} />
        </div>
        <div>
          <Lbl htmlFor="rg-sitemap">URL del sitemap</Lbl>
          <input id="rg-sitemap" value={sitemap} onChange={(e) => setSitemap(e.target.value)} className={field} />
        </div>
      </div>
      <div className="lg:sticky lg:top-24 lg:h-fit">
        <OutputBlock filename="robots.txt" content={content} />
        <p className="mt-3 text-sm text-ink-3">Súbelo a la raíz de tu dominio (tuweb.com/robots.txt). Recuerda que robots.txt es una petición: los robots respetuosos la cumplen, pero no es un candado.</p>
      </div>
    </div>
  );
}
