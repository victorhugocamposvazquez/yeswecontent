import type { InvoiceStatus, VisibilityMode } from "./types";

export const money = (cents: number, currency = "EUR") =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency, minimumFractionDigits: 2 }).format(cents / 100);

export const INVOICE_STATUS: Record<InvoiceStatus, { label: string; tone: "neutral" | "ok" | "warn" | "bad" | "sky" }> = {
  draft: { label: "Borrador", tone: "neutral" },
  sent: { label: "Pendiente de pago", tone: "warn" },
  paid: { label: "Pagada", tone: "ok" },
  void: { label: "Anulada", tone: "bad" },
};

export const VISIBILITY_MODE: Record<VisibilityMode, { label: string; hint: string }> = {
  resultados: { label: "Solo resultados", hint: "Ve tráfico, visibilidad en IA, informes y facturas. Sin acceso al plan ni a los artículos." },
  completo: { label: "Acceso completo", hint: "Además de los resultados, consulta el plan de contenidos y cada artículo (solo lectura)." },
};

export const host = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");
