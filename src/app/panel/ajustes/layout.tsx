import { SettingsNav } from "@/components/panel/settings-nav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mb-4 lg:mb-6">
        <h1 className="text-[1.65rem] font-semibold tracking-tight md:text-[1.9rem]">Ajustes</h1>
        <p className="mt-1 text-sm text-ink-2">Tu cuenta, cómo escribimos y dónde publicamos.</p>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[208px_minmax(0,1fr)] lg:gap-8">
        <aside className="min-w-0 lg:sticky lg:top-[72px] lg:h-fit">
          <SettingsNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
