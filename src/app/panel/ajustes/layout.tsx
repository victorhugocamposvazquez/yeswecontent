import { SettingsNav } from "@/components/panel/settings-nav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 className="mb-6 font-display text-4xl">Ajustes</h1>
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <SettingsNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
