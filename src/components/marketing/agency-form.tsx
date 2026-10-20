"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { requestAgencyCall, type ContactState } from "@/app/(marketing)/agencias/actions";

const input =
  "w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-3 focus:ring-4 focus:ring-lime";

export function AgencyForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(requestAgencyCall, {});

  if (state.ok)
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-lime p-8">
        <CheckCircle2 className="h-8 w-8" aria-hidden />
        <p className="font-display text-3xl leading-tight">¡Recibido! Te escribimos en menos de un día laborable.</p>
        <p className="text-sm">Te propondremos dos o tres huecos para una llamada de 15 minutos.</p>
      </div>
    );

  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-line bg-card p-6 shadow-[0_12px_32px_-16px_rgba(21,19,15,0.22)] sm:grid-cols-2 sm:p-8">
      <input type="text" name="company_fax" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="text-sm font-medium">
        Nombre
        <input name="name" required autoComplete="name" className={`${input} mt-1.5`} />
      </label>
      <label className="text-sm font-medium">
        Email de trabajo
        <input name="email" type="email" required autoComplete="email" className={`${input} mt-1.5`} />
      </label>
      <label className="text-sm font-medium">
        Agencia
        <input name="agency" autoComplete="organization" className={`${input} mt-1.5`} />
      </label>
      <label className="text-sm font-medium">
        Web de la agencia
        <input name="website" placeholder="agencia.com" className={`${input} mt-1.5`} />
      </label>
      <label className="text-sm font-medium sm:col-span-2">
        ¿Cuántos clientes gestionáis?
        <select name="clients" className={`${input} mt-1.5`} defaultValue="1-5">
          <option value="1-5">De 1 a 5</option>
          <option value="6-20">De 6 a 20</option>
          <option value="21-50">De 21 a 50</option>
          <option value="50+">Más de 50</option>
        </select>
      </label>
      <label className="text-sm font-medium sm:col-span-2">
        Cuéntanos algo (opcional)
        <textarea name="message" rows={3} className={`${input} mt-1.5`} placeholder="Qué servicios ofrecéis, qué os gustaría automatizar…" />
      </label>
      {state.error && (
        <p role="alert" className="text-sm font-medium text-bad sm:col-span-2">
          {state.error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-signal px-6 py-3 font-semibold text-signal-ink shadow-sm transition disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Reservar llamada de 15 min
        </button>
        <p className="text-xs text-ink-3">Usaremos tus datos solo para contactarte. Más en la política de privacidad.</p>
      </div>
    </form>
  );
}
