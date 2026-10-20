/** Saldo y movimientos de créditos de la red de enlaces de una web. */
import "server-only";
import { isDemo } from "@/lib/env";
import * as demo from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";
import type { BacklinkLink, CreditEntry } from "@/lib/types";
import { WELCOME_CREDITS } from "./types";

export interface CreditSummary {
  balance: number;
  /** Enlaces que puede recibir al mes según su plan. */
  monthly_cap: number;
  received_this_month: number;
  earned: number;
  spent: number;
  ledger: CreditEntry[];
}

const monthStart = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
};

function demoLedger(links: BacklinkLink[], firstAt: string): CreditEntry[] {
  const rows: CreditEntry[] = [{ id: "c_welcome", delta: WELCOME_CREDITS, reason: "welcome", note: "Créditos de bienvenida a la red", created_at: firstAt }];
  for (const l of [...links].reverse()) {
    rows.push(
      l.direction === "given"
        ? { id: `c_${l.id}`, delta: 1, reason: "earned", note: `Enlace dado a ${l.partner_domain}`, created_at: l.created_at }
        : { id: `c_${l.id}`, delta: -1, reason: "spent", note: `Enlace recibido de ${l.partner_domain} («${l.anchor}»)`, created_at: l.created_at },
    );
    if (l.status === "rejected" || l.status === "removed")
      rows.push({ id: `c_${l.id}_r`, delta: l.direction === "given" ? -1 : 1, reason: "refund", note: `Enlace ${l.status === "rejected" ? "rechazado" : "retirado"}`, created_at: l.created_at });
  }
  return rows.reverse();
}

export async function getCreditSummary(siteId: string, monthlyCap: number, links: BacklinkLink[]): Promise<CreditSummary> {
  const since = monthStart();
  const received_this_month = links.filter((l) => l.direction === "received" && ["pending", "live"].includes(l.status) && l.created_at >= since).length;
  let ledger: CreditEntry[];
  if (isDemo) {
    // En demo hay más enlaces que los visibles: los de meses anteriores ya están en el saldo.
    const extra: CreditEntry[] = [
      { id: "c_hist1", delta: 9, reason: "earned", note: "Enlaces dados en meses anteriores (9)", created_at: "2026-09-01T09:00:00Z" },
      { id: "c_hist2", delta: -6, reason: "spent", note: "Enlaces recibidos en meses anteriores (6)", created_at: "2026-09-01T09:00:00Z" },
    ];
    ledger = [...demoLedger(links, demo.demoSite.created_at), ...extra].sort((a, b) => b.created_at.localeCompare(a.created_at));
  } else {
    try {
      const sb = await createClient();
      const { data } = await sb.from("backlink_credits").select("id, delta, reason, note, created_at").eq("site_id", siteId).order("created_at", { ascending: false }).limit(500);
      ledger = (data ?? []) as CreditEntry[];
      if (!ledger.length) ledger = [{ id: "c_welcome", delta: WELCOME_CREDITS, reason: "welcome", note: "Créditos de bienvenida (se activan con tu primer intercambio)", created_at: new Date().toISOString() }];
    } catch {
      ledger = [];
    }
  }
  const balance = ledger.reduce((a, r) => a + r.delta, 0);
  const earned = ledger.filter((r) => r.reason === "earned").reduce((a, r) => a + r.delta, 0);
  const spent = -ledger.filter((r) => r.reason === "spent").reduce((a, r) => a + r.delta, 0);
  return { balance, monthly_cap: monthlyCap, received_this_month, earned, spent, ledger };
}
