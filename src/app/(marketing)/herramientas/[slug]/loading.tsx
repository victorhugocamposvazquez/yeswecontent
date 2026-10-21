import { Container } from "@/components/marketing/primitives";

export default function ToolLoading() {
  return (
    <div className="border-b border-line py-5 sm:py-7" aria-busy="true" aria-label="Cargando herramienta">
      <Container>
        <div className="h-5 w-40 animate-pulse rounded-md bg-paper-2" />
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-3 max-lg:order-2">
            <div className="h-4 w-48 animate-pulse rounded bg-paper-2" />
            <div className="h-9 w-full max-w-md animate-pulse rounded-lg bg-paper-2" />
            <div className="h-20 w-full animate-pulse rounded-2xl bg-paper-2" />
          </div>
          <div className="h-36 animate-pulse rounded-2xl bg-paper-2 max-lg:order-1" />
        </div>
      </Container>
    </div>
  );
}
