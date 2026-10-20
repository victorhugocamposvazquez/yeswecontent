import { markdownToHtml, proseClass } from "@/lib/panel/markdown";
import { cn } from "@/lib/utils";

/** Renderiza Markdown ya escapado por nuestro conversor (seguro frente a HTML inyectado). */
export function MarkdownView({ md, className }: { md: string; className?: string }) {
  return <div className={cn(proseClass, className)} dangerouslySetInnerHTML={{ __html: markdownToHtml(md) }} />;
}
