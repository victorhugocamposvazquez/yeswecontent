import { getAdmin } from "@/lib/admin/guard";
import { listLeads } from "@/lib/admin/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Escapa una celda CSV y neutraliza fórmulas (=, +, -, @) al abrir en hojas de cálculo. */
const cell = (v: string | null) => {
  let s = v ?? "";
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** GET /api/admin/leads.csv?tool=&q= → CSV de leads de herramientas gratuitas. */
export async function GET(req: Request) {
  if (!(await getAdmin())) return new Response("No autorizado", { status: 403 });
  const url = new URL(req.url);
  const tool = url.searchParams.get("tool") ?? "";
  const q = (url.searchParams.get("q") ?? "").toLowerCase();
  const rows = (await listLeads()).filter(
    (l) => (!tool || l.tool === tool) && (!q || (l.email ?? "").toLowerCase().includes(q) || (l.url ?? "").toLowerCase().includes(q)),
  );
  const csv = ["fecha,email,url,herramienta", ...rows.map((l) => [l.created_at, l.email, l.url, l.tool].map(cell).join(","))].join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-yeswecontent-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
