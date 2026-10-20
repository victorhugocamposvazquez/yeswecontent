import type { BacklinkPrefs } from "@/lib/types";

/** Una web de la red, ya con su saldo y su cupo mensual calculados. */
export interface NetworkSite {
  id: string;
  url: string;
  name: string;
  niche: string | null;
  description: string | null;
  language: string;
  domain_rating: number | null;
  prefs: BacklinkPrefs;
  /** Saldo de créditos (incluye los de bienvenida). */
  balance: number;
  /** Enlaces recibidos permitidos al mes (plans.backlink_credits). */
  monthly_cap: number;
  received_this_month: number;
  workspace_id: string;
}

export interface NetworkPage {
  site_id: string;
  url: string;
  title: string;
  keyword?: string | null;
  cluster?: string | null;
}

/** Enlace a una web de la red ya insertado en el texto, pendiente de registrar. */
export interface BacklinkPlacement {
  target_site_id: string;
  target_url: string;
  target_title: string;
  partner_domain: string;
  anchor: string;
  /** DR de la web que da el enlace (la del artículo). */
  domain_rating: number | null;
  relevance: number;
  shared_terms: string[];
}

/** Créditos de bienvenida para empezar a recibir enlaces antes de dar ninguno. */
export const WELCOME_CREDITS = 3;
