import { hasEncryptionKey } from "@/lib/crypto";

/** Aviso si faltan claves de servidor necesarias para CMS cifrado u OAuth. */
export function IntegrationKeysBanner({ className }: { className?: string }) {
  const enc = hasEncryptionKey();
  const oauth = !!process.env.OAUTH_STATE_SECRET;
  if (enc && oauth) return null;
  const missing = [!enc && "INTEGRATIONS_ENCRYPTION_KEY", !oauth && "OAUTH_STATE_SECRET"].filter(Boolean);
  return (
    <p role="status" className={className ?? "mb-5 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-ink"}>
      Falta configurar en Vercel/.env: <code className="rounded bg-black/10 px-1 font-mono text-[12px]">{missing.join(", ")}</code>. Sin eso no se pueden conectar CMS con credenciales cifradas ni OAuth (Google/Meta/Reddit).
    </p>
  );
}
