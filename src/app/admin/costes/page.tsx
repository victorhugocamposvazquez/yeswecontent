import Link from "next/link";
import { Badge, Card, CardHeader, PageHeader, Stat } from "@/components/ui";
import { CostEstimator } from "@/components/admin/CostEstimator";
import { DataTable, EmptyRow, Sub, Td, Th, THead, Tr } from "@/components/admin/table";
import { getAiCostOverview } from "@/lib/admin/data";
import { getAiPriceRates } from "@/lib/ai/rates-server";
import { num } from "@/lib/utils";

export const metadata = { title: "Coste IA" };

const usd = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
const eurDec = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);

const PURPOSE_LABEL: Record<string, string> = {
  article: "Artículos",
  plan: "Plan editorial",
  image: "Imágenes",
  image_brief: "Briefs de imagen",
  specialist: "Especialista",
  visibility: "Visibilidad IA",
  links: "Enlaces",
  analyze: "Análisis de web",
  other: "Otros",
};

export default async function AiCostsPage() {
  const [o, rates] = await Promise.all([getAiCostOverview(), Promise.resolve(getAiPriceRates())]);

  return (
    <>
      <PageHeader
        title="Coste interno de IA"
        intro={`Lo que nos cuesta Anthropic, OpenAI y el resto por empresa este mes (${o.month_label}). No es lo que paga el cliente: es el gasto de API atribuido a cada sitio.`}
      />

      <CostEstimator rates={rates} />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Coste del mes (USD)" value={usd(o.total_usd)} />
        <Stat label="Equiv. EUR" value={eurDec(o.total_eur)} hint="Tipo AI_USD_EUR_RATE" />
        <Stat label="Llamadas" value={num(o.total_calls)} />
        <Stat label="Sitios con consumo" value={num(o.sites.length)} />
      </div>

      {o.by_provider.length > 0 && (
        <Card className="mb-6">
          <CardHeader title="Por proveedor" className="px-4 py-3 sm:px-5" />
          <ul className="divide-y divide-line px-4 sm:px-5">
            {o.by_provider.map((p) => (
              <li key={p.provider} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="font-medium capitalize">{p.provider}</span>
                <span className="tabular text-ink-2">
                  {usd(p.cost_usd)} · {num(p.calls)} llamadas
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <DataTable caption="Coste de IA por sitio" title="Por empresa / sitio" count={o.sites.length} unit="sitios" minWidth="min-w-[880px]">
        <THead>
          <Th>Empresa / sitio</Th>
          <Th>Titular</Th>
          <Th numeric>Llamadas</Th>
          <Th numeric>Tokens in/out</Th>
          <Th numeric>Coste USD</Th>
          <Th>Desglose</Th>
        </THead>
        <tbody>
          {o.sites.length === 0 ? (
            <EmptyRow cols={6}>Aún no hay consumo este mes. Cuando generes un plan o un artículo con Claude, aparecerá aquí.</EmptyRow>
          ) : (
            o.sites.map((s) => (
              <Tr key={s.site_id ?? s.workspace_id ?? s.site_name}>
                <Td>
                  <div className="font-medium">{s.workspace_name}</div>
                  <Sub>{s.site_name}</Sub>
                </Td>
                <Td muted>{s.owner_email ?? "—"}</Td>
                <Td numeric>{num(s.calls)}</Td>
                <Td numeric className="text-ink-2">
                  {num(s.input_tokens)} / {num(s.output_tokens)}
                </Td>
                <Td numeric className="font-semibold">
                  {usd(s.cost_usd)}
                  <Sub>{eurDec(s.cost_usd * (o.total_usd ? o.total_eur / o.total_usd : 0.92))}</Sub>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {s.by_purpose.slice(0, 4).map((p) => (
                      <Badge key={p.purpose} tone="neutral">
                        {PURPOSE_LABEL[p.purpose] ?? p.purpose} {usd(p.cost_usd)}
                      </Badge>
                    ))}
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </DataTable>

      <p className="mt-5 max-w-2xl text-xs text-ink-3">
        Tarifas por defecto: Claude ~3 $/MTok entrada y 15 $/MTok salida; imágenes OpenAI ~0,04 $; chat OpenAI a tarifa mini.
        Ajustables con <code className="rounded bg-paper-2 px-1">AI_PRICE_*</code> y{" "}
        <code className="rounded bg-paper-2 px-1">AI_USD_EUR_RATE</code>. Aplicá la migración{" "}
        <code className="rounded bg-paper-2 px-1">0011_ai_usage.sql</code> si aún no está.{" "}
        <Link href="/admin/ajustes" className="font-medium text-signal underline">
          Ajustes
        </Link>
      </p>
    </>
  );
}
