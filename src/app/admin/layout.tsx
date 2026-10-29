import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasEncryptionKey } from "@/lib/crypto";
import { hasClaude, hasStripe, isDemo } from "@/lib/env";
import { getAdmin } from "@/lib/admin/guard";
import { IMPERSONATE_COOKIE } from "@/lib/admin/constants";
import { AdminShell } from "@/components/admin/AdminShell";
import { stopImpersonation } from "./actions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · yeswecontent" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // El middleware ya filtra, pero verificamos de nuevo en servidor.
  const admin = await getAdmin();
  if (!admin) redirect(isDemo ? "/" : "/panel");

  const impersonating = (await cookies()).get(IMPERSONATE_COOKIE)?.value;
  const banner = impersonating ? (
    <div role="status" className="flex flex-wrap items-center justify-between gap-2 border-b border-signal-2 bg-signal px-4 py-2 text-[13px] font-medium text-signal-ink sm:px-6 lg:px-8">
      <span>
        Suplantación activa: <code className="rounded bg-black/15 px-1 font-mono">{impersonating}</code>. Todo lo que hagas en /panel se hará como ese usuario.
      </span>
      <form action={stopImpersonation}>
        <button type="submit" className="inline-flex h-8 items-center rounded-lg bg-ink px-3 text-xs font-semibold text-paper hover:bg-ink-2">
          Terminar suplantación
        </button>
      </form>
    </div>
  ) : null;

  const env = [
    { label: "Supabase", ok: !isDemo },
    { label: "Stripe", ok: hasStripe },
    { label: "IA", ok: hasClaude || !!process.env.OPENAI_API_KEY || !!process.env.GEMINI_API_KEY },
    { label: "Cron", ok: !!process.env.CRON_SECRET },
    { label: "Enc", ok: hasEncryptionKey() },
    { label: "OAuth", ok: !!process.env.OAUTH_STATE_SECRET },
  ];

  return (
    <AdminShell email={admin.email} demo={isDemo} env={env} banner={banner}>
      {children}
    </AdminShell>
  );
}
