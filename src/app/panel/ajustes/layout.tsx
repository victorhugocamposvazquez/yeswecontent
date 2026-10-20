import { SettingsNav } from "@/components/panel/settings-nav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 className="mb-4 text-2xl lg:mb-6 font-semibold tracking-tight">Ajustes</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <aside className="min-w-0 lg:sticky lg:top-20 lg:h-fit">
          <SettingsNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
