import { Badge } from "@/components/ui";
import type { ArticleStatus, ContentStatus } from "@/lib/types";

const ART: Record<ArticleStatus, { label: string; tone: "neutral" | "ok" | "warn" | "bad" | "signal" | "lime" | "sky" }> = {
  draft: { label: "Borrador", tone: "neutral" },
  review: { label: "En revisión", tone: "warn" },
  scheduled: { label: "Programado", tone: "sky" },
  published: { label: "Publicado", tone: "ok" },
  failed: { label: "Error al publicar", tone: "bad" },
};
const CONTENT: Record<ContentStatus, { label: string; tone: "neutral" | "ok" | "warn" | "bad" | "signal" | "lime" | "sky" }> = {
  planned: { label: "Planificado", tone: "neutral" },
  writing: { label: "Escribiendo", tone: "signal" },
  review: { label: "En revisión", tone: "warn" },
  scheduled: { label: "Programado", tone: "sky" },
  published: { label: "Publicado", tone: "ok" },
  skipped: { label: "Descartado", tone: "bad" },
};

export const articleStatusLabel = (s: ArticleStatus) => ART[s].label;
export const contentStatusLabel = (s: ContentStatus) => CONTENT[s].label;

export function ArticleStatusBadge({ status }: { status: ArticleStatus }) {
  return <Badge tone={ART[status].tone}>{ART[status].label}</Badge>;
}
export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  return <Badge tone={CONTENT[status].tone}>{CONTENT[status].label}</Badge>;
}

export const INTENT_LABEL: Record<string, string> = { informational: "Informativa", commercial: "Comercial", transactional: "Transaccional", navigational: "De marca" };
