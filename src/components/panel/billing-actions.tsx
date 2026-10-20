"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui";

async function post(url: string, body: unknown): Promise<{ url?: string | null; error?: string; demo?: boolean }> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return res.json().catch(() => ({ error: `Error ${res.status}` }));
}

/** Botón que abre el portal de cliente de Stripe (lo crea /api/stripe/portal). */
export function PortalButton({ label = "Gestionar pago y facturas", variant = "ink" }: { label?: string; variant?: "primary" | "ink" | "outline" | "ghost" }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col gap-1">
      <Button
        type="button"
        variant={variant}
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setMsg(null);
          try {
            const r = await post("/api/stripe/portal", { returnPath: "/panel/ajustes/facturacion" });
            if (r.url) window.location.href = r.url;
            else setMsg(r.demo ? "En modo demo no hay portal de pago." : r.error ?? "No se ha podido abrir el portal.");
          } catch {
            setMsg("No se ha podido abrir el portal.");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />} {label}
      </Button>
      <span role="status" className="text-xs text-ink-3">
        {msg}
      </span>
    </span>
  );
}

/** Cambia de plan / intervalo pasando por /api/stripe/checkout. */
export function ChoosePlanButton({ planId, interval, siteId, label, variant = "primary", fallbackPath }: { planId: string; interval: "month" | "year"; siteId?: string; label: string; variant?: "primary" | "ink" | "outline" | "ghost"; fallbackPath?: string }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  return (
    <span className="inline-flex flex-col gap-1">
      <Button
        type="button"
        variant={variant}
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setMsg(null);
          try {
            const uuid = siteId && /^[0-9a-f-]{36}$/i.test(siteId) ? siteId : undefined;
            const r = await post("/api/stripe/checkout", { planId, interval, siteId: uuid });
            if (r.url) {
              window.location.href = r.url;
              return;
            }
            if (fallbackPath) router.push(fallbackPath);
            else setMsg(r.demo ? "Modo demo: no se ha cambiado el plan." : r.error ?? "No se ha podido iniciar el pago.");
          } catch {
            if (fallbackPath) router.push(fallbackPath);
            else setMsg("No se ha podido iniciar el pago.");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />} {label}
      </Button>
      {msg && (
        <span role="status" className="text-xs text-ink-3">
          {msg}
        </span>
      )}
    </span>
  );
}
