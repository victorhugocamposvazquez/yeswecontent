import type { ReactNode } from "react";
import { SettingsNav } from "../_components/settings-nav";

export default function ClientSettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight sm:text-3xl">Ajustes</h1>
      </header>
      <SettingsNav />
      <div className="max-w-2xl">{children}</div>
    </div>
  );
}
