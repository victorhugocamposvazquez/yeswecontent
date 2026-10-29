"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui";
import { DEFAULT_AI_RATES, estimateMonthlyCost, type AiPriceRates, type CostEstimateInput } from "@/lib/ai/pricing";
import { cn } from "@/lib/utils";

const usd = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);

type SliderDef = {
  key: keyof CostEstimateInput;
  label: string;
  help: string;
  min: number;
  max: number;
  step?: number;
};

const SLIDERS: SliderDef[] = [
  {
    key: "sites",
    label: "Sitios / empresas",
    help: "Cuántas webs publican este mes (p. ej. Reformas + yeswecontent = 2).",
    min: 1,
    max: 20,
  },
  {
    key: "articlesPerSite",
    label: "Artículos por sitio",
    help: "Cada artículo ≈ una llamada larga a Claude (entrada + salida) más el brief de imágenes.",
    min: 0,
    max: 120,
  },
  {
    key: "imagesPerArticle",
    label: "Imágenes por artículo",
    help: "Portada + interiores con OpenAI Images. 0 = solo portadas editoriales gratis (sin API).",
    min: 0,
    max: 5,
  },
  {
    key: "linksPerArticle",
    label: "Enlaces insertados por artículo",
    help: "Frases generadas al colocar backlinks de la red. Suele ser 0–2.",
    min: 0,
    max: 5,
  },
  {
    key: "plansPerSite",
    label: "Planes editoriales / sitio",
    help: "Veces que regeneras el plan del mes (normalmente 1).",
    min: 0,
    max: 4,
  },
  {
    key: "specialistTurnsPerSite",
    label: "Turnos del especialista / sitio",
    help: "Cada mensaje del chat del especialista con Claude + herramientas.",
    min: 0,
    max: 100,
    step: 5,
  },
  {
    key: "visibilityPromptsPerSite",
    label: "Preguntas de visibilidad / sitio",
    help: "Prompts que rastreas en ChatGPT, Claude, Gemini y Perplexity.",
    min: 0,
    max: 50,
  },
  {
    key: "visibilityChecksPerPrompt",
    label: "Comprobaciones por pregunta / mes",
    help: "30 ≈ una vez al día (como el cron). 4 ≈ semanal.",
    min: 0,
    max: 60,
    step: 1,
  },
];

const PRESETS: { id: string; label: string; values: CostEstimateInput }[] = [
  {
    id: "semilla",
    label: "Como Semilla (1 sitio)",
    values: {
      sites: 1,
      articlesPerSite: 20,
      imagesPerArticle: 2,
      linksPerArticle: 1,
      plansPerSite: 1,
      specialistTurnsPerSite: 10,
      visibilityPromptsPerSite: 10,
      visibilityChecksPerPrompt: 30,
    },
  },
  {
    id: "cosecha",
    label: "Como Cosecha (1 sitio)",
    values: {
      sites: 1,
      articlesPerSite: 80,
      imagesPerArticle: 3,
      linksPerArticle: 2,
      plansPerSite: 1,
      specialistTurnsPerSite: 30,
      visibilityPromptsPerSite: 40,
      visibilityChecksPerPrompt: 30,
    },
  },
  {
    id: "dogfood",
    label: "Tú: 2 sitios (Reformas + YWC)",
    values: {
      sites: 2,
      articlesPerSite: 20,
      imagesPerArticle: 2,
      linksPerArticle: 1,
      plansPerSite: 1,
      specialistTurnsPerSite: 15,
      visibilityPromptsPerSite: 10,
      visibilityChecksPerPrompt: 30,
    },
  },
];

function SliderRow({
  def,
  value,
  onChange,
}: {
  def: SliderDef;
  value: number;
  onChange: (n: number) => void;
}) {
  const id = `est-${def.key}`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {def.label}
        </label>
        <span className="tabular text-sm font-semibold text-ink">{value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={def.min}
        max={def.max}
        step={def.step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-paper-3 accent-[var(--signal)]"
      />
      <p className="text-[12px] leading-snug text-ink-3">{def.help}</p>
    </div>
  );
}

export function CostEstimator({ rates = DEFAULT_AI_RATES }: { rates?: AiPriceRates }) {
  const [input, setInput] = useState<CostEstimateInput>(PRESETS[2].values);
  const [preset, setPreset] = useState("dogfood");

  const estimate = useMemo(() => estimateMonthlyCost(rates, input), [rates, input]);

  const set = (key: keyof CostEstimateInput, n: number) => {
    setPreset("custom");
    setInput((prev) => ({ ...prev, [key]: n }));
  };

  const maxLine = Math.max(...estimate.lines.map((l) => l.usd), 0.01);

  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader
        title="¿Cuánto gastarías al mes?"
        intro="Mueve los sliders: el total es coste de API (Anthropic/OpenAI…), no el precio que cobras al cliente. Usa los mismos tipos que el registro real."
        className="px-4 py-3 sm:px-5"
      />

      <div className="flex flex-wrap gap-2 border-b border-line px-4 py-3 sm:px-5">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setPreset(p.id);
              setInput(p.values);
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-[12px] font-semibold transition",
              preset === p.id ? "bg-ink text-paper" : "bg-paper-2 text-ink-2 hover:bg-paper-3",
            )}
          >
            {p.label}
          </button>
        ))}
        {preset === "custom" && (
          <span className="rounded-full bg-signal-soft px-3 py-1.5 text-[12px] font-semibold text-signal">Personalizado</span>
        )}
      </div>

      <div className="grid gap-8 p-4 sm:p-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          {SLIDERS.map((def) => (
            <SliderRow key={def.key} def={def} value={input[def.key]} onChange={(n) => set(def.key, n)} />
          ))}
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl border border-line bg-paper-2/80 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Estimación mensual</p>
            <p className="mt-2 font-display text-4xl tabular tracking-tight text-ink">{usd(estimate.totalUsd)}</p>
            <p className="mt-1 text-sm text-ink-2">
              ≈ {eur(estimate.totalEur)} · {usd(estimate.perSiteUsd)} por sitio
            </p>

            <ul className="mt-5 space-y-3">
              {estimate.lines.map((line) => (
                <li key={line.id}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-[13px]">
                    <span className="font-medium text-ink">{line.label}</span>
                    <span className="tabular font-semibold">{usd(line.usd)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-paper-3">
                    <div
                      className="h-full rounded-full bg-signal transition-[width] duration-300"
                      style={{ width: `${Math.min(100, (line.usd / maxLine) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-ink-3">{line.detail}</p>
                </li>
              ))}
            </ul>

            <div className="mt-5 space-y-2 rounded-xl border border-line bg-card p-3 text-[12px] leading-relaxed text-ink-2">
              <p>
                <strong className="text-ink">Qué es esto:</strong> gasto nuestro en APIs si publicas ese volumen. Si Semilla cobra ~67 €/mes y el coste API de un sitio Semilla queda en unos pocos dólares, el margen cubre producto, soporte y margen.
              </p>
              <p>
                <strong className="text-ink">Qué no incluye:</strong> Vercel, Supabase, Stripe, tu tiempo, ni fallos/reintentos. Los tokens reales varían; esto usa medias conservadoras.
              </p>
              <p>
                Tarifas: Claude {rates.claudeInputPerMTok}/{rates.claudeOutputPerMTok} $/MTok · imagen {rates.openaiImageUsd} $ · EUR={rates.usdEurRate}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
