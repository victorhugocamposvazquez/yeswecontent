import type { ReactNode } from "react";
import { Container, Eyebrow, Title } from "@/components/marketing/primitives";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <Container className="py-14 sm:py-20 md:py-24">
      <div className="mx-auto max-w-3xl">
        <Eyebrow>Legal</Eyebrow>
        <Title as="h1" size="lg" className="mt-4">
          {title}
        </Title>
        <p className="mt-3 text-sm text-ink-3">Última actualización: {updated}</p>
        <div className="mt-8 rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm leading-relaxed text-ink-2">
          <strong className="text-ink">Borrador pendiente de revisión legal.</strong> Este texto es una plantilla genérica con datos de empresa provisionales. Debe revisarlo un abogado antes de su publicación definitiva.
        </div>
        <div className="mt-10 space-y-5 text-[15px] leading-relaxed text-ink-2 sm:text-base [&_h2]:pt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-ink sm:[&_h2]:text-2xl [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink [&_ul]:space-y-1.5">
          {children}
        </div>
      </div>
    </Container>
  );
}
