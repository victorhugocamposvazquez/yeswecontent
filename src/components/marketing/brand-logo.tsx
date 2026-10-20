import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Logotipo monocromo pintado con el color del texto actual (mask-image). */
export function BrandLogo({ src, className }: { src: string; className?: string }) {
  const style: CSSProperties = {
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  };
  return <span aria-hidden className={cn("inline-block shrink-0 bg-current", className)} style={style} />;
}
