import { Container } from "@/components/marketing/primitives";

export default function ToolLoading() {
  return (
    <div className="border-b border-line py-5 sm:py-6" aria-busy="true" aria-label="Cargando herramienta">
      <Container className="max-w-3xl">
        <div className="h-5 w-40 animate-pulse rounded-md bg-paper-2" />
        <div className="mt-4 h-4 w-56 animate-pulse rounded bg-paper-2" />
        <div className="mt-3 h-9 w-full max-w-md animate-pulse rounded-lg bg-paper-2" />
        <div className="mt-4 h-14 w-full animate-pulse rounded-2xl bg-paper-2" />
      </Container>
    </div>
  );
}
