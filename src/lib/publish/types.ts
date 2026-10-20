import type { Article } from "@/lib/types";
import type { GithubConfig } from "./github";

export type Provider = "wordpress" | "shopify" | "webflow" | "ghost" | "webhook" | "github";
export const CMS_PROVIDERS: Provider[] = ["wordpress", "shopify", "webflow", "ghost", "webhook", "github"];

/** Lo mínimo que necesita un adaptador para publicar. */
export type PublishableArticle = Pick<Article, "id" | "title" | "slug" | "meta_description" | "body_md" | "faq" | "cover_url" | "language"> & {
  schema_jsonld?: Record<string, unknown> | null;
  images?: Article["images"] | null;
};

export interface WordpressConfig { url: string; username: string; app_password: string; status?: "publish" | "draft"; category_id?: number }
export interface ShopifyConfig { shop: string; access_token: string; blog_id: string; api_version?: string; author?: string }
export interface WebflowConfig { token: string; collection_id: string; live?: boolean; field_map?: Partial<Record<"name" | "slug" | "body" | "summary" | "image", string>> }
export interface GhostConfig { url: string; admin_key: string; status?: "published" | "draft" }
export interface WebhookConfig { url: string; secret: string }

export type IntegrationConfig =
  | { provider: "wordpress"; config: WordpressConfig }
  | { provider: "shopify"; config: ShopifyConfig }
  | { provider: "webflow"; config: WebflowConfig }
  | { provider: "ghost"; config: GhostConfig }
  | { provider: "webhook"; config: WebhookConfig }
  | { provider: "github"; config: GithubConfig };

export interface PublishResult { ok: boolean; url: string | null; externalId?: string; error?: string }

export class PublishError extends Error {}
