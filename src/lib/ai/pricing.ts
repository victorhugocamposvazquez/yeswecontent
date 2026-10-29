/**
 * Tarifas y supuestos de coste interno (compartido servidor/cliente).
 * Los valores de env solo se leen en servidor y se pasan al estimador.
 */

export type AiPriceRates = {
  claudeInputPerMTok: number;
  claudeOutputPerMTok: number;
  openaiInputPerMTok: number;
  openaiOutputPerMTok: number;
  openaiImageUsd: number;
  usdEurRate: number;
};

export const DEFAULT_AI_RATES: AiPriceRates = {
  claudeInputPerMTok: 3,
  claudeOutputPerMTok: 15,
  openaiInputPerMTok: 0.15,
  openaiOutputPerMTok: 0.6,
  openaiImageUsd: 0.04,
  usdEurRate: 0.92,
};

/** Tokens medios por unidad de trabajo (medidos / estimados; se explican en la UI). */
export const USAGE_UNITS = {
  article: { in: 8_000, out: 6_000, label: "Artículo completo (Claude)" },
  imageBrief: { in: 1_200, out: 800, label: "Brief de prompts de imagen (Claude)" },
  plan: { in: 4_000, out: 5_000, label: "Plan editorial del mes (Claude)" },
  linkSentence: { in: 900, out: 200, label: "Frase de enlace (Claude)" },
  specialistTurn: { in: 2_500, out: 1_800, label: "Turno del especialista (Claude)" },
  visibilityClaude: { in: 400, out: 700, label: "Comprobación visibilidad · Claude" },
  visibilityChat: { in: 400, out: 700, label: "Comprobación visibilidad · chat barato" },
} as const;

export function claudeUsd(rates: AiPriceRates, inputTokens: number, outputTokens: number) {
  return (inputTokens / 1_000_000) * rates.claudeInputPerMTok + (outputTokens / 1_000_000) * rates.claudeOutputPerMTok;
}

export function openaiChatUsd(rates: AiPriceRates, inputTokens: number, outputTokens: number) {
  return (inputTokens / 1_000_000) * rates.openaiInputPerMTok + (outputTokens / 1_000_000) * rates.openaiOutputPerMTok;
}

export type CostEstimateInput = {
  sites: number;
  articlesPerSite: number;
  imagesPerArticle: number;
  linksPerArticle: number;
  plansPerSite: number;
  specialistTurnsPerSite: number;
  visibilityPromptsPerSite: number;
  /** Comprobaciones por prompt al mes (p. ej. 30 = diaria). */
  visibilityChecksPerPrompt: number;
};

export type CostEstimateLine = { id: string; label: string; detail: string; usd: number };

export type CostEstimate = {
  lines: CostEstimateLine[];
  totalUsd: number;
  totalEur: number;
  perSiteUsd: number;
};

export function estimateMonthlyCost(rates: AiPriceRates, input: CostEstimateInput): CostEstimate {
  const s = Math.max(0, input.sites);
  const arts = Math.max(0, input.articlesPerSite) * s;
  const images = arts * Math.max(0, input.imagesPerArticle);
  const links = arts * Math.max(0, input.linksPerArticle);
  const plans = Math.max(0, input.plansPerSite) * s;
  const specialist = Math.max(0, input.specialistTurnsPerSite) * s;
  const visPrompts = Math.max(0, input.visibilityPromptsPerSite) * s;
  const visChecks = visPrompts * Math.max(0, input.visibilityChecksPerPrompt);

  const u = USAGE_UNITS;
  const articleUsd = arts * claudeUsd(rates, u.article.in, u.article.out);
  const briefUsd = arts * claudeUsd(rates, u.imageBrief.in, u.imageBrief.out); // un brief por artículo
  const imageUsd = images * rates.openaiImageUsd;
  const linkUsd = links * claudeUsd(rates, u.linkSentence.in, u.linkSentence.out);
  const planUsd = plans * claudeUsd(rates, u.plan.in, u.plan.out);
  const specialistUsd = specialist * claudeUsd(rates, u.specialistTurn.in, u.specialistTurn.out);
  // Visibilidad: Claude + 3 chats baratos por comprobación
  const visUsd =
    visChecks * claudeUsd(rates, u.visibilityClaude.in, u.visibilityClaude.out) +
    visChecks * 3 * openaiChatUsd(rates, u.visibilityChat.in, u.visibilityChat.out);

  const lines: CostEstimateLine[] = [
    {
      id: "articles",
      label: "Redacción de artículos",
      detail: `${arts} artículos × ~${(u.article.in + u.article.out) / 1000}k tokens Claude`,
      usd: articleUsd,
    },
    {
      id: "briefs",
      label: "Briefs de imagen",
      detail: `${arts} briefs (Claude pide prompts/alt)`,
      usd: briefUsd,
    },
    {
      id: "images",
      label: "Imágenes generadas",
      detail: `${images} imágenes × ${rates.openaiImageUsd.toFixed(2)} $`,
      usd: imageUsd,
    },
    {
      id: "links",
      label: "Frases de enlace",
      detail: `${links} inserciones en red de backlinks`,
      usd: linkUsd,
    },
    {
      id: "plans",
      label: "Planes editoriales",
      detail: `${plans} generaciones de plan del mes`,
      usd: planUsd,
    },
    {
      id: "specialist",
      label: "Especialista SEO",
      detail: `${specialist} turnos de chat con herramientas`,
      usd: specialistUsd,
    },
    {
      id: "visibility",
      label: "Visibilidad en IA",
      detail: `${visChecks} comprobaciones (Claude + ChatGPT + Gemini + Perplexity)`,
      usd: visUsd,
    },
  ].filter((l) => l.usd > 0 || arts + images + plans + specialist + visChecks > 0);

  const totalUsd = lines.reduce((a, l) => a + l.usd, 0);
  return {
    lines,
    totalUsd,
    totalEur: totalUsd * rates.usdEurRate,
    perSiteUsd: s > 0 ? totalUsd / s : 0,
  };
}
