import { Badge, Card, CardHeader, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { DetailLayout, KeyValue, StickyBar } from "@/components/admin/table";
import { getSettings } from "@/lib/admin/data";
import { hasClaude, hasStripe, isDemo } from "@/lib/env";
import { saveSettings } from "../actions";

export const metadata = { title: "Ajustes" };

function EnvRow({ label, ok, hint }: { label: string; ok: boolean; hint: string }) {
  return (
    <li className="flex items-start justify-between gap-3 py-2 text-[13px]">
      <div className="min-w-0">
        <p className="font-medium">{label}</p>
        <p className="truncate font-mono text-[11px] text-ink-3">{hint}</p>
      </div>
      <Badge tone={ok ? "ok" : "neutral"} dot className="shrink-0">
        {ok ? "Configurado" : "Sin configurar"}
      </Badge>
    </li>
  );
}

const providerLabel = { claude: "Claude (Anthropic)", openai: "GPT (OpenAI)", gemini: "Gemini (Google)" } as const;

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
      <ActionForm action={saveSettings} className="[&>p[role=status]]:mt-3">
        <DetailLayout
          rail={
            <>
              <Card>
                <CardHeader title="Estado actual" className="px-4 py-3" />
                <div className="px-4 py-3">
                  <KeyValue
                    items={[
                      {
                        k: "Generación",
                        v: (
                          <Badge tone={s.generation_enabled ? "ok" : "bad"} dot>
                            {s.generation_enabled ? "Activa" : "Pausada"}
                          </Badge>
                        ),
                      },
                      { k: "Proveedor IA", v: providerLabel[s.ai_provider] },
                      { k: "Modelo", v: s.ai_model || "Predeterminado", mono: !!s.ai_model },
                      { k: "Aviso", v: s.maintenance_banner ? "Visible" : "Ninguno" },
                      { k: "Entorno", v: isDemo ? "Demo" : "Producción" },
                    ]}
                  />
                </div>
              </Card>
              <Card>
                <CardHeader title="Integraciones del servidor" intro="Variables de entorno detectadas (solo lectura)." className="px-4 py-3" />
                <ul className="divide-y divide-line px-4 py-1">
                  <EnvRow label="Supabase" ok={!isDemo} hint="Sin él, la app funciona en modo demo" />
                  <EnvRow label="Claude" ok={hasClaude} hint="ANTHROPIC_API_KEY" />
                  <EnvRow label="OpenAI" ok={env.openai} hint="OPENAI_API_KEY" />
                  <EnvRow label="Gemini" ok={env.gemini} hint="GEMINI_API_KEY" />
                  <EnvRow label="Perplexity" ok={env.perplexity} hint="PERPLEXITY_API_KEY" />
                  <EnvRow label="Stripe" ok={hasStripe} hint="STRIPE_SECRET_KEY · STRIPE_WEBHOOK_SECRET" />
                  <EnvRow label="Resend" ok={env.resend} hint="RESEND_API_KEY" />
                  <EnvRow label="Google OAuth" ok={env.google} hint="GOOGLE_CLIENT_ID · GOOGLE_CLIENT_SECRET" />
                  <EnvRow label="Cron" ok={env.cron} hint="CRON_SECRET" />
                </ul>
              </Card>
            </>
          }
        >
          <Card>
            <CardHeader title="Generación de artículos" intro="Interruptor de emergencia: al desactivarlo, el cron deja de redactar y publicar para todos los clientes." className="px-4 py-3 sm:px-5" />
            <div className="px-4 py-4 sm:px-5">
              <label htmlFor="generation_enabled" className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-[13px] font-medium sm:min-h-0">
                <input id="generation_enabled" type="checkbox" name="generation_enabled" defaultChecked={s.generation_enabled} role="switch" className="peer sr-only" />
                <span
                  aria-hidden
                  className="relative h-6 w-11 rounded-full bg-bad/70 transition after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition peer-checked:bg-ok peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-signal peer-focus-visible:ring-offset-2"
                />
                Generación activa
              </label>
            </div>
          </Card>

          <Card>
            <CardHeader title="Modelo de IA por defecto" intro="Para estrategia y redacción. La visibilidad en IA consulta todos los modelos." className="px-4 py-3 sm:px-5" />
            <div className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-2 sm:px-5">
              <Field label="Proveedor">
                <Select name="ai_provider" defaultValue={s.ai_provider}>
                  <option value="claude">Claude (Anthropic)</option>
                  <option value="openai">GPT (OpenAI)</option>
                  <option value="gemini">Gemini (Google)</option>
                </Select>
              </Field>
              <Field label="ID de modelo (opcional)" hint="Déjalo vacío para usar el predeterminado del código.">
                <Input name="ai_model" defaultValue={s.ai_model} placeholder="p. ej. el último modelo estable" className="font-mono text-[13px]" />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Aviso de mantenimiento" intro="Se muestra arriba en el panel de todos los clientes. Vacío = sin aviso." className="px-4 py-3 sm:px-5" />
            <div className="px-4 py-4 sm:px-5">
              <Field label="Texto del aviso" hint="Máx. 280 caracteres.">
                <Textarea
                  name="maintenance_banner"
                  rows={3}
                  maxLength={280}
                  defaultValue={s.maintenance_banner}
                  placeholder="Esta noche, de 23:00 a 23:30, la publicación automática se detendrá por mantenimiento."
                />
              </Field>
            </div>
          </Card>

          <StickyBar>
            <p className="text-xs text-ink-3">Los cambios se aplican al instante en todos los clientes.</p>
            <SubmitButton size="sm" className="h-10 sm:h-9">
              Guardar ajustes
            </SubmitButton>
          </StickyBar>
        </DetailLayout>
      </ActionForm>
    </>
  );
}
