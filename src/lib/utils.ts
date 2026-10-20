import clsx, { type ClassValue } from "clsx";

export const cn = (...v: ClassValue[]) => clsx(v);

export const eur = (cents: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(cents / 100);

export const num = (n: number) => new Intl.NumberFormat("es-ES").format(n);

export const fmtDate = (d: string | Date, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) =>
  new Intl.DateTimeFormat("es-ES", opts).format(typeof d === "string" ? new Date(d) : d);

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);
