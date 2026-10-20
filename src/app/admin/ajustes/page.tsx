import { Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { getSettings } from "@/lib/admin/data";
import { hasClaude, hasStripe, isDemo } from "@/lib/env";
import { cn } from "@/lib/utils";
import { saveSettings } from "../actions";

export const metadata = { title: "Ajustes" };

function EnvRow({ label, ok, hint }: { label: string; ok: boolean; hint: string }) {
  return (
    <li className="flex items-start justify-between gap-3 py-2.5">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-ink-3">{hint}</p>
      </div>
      <span className={cn("mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", ok ? "bg-ok/12 text-ok" : "bg-paper-2 text-ink-3")}>
        {ok ? "Configurado" : "Sin configurar"}
      </span>
    </li>
  );
}

export default async function SettingsPage() {
  const s = await getSettings();
  const env = {
    openai: !!process.env.OPENAI_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    perplexity: !!process.env.PERPLEXITY_API_KEY,
    resend: !!process.env.RESEND_API_KEY,
    cron: !!process.env.CRON_SECRET,
    google: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
  };

  return (
    <>
      <PageHeader title="Ajustes globales" intro="Afectan a toda la plataforma y a todos los clientes. Cambia con cuidado." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem]">
        <Card className="p-5 sm:p-6">
          <ActionForm action={saveSettings} className="space-y-6">
            <section aria-labelledby="gen" className="rounded-xl border border-line p-4">
              <h2 id="gen" className="font-semibold">
                Generación de artículos
              </h2>
              <p className="mb-3 text-sm text-ink-2">Interruptor de emergencia: al desactivarlo, el cron deja de redactar y publicar para todos los clientes.</p>
              <label htmlFor="generation_enabled" className="inline-flex cursor-pointer items-center gap-3 text-sm font-medium">
                <input
                  id="generation_enabled"
                  type="checkbox"
                  name="generation_enabled"
                  defaultChecked={s.generation_enabled}
                  role="switch"
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className="relative h-6 w-11 rounded-full bg-bad/70 transition after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:transition peer-checked:bg-ok peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-lime"
                />
                Generación activa
              </label>
            </section>

            <section aria-labelledby="ai" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <h2 id="ai" className="font-semibold sm:col-span-2">
                Modelo de IA por defecto
              </h2>
              <Field label="Proveedor" hint="Para estrategia y redacción. La visibilidad en IA consulta todos los modelos.">
                <Select name="ai_provider" defaultValue={s.ai_provider}>
                  <option value="claude">Claude (Anthropic)</option>
                  <option value="openai">GPT (OpenAI)</option>
                  <option value="gemini">Gemini (Google)</option>
                </Select>
              </Field>
              <Field label="ID de modelo (opcional)" hint="Déjalo vacío para usar el predeterminado del código.">
                <Input name="ai_model" defaultValue={s.ai_model} placeholder="p. ej. el último modelo estable" className="font-mono" />
              </Field>
            </section>

            <section aria-labelledby="banner">
              <h2 id="banner" className="mb-2 font-semibold">
                Aviso de mantenimiento
              </h2>
              <Field label="Texto del aviso" hint="Se muestra arriba en el panel de todos los clientes. Vacío = sin aviso. Máx. 280 caracteres.">
                <Textarea name="maintenance_banner" rows={3} maxLength={280} defaultValue={s.maintenance_banner} placeholder="Esta noche, de 23:00 a 23:30, la publicación automática se detendrá por mantenimiento." />
              </Field>
            </section>

            <div className="flex justify-end border-t border-line pt-4">
              <SubmitButton>Guardar ajustes</SubmitButton>
            </div>
          </ActionForm>
        </Card>

        <Card className="h-fit p-5">
          <h2 className="font-semibold">Integraciones del servidor</h2>
          <p className="text-sm text-ink-3">Variables de entorno detectadas (solo lectura).</p>
          <ul className="mt-2 divide-y divide-line text-sm">
            <EnvRow label="Supabase" ok={!isDemo} hint="Sin él, la app funciona en modo demo." />
            <EnvRow label="Claude" ok={hasClaude} hint="ANTHROPIC_API_KEY" />
            <EnvRow label="OpenAI" ok={env.openai} hint="OPENAI_API_KEY" />
            <EnvRow label="Gemini" ok={env.gemini} hint="GEMINI_API_KEY" />
            <EnvRow label="Perplexity" ok={env.perplexity} hint="PERPLEXITY_API_KEY" />
            <EnvRow label="Stripe" ok={hasStripe} hint="STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET" />
            <EnvRow label="Resend" ok={env.resend} hint="Emails transaccionales" />
            <EnvRow label="Google OAuth" ok={env.google} hint="Search Console y GA4" />
            <EnvRow label="Cron" ok={env.cron} hint="CRON_SECRET protege los endpoints programados" />
          </ul>
        </Card>
      </div>
    </>
  );
}
