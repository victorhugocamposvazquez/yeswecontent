import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDemo } from "@/lib/env";
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
    <div role="status" className="flex flex-wrap items-center justify-between gap-2 bg-signal px-4 py-2 text-sm font-medium text-signal-ink sm:px-6 lg:px-10">
      <span>
        Suplantación activa: <code className="font-mono">{impersonating}</code>. Todo lo que hagas en /panel se hará como ese usuario.
      </span>
      <form action={stopImpersonation}>
        <button type="submit" className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-paper hover:bg-ink-2">
          Terminar suplantación
        </button>
      </form>
    </div>
  ) : null;

  return (
    <AdminShell email={admin.email} demo={isDemo} banner={banner}>
      {children}
    </AdminShell>
  );
}
