import { CalendarClock, Mail } from "lucide-react";
import { Card } from "@/components/ui";
import { agencyName, getPortal, listClientMessages } from "@/lib/clientes/data";
import { cn } from "@/lib/utils";
import { sendClientMessage } from "../../actions";
import { pButton } from "../../_components/button-class";
import { PForm, PTextarea } from "../../_components/form";

export const metadata = { title: "Habla con tu equipo" };

const when = (d: string) => new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(d));

export default async function ClientTeamPage() {
  const { site, client, agency, preview } = await getPortal();
  const messages = await listClientMessages(site.id);
  const name = agencyName(agency);
  const mine = preview ? "agency" : "client";

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="font-semibold">Tu equipo en {name}</h2>
          <p className="text-sm text-ink-3">Respondemos en menos de un día laborable.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {client.booking_url && (
            <a href={client.booking_url} target="_blank" rel="noreferrer" className={pButton("primary", "w-full sm:w-auto")}>
              <CalendarClock className="h-4 w-4" aria-hidden /> Reservar una llamada
            </a>
          )}
          {agency.white_label.support_email && (
            <a href={`mailto:${agency.white_label.support_email}`} className={pButton("outline", "w-full sm:w-auto")}>
              <Mail className="h-4 w-4" aria-hidden /> Email
            </a>
          )}
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 font-semibold">Conversación</h2>
        {messages.length ? (
          <ol className="space-y-3" aria-label="Mensajes">
            {messages.map((m) => {
              const own = m.author_side === mine;
              return (
                <li key={m.id} className={cn("flex", own ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5", own ? "rounded-br-md bg-signal text-signal-ink" : "rounded-bl-md bg-paper-2 text-ink")}>
                    <p className={cn("mb-0.5 text-xs font-semibold", own ? "opacity-85" : "text-ink-2")}>
                      {m.author_name}
                      {m.author_side === "agency" && !own ? ` · ${name}` : ""}
                    </p>
                    <p className="whitespace-pre-line text-[15px] leading-relaxed">{m.body}</p>
                    <p className={cn("mt-1 text-[11px]", own ? "opacity-75" : "text-ink-3")}>{when(m.created_at)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm text-ink-3">Aún no hay mensajes. Escríbenos lo que necesites: ideas de temas, cambios, dudas…</p>
        )}

        <div className="mt-5 border-t border-line pt-5">
          <PForm action={sendClientMessage} submitLabel="Enviar" pendingLabel="Enviando…" resetOnSuccess>
            <label htmlFor="body" className="sr-only">
              Tu mensaje
            </label>
            <PTextarea id="body" name="body" rows={3} required maxLength={4000} placeholder="Escribe tu mensaje…" />
          </PForm>
        </div>
      </Card>
    </div>
  );
}
