"use client";

import { Printer } from "lucide-react";
import { pButton } from "./button-class";

export function PrintButton({ label = "Descargar PDF", variant = "ink" }: { label?: string; variant?: "ink" | "primary" | "outline" }) {
  return (
    <button type="button" onClick={() => window.print()} className={pButton(variant, "w-full sm:w-auto print:hidden")}>
      <Printer className="h-4 w-4" aria-hidden /> {label}
    </button>
  );
}
