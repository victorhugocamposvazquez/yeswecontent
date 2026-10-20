import { cn } from "@/lib/utils";

/** Logotipos oficiales a color de los modelos y canales (public/logos/color). */
const FILES: Record<string, string> = {
  chatgpt: "chatgpt.svg",
  openai: "chatgpt.svg",
  claude: "claude.svg",
  gemini: "gemini.svg",
  google: "google.svg",
  perplexity: "perplexity.svg",
  reddit: "reddit.svg",
  quora: "quora.svg",
};

export const modelKey = (label: string) => label.toLowerCase().replace(/\s+/g, "");

export function ModelLogo({ model, size = 20, className, boxed = false }: { model: string; size?: number; className?: string; boxed?: boolean }) {
  const file = FILES[modelKey(model)];
  if (!file) {
    return (
      <span className={cn("grid shrink-0 place-items-center rounded-md bg-paper-3 text-[10px] font-semibold text-ink-2", className)} style={{ width: size, height: size }} aria-hidden>
        {model.slice(0, 1).toUpperCase()}
      </span>
    );
  }
  const img = (
    // eslint-disable-next-line @next/next/no-img-element -- SVG estático sin estilos
    <img src={`/logos/color/${file}`} alt="" width={size} height={size} className={cn("shrink-0", !boxed && className)} style={{ width: size, height: size }} aria-hidden />
  );
  if (!boxed) return img;
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-lg border border-line bg-card", className)} style={{ width: size + 12, height: size + 12 }} aria-hidden>
      {img}
    </span>
  );
}
