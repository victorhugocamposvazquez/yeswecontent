"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, Input } from "@/components/ui";
import type { ActionResult, VolumeTier } from "@/lib/admin/types";
import { ActionForm, SubmitButton } from "./ActionForm";

type Row = VolumeTier & { key: number };

const cell = "h-9 px-2.5 text-[13px] tabular";

/** Editor de tramos de descuento por número de sitios. Va dentro de una `Card`. */
export function VolumeTiersEditor({ tiers, action }: { tiers: VolumeTier[]; action: (p: ActionResult, fd: FormData) => Promise<ActionResult> }) {
  const [rows, setRows] = useState<Row[]>(tiers.map((t, i) => ({ ...t, key: i })));
  const add = () => {
    const last = rows.at(-1);
    const from = last ? (last.to ?? last.from) + 1 : 2;
    setRows([...rows, { from, to: null, pct: (last?.pct ?? 5) + 5, key: Date.now() }]);
  };

  return (
    <ActionForm action={action} className="[&>p[role=status]]:px-4 [&>p[role=status]]:pb-3">
      <div className="scroll-x">
        <table className="w-full min-w-[420px] border-collapse text-[13px]">
          <caption className="sr-only">Tramos de descuento por volumen</caption>
          <thead className="text-left text-[11px] uppercase tracking-[0.06em] text-ink-3 shadow-[inset_0_-1px_0_var(--line)]">
            <tr>
              <th scope="col" className="h-9 px-3 pl-4 font-medium">
                Desde (sitios)
              </th>
              <th scope="col" className="h-9 px-3 font-medium">
                Hasta
              </th>
              <th scope="col" className="h-9 px-3 font-medium">
                Descuento %
              </th>
              <th scope="col" className="h-9 w-12 px-3 pr-4">
                <span className="sr-only">Quitar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.key} className="border-t border-line">
                <td className="px-3 py-1.5 pl-4">
                  <Input name="from" type="number" min={1} defaultValue={r.from} aria-label={`Tramo ${i + 1}: desde`} required className={cell} />
                </td>
                <td className="px-3 py-1.5">
                  <Input name="to" type="number" min={1} defaultValue={r.to ?? ""} placeholder="sin límite" aria-label={`Tramo ${i + 1}: hasta`} className={cell} />
                </td>
                <td className="px-3 py-1.5">
                  <Input name="pct" type="number" min={0} max={99} step="0.5" defaultValue={r.pct} aria-label={`Tramo ${i + 1}: descuento`} required className={cell} />
                </td>
                <td className="px-3 py-1.5 pr-4">
                  <button
                    type="button"
                    onClick={() => setRows(rows.filter((x) => x.key !== r.key))}
                    className="inline-flex size-11 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-bad-soft hover:text-bad sm:size-8"
                    aria-label={`Quitar tramo ${i + 1}`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr className="border-t border-line">
                <td colSpan={4} className="px-4 py-6 text-center text-ink-3">
                  Sin tramos: todos los sitios pagan el precio completo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-paper-2/40 px-4 py-3">
        <Button type="button" variant="ghost" size="sm" onClick={add} className="h-10 sm:h-9">
          <Plus className="size-4" aria-hidden /> Añadir tramo
        </Button>
        <SubmitButton size="sm" className="h-10 sm:h-9">
          Guardar descuentos
        </SubmitButton>
      </div>
      <p className="px-4 pb-3 pt-2 text-xs text-ink-3">Se aplican en Stripe como cupón por porcentaje al contratar varios sitios en el mismo pago.</p>
    </ActionForm>
  );
}
