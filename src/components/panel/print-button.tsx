"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui";

export function PrintButton({ label = "Descargar PDF" }: { label?: string }) {
  return (
    <Button type="button" variant="ink" onClick={() => window.print()} className="print:hidden">
      <Printer className="h-4 w-4" aria-hidden /> {label}
    </Button>
  );
}
