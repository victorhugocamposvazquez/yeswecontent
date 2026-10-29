import "server-only";
import { DEFAULT_AI_RATES, type AiPriceRates } from "./pricing";

function rate(envKey: string, fallback: number) {
  const n = Number(process.env[envKey]);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Tarifas efectivas desde env (para el estimador y el registro). */
export function getAiPriceRates(): AiPriceRates {
  return {
    claudeInputPerMTok: rate("AI_PRICE_CLAUDE_INPUT_PER_MTOK", DEFAULT_AI_RATES.claudeInputPerMTok),
    claudeOutputPerMTok: rate("AI_PRICE_CLAUDE_OUTPUT_PER_MTOK", DEFAULT_AI_RATES.claudeOutputPerMTok),
    openaiInputPerMTok: rate("AI_PRICE_OPENAI_INPUT_PER_MTOK", DEFAULT_AI_RATES.openaiInputPerMTok),
    openaiOutputPerMTok: rate("AI_PRICE_OPENAI_OUTPUT_PER_MTOK", DEFAULT_AI_RATES.openaiOutputPerMTok),
    openaiImageUsd: rate("AI_PRICE_OPENAI_IMAGE_USD", DEFAULT_AI_RATES.openaiImageUsd),
    usdEurRate: rate("AI_USD_EUR_RATE", DEFAULT_AI_RATES.usdEurRate),
  };
}
