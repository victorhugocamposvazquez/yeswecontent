/**
 * Search Console (searchAnalytics) y Google Analytics 4 (Admin + Data API) con fetch.
 */
import "server-only";
import { readJson } from "@/lib/oauth/providers";

const auth = (token: string) => ({ authorization: `Bearer ${token}`, "content-type": "application/json" });

/* ───────── Listados para elegir propiedad ───────── */

export interface GscSite {
  siteUrl: string;
  permissionLevel: string;
}

export async function listSearchConsoleSites(token: string): Promise<GscSite[]> {
  const r = await readJson<{ siteEntry?: GscSite[] }>(await fetch("https://www.googleapis.com/webmasters/v3/sites", { headers: auth(token), cache: "no-store" }), "Search Console");
  return (r.siteEntry ?? []).filter((s) => s.permissionLevel !== "siteUnverifiedUser").sort((a, b) => a.siteUrl.localeCompare(b.siteUrl));
}

export interface Ga4Property {
  property: string; // "properties/123456"
  displayName: string;
  account: string;
}

export async function listGa4Properties(token: string): Promise<Ga4Property[]> {
  const out: Ga4Property[] = [];
  let pageToken = "";
  for (let i = 0; i < 10; i++) {
    const url = `https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
    const r = await readJson<{ accountSummaries?: { displayName: string; propertySummaries?: { property: string; displayName: string }[] }[]; nextPageToken?: string }>(
      await fetch(url, { headers: auth(token), cache: "no-store" }),
      "Google Analytics",
    );
    for (const a of r.accountSummaries ?? []) for (const p of a.propertySummaries ?? []) out.push({ property: p.property, displayName: p.displayName, account: a.displayName });
    if (!r.nextPageToken) break;
    pageToken = r.nextPageToken;
  }
  return out;
}

/** Elige la propiedad de Search Console que mejor encaja con la URL del sitio. */
export function guessGscProperty(sites: GscSite[], siteUrl: string): string | null {
  let host = "";
  try {
    host = new URL(siteUrl).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
  return sites.find((s) => s.siteUrl === `sc-domain:${host}`)?.siteUrl ?? sites.find((s) => s.siteUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") === host)?.siteUrl ?? null;
}

/* ───────── Search Console: searchAnalytics.query ───────── */

interface GscRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

async function gscQuery(token: string, property: string, body: Record<string, unknown>): Promise<GscRow[]> {
  const r = await readJson<{ rows?: GscRow[] }>(
    await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, {
      method: "POST",
      headers: auth(token),
      body: JSON.stringify({ dataState: "all", ...body }),
      cache: "no-store",
    }),
    "Search Console",
  );
  return r.rows ?? [];
}

export async function gscDaily(token: string, property: string, startDate: string, endDate: string) {
  const rows = await gscQuery(token, property, { startDate, endDate, dimensions: ["date"], rowLimit: 1000 });
  return rows.map((r) => ({ date: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }));
}

export async function gscTop(token: string, property: string, dimension: "query" | "page", startDate: string, endDate: string, rowLimit = 25) {
  const rows = await gscQuery(token, property, { startDate, endDate, dimensions: [dimension], rowLimit });
  return rows.map((r) => ({ key: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: Math.round(r.position * 10) / 10 }));
}

/* ───────── GA4: runReport ───────── */

/** Asistentes de IA detectados por el origen de la sesión. */
export const AI_REFERRERS: { source: string; label: string }[] = [
  { source: "chatgpt.com", label: "ChatGPT" },
  { source: "chat.openai.com", label: "ChatGPT" },
  { source: "perplexity.ai", label: "Perplexity" },
  { source: "gemini.google.com", label: "Gemini" },
  { source: "claude.ai", label: "Claude" },
  { source: "copilot.microsoft.com", label: "Copilot" },
];

export const aiLabelFor = (source: string) => AI_REFERRERS.find((r) => source.toLowerCase().includes(r.source))?.label ?? null;

interface Ga4Report {
  rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[];
}

async function runReport(token: string, property: string, body: Record<string, unknown>): Promise<Ga4Report> {
  const id = property.replace(/^properties\//, "");
  return readJson<Ga4Report>(
    await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(id)}:runReport`, { method: "POST", headers: auth(token), body: JSON.stringify(body), cache: "no-store" }),
    "Google Analytics",
  );
}

const ga4Date = (d: string) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;

export async function ga4SessionsByDay(token: string, property: string, startDate: string, endDate: string) {
  const r = await runReport(token, property, { dateRanges: [{ startDate, endDate }], dimensions: [{ name: "date" }], metrics: [{ name: "sessions" }], limit: 1000 });
  return (r.rows ?? []).map((row) => ({ date: ga4Date(row.dimensionValues[0].value), sessions: Number(row.metricValues[0].value) || 0 }));
}

export async function ga4AiSessions(token: string, property: string, startDate: string, endDate: string) {
  const r = await runReport(token, property, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "date" }, { name: "sessionSource" }],
    metrics: [{ name: "sessions" }],
    dimensionFilter: {
      orGroup: { expressions: AI_REFERRERS.map((a) => ({ filter: { fieldName: "sessionSource", stringFilter: { matchType: "CONTAINS", value: a.source, caseSensitive: false } } })) },
    },
    limit: 10000,
  });
  return (r.rows ?? []).map((row) => ({ date: ga4Date(row.dimensionValues[0].value), source: row.dimensionValues[1].value, sessions: Number(row.metricValues[0].value) || 0 }));
}
