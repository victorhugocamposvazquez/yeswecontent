"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { requestAgencyCall, type ContactState } from "@/app/(marketing)/agencias/actions";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui";

export function AgencyForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(requestAgencyCall, {});

  if (state.ok)
    return (
      <Card className="flex flex-col items-start gap-3 bg-lime-soft p-8">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-ok-soft text-ok">
          <CheckCircle2 className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-xl font-semibold tracking-tight sm:text-2xl">¡Recibido! Te escribimos en menos de un día laborable.</p>
        <p className="text-sm text-ink-2">Te propondremos dos o tres huecos para una llamada de 15 minutos.</p>
      </Card>
    );

  return (
    <form action={action} className="surface grid grid-cols-1 gap-4 p-6 shadow-[var(--shadow-md)] sm:grid-cols-2 sm:p-8">
      <input type="text" name="company_fax" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div>
        <Label htmlFor="ag-name">Nombre</Label>
        <Input id="ag-name" name="name" required autoComplete="name" className="h-11" />
      </div>
      <div>
        <Label htmlFor="ag-email">Email de trabajo</Label>
        <Input id="ag-email" name="email" type="email" required autoComplete="email" className="h-11" />
      </div>
      <div>
        <Label htmlFor="ag-agency">Agencia</Label>
        <Input id="ag-agency" name="agency" autoComplete="organization" className="h-11" />
      </div>
      <div>
        <Label htmlFor="ag-web">Web de la agencia</Label>
        <Input id="ag-web" name="website" placeholder="agencia.com" inputMode="url" className="h-11" />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="ag-clients">¿Cuántos clientes gestionáis?</Label>
        <Select id="ag-clients" name="clients" defaultValue="1-5" className="h-11">
          <option value="1-5">De 1 a 5</option>
          <option value="6-20">De 6 a 20</option>
          <option value="21-50">De 21 a 50</option>
          <option value="50+">Más de 50</option>
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="ag-msg">Cuéntanos algo (opcional)</Label>
        <Textarea id="ag-msg" name="message" rows={3} placeholder="Qué servicios ofrecéis, qué os gustaría automatizar…" />
      </div>
      {state.error && (
        <p role="alert" className="text-sm font-medium text-bad sm:col-span-2">
          {state.error}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:gap-4">
        <Button type="submit" size="lg" disabled={pending} className="h-11">
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Reservar llamada de 15 min
        </Button>
        <p className="text-xs text-ink-3">Usaremos tus datos solo para contactarte. Más en la política de privacidad.</p>
      </div>
    </form>
  );
}
