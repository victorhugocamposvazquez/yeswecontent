import type { AiCheck, Article, ContentItem, Site, TrafficPoint } from "@/lib/types";

export type VisibilityMode = "resultados" | "completo";
export type InvoiceStatus = "draft" | "sent" | "paid" | "void";

export interface WhiteLabel {
  logo_url?: string;
  primary_color?: string;
  custom_domain?: string;
  brand_name?: string;
  support_email?: string;
}

export interface Agency {
  id: string;
  name: string;
  white_label: WhiteLabel;
}

export interface AgencyClient {
  site_id: string;
  agency_workspace_id: string;
  client_name: string;
  client_email: string;
  visibility_mode: VisibilityMode;
  price_cents: number;
  currency: string;
  booking_url: string | null;
  created_at: string;
}

export interface ClientInvoice {
  id: string;
  workspace_id: string;
  site_id: string;
  number: string;
  concept: string;
  amount_cents: number;
  currency: string;
  status: InvoiceStatus;
  issued_at: string;
  due_at: string | null;
  pdf_url: string | null;
}

export interface ClientMessage {
  id: string;
  site_id: string;
  author_name: string;
  author_side: "agency" | "client";
  body: string;
  created_at: string;
}

export interface ClientMember {
  id: string;
  site_id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "member";
  status: "invited" | "active";
  invited_at: string;
}

export interface ClientBrandKit {
  logo_url?: string;
  colors?: string[];
  fonts?: string;
  guidelines?: string;
  do?: string[];
  dont?: string[];
}

export interface ClientSiteSettings {
  site_id: string;
  brand: ClientBrandKit;
  custom_domain: string | null;
  domain_verified_at: string | null;
}

/** Todo lo que el portal necesita para pintar una pantalla. */
export interface PortalContext {
  agency: Agency;
  client: AgencyClient;
  site: Site;
  viewer: { id: string | null; name: string; email: string };
  /** La agencia está viendo el portal como su cliente. */
  preview: boolean;
}

export interface PortalResults {
  traffic: TrafficPoint[];
  articles: Article[];
  items: ContentItem[];
  checks: AiCheck[];
  analyticsConnected: boolean;
}

export interface AgencyClientRow extends AgencyClient {
  site: Pick<Site, "id" | "name" | "url">;
  published_this_month: number;
  last_invoice: Pick<ClientInvoice, "number" | "status" | "amount_cents" | "issued_at"> | null;
  members: number;
}
