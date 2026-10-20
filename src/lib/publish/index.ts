/**
 * Publicación en CMS: un único punto de entrada para todos los adaptadores.
 *   const res = await publish(article, { provider: "wordpress", config: {...} })
 */
import "server-only";
import { publishGhost } from "./ghost";
import { publishShopify } from "./shopify";
import { publishWebflow } from "./webflow";
import { publishWebhook } from "./webhook";
import { publishWordpress } from "./wordpress";
import type { IntegrationConfig, PublishResult, PublishableArticle } from "./types";

export * from "./types";

export async function publish(article: PublishableArticle, integration: IntegrationConfig): Promise<PublishResult> {
  try {
    switch (integration.provider) {
      case "wordpress":
        return await publishWordpress(article, integration.config);
      case "shopify":
        return await publishShopify(article, integration.config);
      case "webflow":
        return await publishWebflow(article, integration.config);
      case "ghost":
        return await publishGhost(article, integration.config);
      case "webhook":
        return await publishWebhook(article, integration.config);
    }
  } catch (e) {
    return { ok: false, url: null, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Convierte una fila de `integrations` en una configuración tipada (o null si no es un CMS). */
export function toIntegrationConfig(row: { provider: string; config: unknown }): IntegrationConfig | null {
  const providers = ["wordpress", "shopify", "webflow", "ghost", "webhook"];
  if (!providers.includes(row.provider) || !row.config || typeof row.config !== "object") return null;
  return { provider: row.provider, config: row.config } as IntegrationConfig;
}
