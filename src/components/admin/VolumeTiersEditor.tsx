"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui";
import type { ActionResult, VolumeTier } from "@/lib/admin/types";
import { ActionForm, SubmitButton } from "./ActionForm";

type Row = VolumeTier & { key: number };

/** Editor de tramos de descuento por número de sitios. */
export function VolumeTiersEditor({ tiers, action }: { tiers: VolumeTier[]; action: (p: ActionResult, fd: FormData) => Promise<ActionResult> }) {
  const [rows, setRows] = useState<Row[]>(tiers.map((t, i) => ({ ...t, key: i })));
  const add = () => {
    const last = rows.at(-1);
    const from = last ? (last.to ?? last.from) + 1 : 2;
    setRows([...rows, { from, to: null, pct: (last?.pct ?? 5) + 5, key: Date.now() }]);
  };

  return (
    <ActionForm action={action}>
      <div className="scroll-x">
        <table className="w-full min-w-[420px] text-sm">
          <caption className="sr-only">Tramos de descuento por volumen</caption>
          <thead className="text-left text-xs uppercase tracking-wide text-ink-3">
            <tr>
              <th scope="col" className="pb-2 font-medium">
                Desde (sitios)
              </th>
              <th scope="col" className="pb-2 font-medium">
                Hasta
              </th>
              <th scope="col" className="pb-2 font-medium">
                Descuento %
              </th>
              <th scope="col" className="pb-2">
                <span className="sr-only">Quitar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.key}>
                <td className="py-1 pr-2">
                  <Input name="from" type="number" min={1} defaultValue={r.from} aria-label={`Tramo ${i + 1}: desde`} required />
                </td>
                <td className="py-1 pr-2">
                  <Input name="to" type="number" min={1} defaultValue={r.to ?? ""} placeholder="sin límite" aria-label={`Tramo ${i + 1}: hasta`} />
                </td>
                <td className="py-1 pr-2">
                  <Input name="pct" type="number" min={0} max={99} step="0.5" defaultValue={r.pct} aria-label={`Tramo ${i + 1}: descuento`} required />
                </td>
                <td className="py-1">
                  <button
                    type="button"
                    onClick={() => setRows(rows.filter((x) => x.key !== r.key))}
                    className="rounded-lg p-2 text-ink-3 hover:bg-paper-2 hover:text-bad"
                    aria-label={`Quitar tramo ${i + 1}`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={add} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-ink-2 hover:bg-paper-2">
          <Plus className="size-4" aria-hidden /> Añadir tramo
        </button>
        <SubmitButton>Guardar descuentos</SubmitButton>
      </div>
      <p className="mt-2 text-xs text-ink-3">Se aplican en Stripe como cupón por porcentaje al contratar varios sitios en el mismo pago.</p>
    </ActionForm>
  );
}
