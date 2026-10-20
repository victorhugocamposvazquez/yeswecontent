import type { ReactNode } from "react";
import { Container, Eyebrow } from "@/components/marketing/primitives";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <Container className="py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <Eyebrow>Legal</Eyebrow>
        <h1 className="mt-4 font-display text-5xl leading-tight md:text-6xl">{title}</h1>
        <p className="mt-3 font-mono text-xs text-ink-3">Última actualización: {updated}</p>
        <div className="mt-8 rounded-xl border border-warn/40 bg-warn/10 p-4 text-sm">
          <strong>Borrador pendiente de revisión legal.</strong> Este texto es una plantilla genérica con datos de empresa provisionales. Debe revisarlo un abogado antes de su publicación definitiva.
        </div>
        <div className="mt-10 space-y-6 leading-relaxed text-ink-2 [&_h2]:pt-4 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink">{children}</div>
      </div>
    </Container>
  );
}
