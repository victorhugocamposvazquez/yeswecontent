"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { ConnectionsList, OAuthNotice } from "@/components/panel/connections";
import { loadConnections } from "@/app/panel/integration-actions";
import type { ConnectionDetails } from "@/lib/oauth/connection-types";

export interface OAuthReturn {
  provider: string;
  estado: string;
  motivo?: string;
}

/** Paso «Conexiones» del onboarding: OAuth real (o simulado en demo) con selector de propiedad y página. */
export function ConnectionsStep({
  siteId,
  demo,
  oauth,
  keysReady = true,
}: {
  siteId: string | null;
  demo: boolean;
  oauth: OAuthReturn | null;
  /** false si faltan INTEGRATIONS_ENCRYPTION_KEY u OAUTH_STATE_SECRET en el servidor. */
  keysReady?: boolean;
}) {
  const [details, setDetails] = useState<ConnectionDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  // En demo recordamos lo "conectado" durante la sesión del asistente.
  const [simulated, setSimulated] = useState<string[]>([]);

  useEffect(() => {
    if (demo && oauth?.estado === "ok") setSimulated((s) => (s.includes(oauth.provider) ? s : [...s, oauth.provider]));
  }, [demo, oauth]);

  const reload = useCallback(() => {
    loadConnections(siteId, simulated)
      .then((d) => {
        setDetails(d);
        setError(null);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "No hemos podido cargar tus conexiones."));
  }, [siteId, simulated]);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <div className="space-y-3">
      {!demo && !keysReady && (
        <p role="status" className="rounded-xl border border-warn/30 bg-warn-soft px-3.5 py-2.5 text-[13px] text-ink">
          Faltan <code className="rounded bg-black/10 px-1 font-mono text-[12px]">INTEGRATIONS_ENCRYPTION_KEY</code> o{" "}
          <code className="rounded bg-black/10 px-1 font-mono text-[12px]">OAUTH_STATE_SECRET</code> en el servidor. Configúralas en Vercel/.env antes de conectar CMS u OAuth.
        </p>
      )}
      {oauth && <OAuthNotice provider={oauth.provider} estado={oauth.estado} motivo={oauth.motivo} demo={demo} />}
      {!siteId && !demo ? (
        <p className="text-sm text-ink-2">Primero indica tu web en el primer paso.</p>
      ) : error ? (
        <p className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>
      ) : !details ? (
        <p className="flex items-center gap-2 py-6 text-sm text-ink-3">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Cargando tus conexiones…
        </p>
      ) : (
        <ConnectionsList details={details} siteId={siteId} returnTo="/onboarding" show={["google", "meta", "reddit"]} onChange={reload} />
      )}
      <p className="text-xs text-ink-3">
        Solo pedimos los permisos imprescindibles y nunca publicamos nada sin tu aprobación. Quora no tiene API de publicación: te prepararemos respuestas para copiarlas en un clic.
      </p>
    </div>
  );
}
