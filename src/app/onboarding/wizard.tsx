"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Check, Globe, LoaderCircle, Phone, Plus, Sparkles, Users, WandSparkles, X } from "lucide-react";
import { Badge, Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import type { Plan } from "@/lib/types";
import { suggestHostedBlogUrls } from "@/lib/headless/hosted-blog";
import {
  maxPlanAnnualSavingsPercent,
  planAnnualSavingsCents,
  planAnnualSavingsPercent,
  planMonthlyCents,
  planYearlyTotalAtAnnualRate,
  planYearlyTotalAtMonthlyRate,
} from "@/lib/plans";
import { cn, eur } from "@/lib/utils";
import { finishOnboarding, saveOnboardingStep } from "./actions";
import { BlogStep } from "./blog-step";
import { ConnectionsStep, type OAuthReturn } from "./connections-step";
import { initialState, type OnboardingState } from "./types";

type StepId = "web" | "agencia" | "equipo" | "dominio" | "llamada" | "negocio" | "idioma" | "voz" | "competidores" | "seo" | "conectar" | "plan" | "encuesta";

const STEP_LABEL: Record<StepId, string> = {
  web: "Tu web",
  agencia: "Tu agencia",
  equipo: "Equipo",
  dominio: "Dominio",
  llamada: "Llamada",
  negocio: "Negocio",
  idioma: "Idiomas",
  voz: "Voz de marca",
  competidores: "Competidores",
  seo: "Ajustes SEO",
  conectar: "Conexiones",
  plan: "Plan",
  encuesta: "Una última cosa",
};

const LANGS: [string, string][] = [
  ["es", "Español"],
  ["en", "Inglés"],
  ["fr", "Francés"],
  ["de", "Alemán"],
  ["it", "Italiano"],
  ["pt", "Portugués"],
  ["ca", "Catalán"],
];
const DAYS: [string, string][] = [
  ["mon", "L"],
  ["tue", "M"],
  ["wed", "X"],
  ["thu", "J"],
  ["fri", "V"],
  ["sat", "S"],
  ["sun", "D"],
];
const TONES = ["Cercano y claro, con criterio experto", "Profesional y sobrio", "Divertido y directo", "Inspirador y cálido", "Técnico y preciso"];
const SOURCES = ["Google", "ChatGPT u otra IA", "Recomendación", "LinkedIn", "Instagram o TikTok", "YouTube o podcast", "Un evento", "Otro"];

const STORAGE_KEY = "ywc_onboarding";

const domainOf = (u: string) => {
  try {
    return new URL(/^https?:\/\//.test(u) ? u : `https://${u}`).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
};

export function Wizard({ plans, demo, bookingUrl }: { plans: Plan[]; demo: boolean; bookingUrl: string | null }) {
  const router = useRouter();
  const [s, setS] = useState<OnboardingState>({ ...initialState, planId: plans[0]?.id ?? "" });
  const [siteId, setSiteId] = useState<string | null>(null);
  const [i, setI] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [oauth, setOauth] = useState<OAuthReturn | null>(null);
  const maxAnnualSave = useMemo(() => maxPlanAnnualSavingsPercent(plans), [plans]);
  const blogHints = useMemo(() => suggestHostedBlogUrls(s.url || "https://ejemplo.com"), [s.url]);

  // Vuelta de una conexión OAuth (?oauth=google&estado=ok|error&motivo=…): lo mostramos y limpiamos la URL.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const provider = q.get("oauth");
    const estado = q.get("estado");
    if (provider && estado) {
      setOauth({ provider, estado, motivo: q.get("motivo") ?? undefined });
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // Recupera el progreso si se recarga la página.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { s: OnboardingState; siteId: string | null; i: number };
        setS({ ...initialState, ...saved.s });
        setSiteId(saved.siteId);
        setI(saved.i ?? 0);
      }
    } catch {
      /* sin almacenamiento disponible */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ s, siteId, i }));
    } catch {
      /* ignorar */
    }
  }, [s, siteId, i]);

  const steps = useMemo<StepId[]>(
    () =>
      s.kind === "agency"
        ? ["web", "agencia", "equipo", "dominio", "llamada", "negocio", "idioma", "voz", "competidores", "seo", "conectar", "plan", "encuesta"]
        : ["web", "negocio", "idioma", "voz", "competidores", "seo", "conectar", "plan", "encuesta"],
    [s.kind],
  );
  const idx = Math.min(i, steps.length - 1);
  const step = steps[idx];
  const progress = Math.round(((idx + 1) / steps.length) * 100);
  const set = <K extends keyof OnboardingState>(k: K, v: OnboardingState[K]) => setS((p) => ({ ...p, [k]: v }));
  const setAgency = (patch: Partial<OnboardingState["agency"]>) => setS((p) => ({ ...p, agency: { ...p.agency, ...patch } }));

  function validate(): string | null {
    if (step === "web" && !/\.[a-z]{2,}/i.test(s.url)) return "Escribe la dirección de tu web, por ejemplo tuweb.com.";
    if (step === "negocio" && (!s.name.trim() || !s.description.trim())) return "Necesitamos al menos el nombre y una breve descripción.";
    if (step === "seo" && !s.days.length) return "Elige al menos un día de publicación.";
    if (step === "plan" && !s.planId) return "Elige un plan.";
    return null;
  }

  async function finish(id: string | null) {
    await finishOnboarding(id);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignorar */
    }
    router.push("/panel");
    router.refresh();
  }

  function next() {
    const v = validate();
    if (v) return setError(v);
    setError(null);
    startTransition(async () => {
      if (step === "plan") {
        // Primero intentamos Stripe Checkout (lo resuelve /api/stripe/checkout).
        try {
          const res = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ planId: s.planId, interval: s.interval, ...(siteId ? { siteId } : {}) }),
          });
          const json = (await res.json().catch(() => ({}))) as { url?: string | null };
          if (json.url) {
            await saveOnboardingStep("encuesta", s, siteId).catch(() => null);
            await finishOnboarding(siteId);
            window.location.href = json.url;
            return;
          }
        } catch {
          /* seguimos sin Stripe */
        }
        // Sin URL de pago: prueba de 3 días directa.
        const r = await saveOnboardingStep("plan", s, siteId);
        if (!r.ok) return setError(r.error);
        setI(idx + 1);
        return;
      }
      const r = await saveOnboardingStep(step, { ...s, name: s.name || domainOf(s.url) }, siteId);
      if (!r.ok) return setError(r.error);
      if (r.siteId) setSiteId(r.siteId);
      if (step === "web" && !s.name) set("name", domainOf(s.url).split(".")[0].replace(/^./, (c) => c.toUpperCase()));
      if (idx === steps.length - 1) return finish(r.siteId ?? siteId);
      setI(idx + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  async function analyze() {
    setAiLoading(true);
    setAiNote(null);
    try {
      const res = await fetch("/api/ai/analyze-site", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: s.url }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No hemos podido leer tu web.");
      const a = json.analysis as { name: string; niche: string; audience: string; description: string; language: string; tone: string; competitors: { name: string; url: string }[] };
      setS((p) => ({
        ...p,
        name: a.name || p.name,
        niche: a.niche || p.niche,
        audience: a.audience || p.audience,
        description: a.description || p.description,
        language: a.language || p.language,
        tone: a.tone || p.tone,
        suggested: a.competitors?.length ? a.competitors : p.suggested,
      }));
      setAiNote(json.source === "claude" ? "Listo. Revisa lo que hemos entendido y ajusta lo que haga falta." : "Hemos rellenado lo básico a partir de tu web. Revísalo y complétalo.");
    } catch (e) {
      setAiNote(e instanceof Error ? e.message : "No hemos podido leer tu web.");
    } finally {
      setAiLoading(false);
    }
  }

  const suggestions = s.suggested.length
    ? s.suggested
    : [
        { name: "Competidor principal", url: `competidor-de-${domainOf(s.url || "tuweb.com").split(".")[0]}.com` },
        { name: "Referente del sector", url: "referente-del-sector.es" },
      ];

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-xs text-ink-3">
          <span>
            Paso <span className="tabular font-medium text-ink">{idx + 1}</span> de {steps.length} · <span className="font-medium text-ink">{STEP_LABEL[step]}</span>
          </span>
          <span className="tabular">{progress}%</span>
        </div>
        <ol className="flex gap-1" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso del alta">
          {steps.map((st, k) => (
            <li key={st} className="group relative min-w-0 flex-1" title={STEP_LABEL[st]}>
              <span className={cn("block h-1.5 rounded-full transition-colors duration-300", k < idx ? "bg-signal" : k === idx ? "bg-signal/60" : "bg-line-2/70")} />
              <span className={cn("mt-1.5 hidden truncate text-[10px] sm:block", k === idx ? "font-medium text-ink" : "text-ink-3")}>{STEP_LABEL[st]}</span>
            </li>
          ))}
        </ol>
      </div>

      <Card elevated className="rise p-5 sm:p-6 md:p-8">
        {step === "web" && (
          <StepHead title="Empecemos por tu web" intro="Dinos dónde vive tu negocio en internet. A partir de ahí, nosotros nos encargamos.">
            <div className="space-y-5">
              <Field label="Dirección de tu web">
                <div className="relative">
                  <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden />
                  <Input value={s.url} onChange={(e) => set("url", e.target.value)} placeholder="tuweb.com" className="pl-9 text-base" autoFocus inputMode="url" autoComplete="url" />
                </div>
              </Field>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-ink-2">¿Para quién es?</legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["business", "Para mi negocio", "Una o varias webs propias.", Building2],
                      ["agency", "Soy una agencia", "Gestiono webs de clientes y quiero marca blanca.", Users],
                    ] as const
                  ).map(([v, l, d, Icon]) => (
                    <label key={v} className={cn("relative cursor-pointer rounded-2xl border p-4 transition-all duration-150", s.kind === v ? "border-signal bg-signal-soft/50 ring-1 ring-signal" : "border-line bg-card hover:border-line-2 hover:shadow-[var(--shadow-sm)]")}>
                      <input type="radio" name="kind" className="sr-only" checked={s.kind === v} onChange={() => set("kind", v)} />
                      <span className={cn("mb-3 grid h-9 w-9 place-items-center rounded-lg", s.kind === v ? "bg-signal text-signal-ink" : "bg-signal-soft text-signal")}>
                        <Icon className="h-[18px] w-[18px]" aria-hidden />
                      </span>
                      {s.kind === v && <Check className="absolute right-3 top-3 h-4 w-4 text-signal" aria-hidden />}
                      <span className="block text-[15px] font-semibold tracking-tight">{l}</span>
                      <span className="text-[13px] text-ink-3">{d}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </StepHead>
        )}

        {step === "agencia" && (
          <StepHead title="Tu agencia, tu marca" intro="Tus clientes verán tu nombre, tu logo y tus colores en el panel y en los informes.">
            <div className="space-y-4">
              <Field label="Nombre de la agencia">
                <Input value={s.agency.brand} onChange={(e) => setAgency({ brand: e.target.value })} placeholder="Nido Studio" />
              </Field>
              <Field label="URL de tu logo" hint="SVG o PNG con fondo transparente. Puedes cambiarlo después.">
                <Input value={s.agency.logo_url} onChange={(e) => setAgency({ logo_url: e.target.value })} type="url" placeholder="https://…/logo.svg" />
              </Field>
              <Field label="Color principal">
                <div className="flex items-center gap-3">
                  <Input type="color" value={s.agency.color} onChange={(e) => setAgency({ color: e.target.value })} className="h-11 w-20 p-1" />
                  <span className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: s.agency.color }}>
                    {s.agency.brand || "Tu agencia"}
                  </span>
                </div>
              </Field>
            </div>
          </StepHead>
        )}

        {step === "equipo" && <TeamStep invites={s.agency.invites} onChange={(invites) => setAgency({ invites })} />}

        {step === "dominio" && (
          <StepHead title="Tu propio dominio" intro="Opcional: sirve el panel desde un subdominio tuyo, como panel.tuagencia.com.">
            <Field label="Subdominio">
              <Input value={s.agency.domain} onChange={(e) => setAgency({ domain: e.target.value })} placeholder="panel.tuagencia.com" />
            </Field>
            <div className="scroll-x mt-5 rounded-xl border border-line">
              <table className="w-full min-w-[420px] text-[13px]">
                <thead className="bg-paper-2 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">
                  <tr>
                    <th className="px-4 py-2 font-medium">Tipo</th>
                    <th className="px-4 py-2 font-medium">Nombre</th>
                    <th className="px-4 py-2 font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs">
                  <tr>
                    <td className="px-4 py-2.5">CNAME</td>
                    <td className="px-4 py-2.5">{(s.agency.domain || "panel.tuagencia.com").split(".")[0]}</td>
                    <td className="px-4 py-2.5">cname.yeswecontent.com</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-ink-3">Añádelo en el proveedor de tu dominio. Comprobaremos la configuración automáticamente y activaremos el certificado SSL.</p>
          </StepHead>
        )}

        {step === "llamada" && (
          <StepHead title="Hablemos 20 minutos" intro="Te enseñamos cómo trabajan otras agencias con yeswecontent y ajustamos precios por volumen. Sin compromiso.">
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-ink-2">Elige cuándo te viene bien</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {nextSlots().map((slot) => (
                  <label key={slot} className={cn("cursor-pointer rounded-xl border px-3 py-2.5 text-center text-[13px] font-medium transition-colors", s.agency.callSlot === slot ? "border-signal bg-signal-soft text-signal ring-1 ring-signal" : "border-line bg-card hover:bg-paper-2")}>
                    <input type="radio" name="slot" className="sr-only" checked={s.agency.callSlot === slot} onChange={() => setAgency({ callSlot: slot })} />
                    {slot}
                  </label>
                ))}
              </div>
            </fieldset>
            {bookingUrl && (
              <a href={bookingUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-signal underline">
                <Phone className="h-4 w-4" aria-hidden /> Prefiero elegir en el calendario
              </a>
            )}
            <p className="mt-4 text-sm text-ink-3">Puedes saltarte este paso y seguir configurando tu primer cliente.</p>
          </StepHead>
        )}

        {step === "negocio" && (
          <StepHead title={s.kind === "agency" ? "Tu primer cliente" : "Cuéntanos de tu negocio"} intro="Con esto elegimos los temas y el enfoque de cada artículo.">
            <div className="mb-5 rounded-2xl border border-signal/20 bg-signal-soft/60 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-signal text-signal-ink">
                  <WandSparkles className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">¿Te ahorramos el trabajo?</p>
                  <p className="text-xs text-ink-2">Leemos {domainOf(s.url) || "tu web"} y rellenamos los campos por ti.</p>
                </div>
                <Button type="button" variant="ink" onClick={analyze} disabled={aiLoading || !s.url}>
                  {aiLoading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <WandSparkles className="h-4 w-4" aria-hidden />}
                  {aiLoading ? "Leyendo tu web…" : "Rellenar con IA"}
                </Button>
              </div>
              {aiNote && (
                <p role="status" className="mt-2 text-xs text-ink-2">
                  {aiNote}
                </p>
              )}
            </div>
            <div className="space-y-4">
              <Field label="Nombre de la marca">
                <Input value={s.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Sector o nicho" hint="Ej.: cerámica artesanal, fisioterapia deportiva, software de RR. HH.">
                <Input value={s.niche} onChange={(e) => set("niche", e.target.value)} />
              </Field>
              <Field label="¿A quién te diriges?">
                <Textarea rows={2} value={s.audience} onChange={(e) => set("audience", e.target.value)} placeholder="Personas que… / Empresas que…" />
              </Field>
              <Field label="¿Qué haces y qué te diferencia?">
                <Textarea rows={3} value={s.description} onChange={(e) => set("description", e.target.value)} />
              </Field>
            </div>
          </StepHead>
        )}

        {step === "idioma" && (
          <StepHead title="¿En qué idiomas escribimos?" intro="El idioma principal marca el plan de contenidos. Los adicionales se traducen y adaptan, no se traducen sin más.">
            <Field label="Idioma principal">
              <Select value={s.language} onChange={(e) => set("language", e.target.value)}>
                {LANGS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <fieldset className="mt-5">
              <legend className="mb-2 text-sm font-medium text-ink-2">Idiomas adicionales (opcional)</legend>
              <div className="flex flex-wrap gap-2">
                {LANGS.filter(([v]) => v !== s.language).map(([v, l]) => {
                  const on = s.extra_languages.includes(v);
                  return (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set("extra_languages", on ? s.extra_languages.filter((x) => x !== v) : [...s.extra_languages, v])}
                      className={cn("inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-medium transition-colors max-sm:h-10", on ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink-2 hover:border-line-2 hover:bg-paper-2")}
                    >
                      {on && <Check className="mr-1 inline h-3.5 w-3.5" aria-hidden />}
                      {l}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-ink-3">Según tu plan podrás activar hasta 4 idiomas.</p>
            </fieldset>
          </StepHead>
        )}

        {step === "voz" && (
          <StepHead title="¿Cómo suena tu marca?" intro="Escribiremos como lo harías tú. Puedes afinarlo cuando quieras en Ajustes.">
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-ink-2">Tono</legend>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button key={t} type="button" aria-pressed={s.tone === t} onClick={() => set("tone", t)} className={cn("inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-medium transition-colors max-sm:h-10", s.tone === t ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink-2 hover:border-line-2 hover:bg-paper-2")}>
                    {t}
                  </button>
                ))}
              </div>
              <Input className="mt-2" value={s.tone} onChange={(e) => set("tone", e.target.value)} aria-label="Tono personalizado" />
            </fieldset>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Escribimos en">
                <Select value={s.person} onChange={(e) => set("person", e.target.value)}>
                  <option value="nosotros">Primera del plural (nosotros)</option>
                  <option value="yo">Primera del singular (yo)</option>
                  <option value="impersonal">Impersonal</option>
                </Select>
              </Field>
              <Field label="Palabras que evitar" hint="Separadas por comas">
                <Input value={s.avoid} onChange={(e) => set("avoid", e.target.value)} placeholder="barato, líder, sinergia" />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Un texto que te represente (opcional)" hint="Un párrafo de tu web, un post o un email. Nos sirve de referencia de estilo.">
                <Textarea rows={4} value={s.sample} onChange={(e) => set("sample", e.target.value)} />
              </Field>
            </div>
          </StepHead>
        )}

        {step === "competidores" && <CompetitorsStep list={s.competitors} suggestions={suggestions} onChange={(c) => set("competitors", c)} />}

        {step === "seo" && (
          <StepHead title="Ajustes de publicación" intro="Valores recomendados para empezar. Todo se puede cambiar después.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Palabras mínimas por artículo">
                <Select value={String(s.min_words)} onChange={(e) => set("min_words", Number(e.target.value))}>
                  {[800, 1000, 1400, 1800, 2500].map((n) => (
                    <option key={n} value={n}>
                      {n} palabras
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Enlaces internos por artículo">
                <Select value={String(s.internal_links)} onChange={(e) => set("internal_links", Number(e.target.value))}>
                  {[0, 2, 3, 4, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CheckCard checked={s.faq} onChange={(v) => set("faq", v)} title="Preguntas frecuentes" desc="Un bloque FAQ al final de cada artículo." />
              <CheckCard checked={s.schema} onChange={(v) => set("schema", v)} title="Datos estructurados" desc="JSON-LD para Google y la IA." />
            </div>
            <fieldset className="mt-5">
              <legend className="mb-2 text-sm font-medium text-ink-2">Días de publicación</legend>
              <div className="flex gap-1.5">
                {DAYS.map(([v, l]) => {
                  const on = s.days.includes(v);
                  return (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={on}
                      aria-label={v}
                      onClick={() => set("days", on ? s.days.filter((d) => d !== v) : [...s.days, v])}
                      className={cn("h-10 w-10 rounded-full border text-sm font-semibold transition-colors", on ? "border-signal bg-signal text-signal-ink" : "border-line bg-card text-ink-2 hover:bg-paper-2")}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Hora (UTC)">
                <Input type="time" value={s.time} onChange={(e) => set("time", e.target.value)} />
              </Field>
              <Field label="Ritmo">
                <Select value={s.mode} onChange={(e) => set("mode", e.target.value as "drip" | "batch")}>
                  <option value="drip">Goteo: repartido en el mes</option>
                  <option value="batch">Todo el mes de una vez</option>
                </Select>
              </Field>
            </div>
          </StepHead>
        )}

        {step === "conectar" && (
          <StepHead title="Conecta tus herramientas" intro="Para medir resultados y publicar desde tus cuentas sin que muevas un dedo. Puedes hacerlo ahora o más tarde desde Ajustes.">
            <div className="space-y-3">
              <ConnectionsStep siteId={siteId} demo={demo} oauth={oauth} />
              <BlogStep
                name={s.name}
                siteId={siteId}
                demo={demo}
                intent={s.publishIntent}
                cms={s.cms}
                domainMode={s.hostedBlogMode === "folder" ? "folder" : "subdomain"}
                domain={s.hostedBlogDomain}
                look={s.blogLook}
                color={s.blogColor}
                logoUrl={s.blogLogoUrl}
                subdomainHint={blogHints.subdomainHost}
                folderHint={blogHints.folderBaseUrl}
                onIntent={(v) => setS((p) => ({ ...p, publishIntent: v, cms: v === "existing" ? (p.cms === "Blog alojado" ? null : p.cms) : "Blog alojado", hostedBlogMode: v === "domain" ? (p.hostedBlogMode === "folder" ? "folder" : "subdomain") : "platform" }))}
                onCms={(v) => set("cms", v)}
                onDomainMode={(v) => set("hostedBlogMode", v)}
                onDomain={(v) => set("hostedBlogDomain", v)}
                onLook={(v) => set("blogLook", v)}
                onColor={(v) => set("blogColor", v)}
                onLogo={(v) => set("blogLogoUrl", v)}
              />
            </div>
          </StepHead>
        )}

        {step === "plan" && (
          <StepHead title="Elige tu plan" intro="Prueba 3 días gratis. Cancela cuando quieras desde tu panel.">
            <div className="mb-4 inline-flex rounded-full border border-line bg-paper-2 p-1" role="radiogroup" aria-label="Periodicidad del pago">
              {(
                [
                  ["year", maxAnnualSave > 0 ? `Anual · ahorra hasta ${maxAnnualSave}%` : "Anual"],
                  ["month", "Mensual"],
                ] as const
              ).map(([v, l]) => (
                <button key={v} type="button" role="radio" aria-checked={s.interval === v} onClick={() => set("interval", v)} className={cn("min-h-9 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors", s.interval === v ? "bg-card text-ink shadow-[var(--shadow-xs)]" : "text-ink-2 hover:text-ink")}>
                  {l}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {plans.map((p, k) => (
                <label key={p.id} className={cn("relative cursor-pointer rounded-2xl border p-5 transition-all duration-150", s.planId === p.id ? "border-signal bg-signal-soft/50 ring-1 ring-signal" : "border-line bg-card hover:border-line-2 hover:shadow-[var(--shadow-sm)]")}>
                  <input type="radio" name="plan" className="sr-only" checked={s.planId === p.id} onChange={() => set("planId", p.id)} />
                  {k === plans.length - 1 && plans.length > 1 && (
                    <Badge tone="signal" className="absolute right-4 top-4">
                      Más completo
                    </Badge>
                  )}
                  <p className="text-lg font-semibold">{p.name}</p>
                  <p className="mt-1">
                    <span className="tabular font-semibold tracking-tight text-2xl">{eur(planMonthlyCents(p, s.interval))}</span>
                    <span className="text-sm text-ink-3">/mes</span>
                  </p>
                  {s.interval === "year" ? (
                    <div className="mt-1 space-y-0.5 text-xs text-ink-3">
                      <p>
                        <span className="tabular font-medium text-ink-2">{eur(planYearlyTotalAtAnnualRate(p))}</span> al año · ahorras{" "}
                        <span className="tabular font-medium text-ok">{eur(planAnnualSavingsCents(p))}</span> ({planAnnualSavingsPercent(p)}%) frente a pagar mes a mes
                      </p>
                      <p className="tabular">
                        <s>{eur(p.monthly_price_eur)}/mes</s> sin anual ({eur(planYearlyTotalAtMonthlyRate(p))}/año)
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-ink-3">
                      <span className="tabular">{eur(planYearlyTotalAtMonthlyRate(p))}</span> al año · el anual baja a{" "}
                      <span className="tabular font-medium text-ink-2">{eur(planYearlyTotalAtAnnualRate(p))}</span>
                    </p>
                  )}
                  <ul className="mt-3 space-y-1.5 text-sm text-ink-2">
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-hidden />
                      {p.articles_per_month} artículos al mes
                    </li>
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-hidden />
                      {p.tracked_prompts} preguntas vigiladas en IA
                    </li>
                    {p.features.slice(0, 3).map((f) => (
                      <li key={f} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                </label>
              ))}
            </div>
            {demo && <p className="mt-4 text-xs text-ink-3">Modo demo: no se cobrará nada ni se guardará el plan.</p>}
          </StepHead>
        )}

        {step === "encuesta" && (
          <StepHead title="¿Cómo nos has conocido?" intro="Nos ayuda a saber dónde contar lo que hacemos. Es opcional.">
            <div className="grid grid-cols-2 gap-2">
              {SOURCES.map((src) => (
                <button key={src} type="button" aria-pressed={s.survey === src} onClick={() => set("survey", src)} className={cn("min-h-11 rounded-xl border px-3 py-3 text-left text-[13px] font-medium transition-colors", s.survey === src ? "border-signal bg-signal-soft text-signal ring-1 ring-signal" : "border-line bg-card hover:bg-paper-2")}>
                  {src}
                </button>
              ))}
            </div>
            {s.survey === "Otro" && <Input className="mt-3" value={s.surveyOther} onChange={(e) => set("surveyOther", e.target.value)} placeholder="Cuéntanos" aria-label="Otro origen" />}
            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-ink p-4 text-paper">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-lime" aria-hidden />
              <p className="text-[13px] leading-relaxed">Al terminar prepararemos tu primer plan de contenidos y lanzaremos la auditoría de tu web. Tardamos unos minutos: puedes ir explorando el panel.</p>
            </div>
          </StepHead>
        )}

        {error && (
          <p role="alert" className="mt-5 rounded-lg bg-bad-soft px-3 py-2 text-[13px] text-bad">
            {error}
          </p>
        )}

        <div className="sticky bottom-0 z-10 -mx-5 -mb-5 mt-8 flex items-center justify-between gap-2 rounded-b-2xl border-t border-line bg-card/90 px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-md sm:static sm:-mx-6 sm:-mb-6 sm:flex-wrap sm:gap-3 sm:bg-paper-2/70 sm:px-6 sm:py-4 sm:backdrop-blur-none md:-mx-8 md:-mb-8 md:px-8">
          <Button type="button" variant="ghost" className="max-sm:min-h-11 max-sm:px-3" onClick={() => setI(Math.max(0, idx - 1))} disabled={idx === 0 || pending}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> Atrás
          </Button>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none">
            {["conectar", "llamada", "dominio", "equipo", "encuesta", "competidores"].includes(step) && (
              <Button type="button" variant="ghost" className="max-sm:min-h-11 max-sm:px-3" disabled={pending} onClick={() => (idx === steps.length - 1 ? startTransition(() => finish(siteId)) : setI(idx + 1))}>
                Saltar
              </Button>
            )}
            <Button type="button" onClick={next} disabled={pending} className="max-sm:min-h-11 max-sm:flex-1 max-sm:px-4">
              {pending && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
              {step === "plan" ? "Empezar prueba gratis" : idx === steps.length - 1 ? "Ir a mi panel" : "Continuar"}
              {!pending && <ArrowRight className="h-4 w-4" aria-hidden />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function StepHead({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <section>
      <h1 className="text-[1.5rem] font-semibold leading-tight tracking-tight md:text-[1.75rem]">{title}</h1>
      <p className="mb-6 mt-2 text-[15px] text-ink-2">{intro}</p>
      {children}
    </section>
  );
}

function CheckCard({ checked, onChange, title, desc }: { checked: boolean; onChange: (v: boolean) => void; title: string; desc: string }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all duration-150", checked ? "border-signal bg-signal-soft/50 ring-1 ring-signal" : "border-line bg-card hover:border-line-2")}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--signal)]" />
      <span>
        <span className="block font-medium">{title}</span>
        <span className="text-sm text-ink-3">{desc}</span>
      </span>
    </label>
  );
}

function TeamStep({ invites, onChange }: { invites: string[]; onChange: (v: string[]) => void }) {
  const [email, setEmail] = useState("");
  const add = () => {
    const e = email.trim().toLowerCase();
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) && !invites.includes(e)) onChange([...invites, e]);
    setEmail("");
  };
  return (
    <StepHead title="Invita a tu equipo" intro="Les llegará un email para unirse cuando termines. Usuarios ilimitados en planes de agencia.">
      <div className="flex gap-2">
        <label htmlFor="invite" className="sr-only">
          Email de la persona
        </label>
        <Input id="invite" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} placeholder="nombre@tuagencia.com" />
        <Button type="button" variant="ink" onClick={add} className="shrink-0">
          <Plus className="h-4 w-4" aria-hidden /> Añadir
        </Button>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {invites.map((e) => (
          <li key={e} className="inline-flex items-center gap-1 rounded-full border border-line bg-card py-1 pl-3 pr-1 text-[13px]">
            {e}
            <button type="button" onClick={() => onChange(invites.filter((x) => x !== e))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-line" aria-label={`Quitar ${e}`}>
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </StepHead>
  );
}

function CompetitorsStep({ list, suggestions, onChange }: { list: { name: string; url: string }[]; suggestions: { name: string; url: string }[]; onChange: (v: { name: string; url: string }[]) => void }) {
  const [url, setUrl] = useState("");
  const has = (u: string) => list.some((c) => domainOf(c.url) === domainOf(u));
  const add = (c: { name: string; url: string }) => !has(c.url) && onChange([...list, c]);
  return (
    <StepHead title="¿Con quién compites?" intro="Vigilaremos si la IA los recomienda a ellos y no a ti, y buscaremos temas que ellos no cubren.">
      <p className="mb-2 text-sm font-medium text-ink-2">Sugerencias</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((c) => (
          <button
            key={c.url}
            type="button"
            onClick={() => (has(c.url) ? onChange(list.filter((x) => domainOf(x.url) !== domainOf(c.url))) : add(c))}
            aria-pressed={has(c.url)}
            className={cn("inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-medium transition-colors max-sm:h-10", has(c.url) ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink-2 hover:border-line-2 hover:bg-paper-2")}
          >
            {has(c.url) ? <Check className="mr-1 inline h-3.5 w-3.5" aria-hidden /> : <Plus className="mr-1 inline h-3.5 w-3.5" aria-hidden />}
            {c.name} <span className="opacity-60">· {domainOf(c.url)}</span>
          </button>
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <label htmlFor="comp" className="sr-only">
          Web de un competidor
        </label>
        <Input
          id="comp"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (url.includes(".")) add({ name: domainOf(url), url });
              setUrl("");
            }
          }}
          placeholder="Añade otro: competidor.com"
        />
        <Button
          type="button"
          variant="ink"
          className="shrink-0"
          onClick={() => {
            if (url.includes(".")) add({ name: domainOf(url), url });
            setUrl("");
          }}
        >
          Añadir
        </Button>
      </div>
      {list.length > 0 && (
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-card">
          {list.map((c) => (
            <li key={c.url} className="flex items-center justify-between px-4 py-2 text-[13px]">
              <span>
                {c.name} <span className="text-ink-3">· {domainOf(c.url)}</span>
              </span>
              <button type="button" onClick={() => onChange(list.filter((x) => x.url !== c.url))} className="-mr-2 grid h-10 w-10 place-items-center rounded-full hover:bg-paper-2" aria-label={`Quitar ${c.name}`}>
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </StepHead>
  );
}

function nextSlots() {
  const out: string[] = [];
  const d = new Date();
  while (out.length < 6) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const day = new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric" }).format(d);
    out.push(`${day} · ${out.length % 2 ? "16:30" : "10:00"}`);
  }
  return out;
}
