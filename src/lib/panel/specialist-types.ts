/**
 * Tipos compartidos (cliente y servidor) del Especialista SEO.
 */

export type ProposalStatus = "pending" | "applied" | "dismissed";

export interface ContentTopicData {
  title: string;
  keyword: string;
  cluster?: string | null;
  intent?: "informational" | "commercial" | "transactional" | "navigational" | null;
  kind: "new" | "refresh";
  reason: string;
}

export interface TrackedPromptData {
  prompt: string;
  reason: string;
}

export interface AuditFixData {
  check_id: string;
  title: string;
  steps: string[];
  priority: "alta" | "media" | "baja";
  reason: string;
}

export type Proposal =
  | { id: string; kind: "content_topic"; status: ProposalStatus; data: ContentTopicData }
  | { id: string; kind: "tracked_prompt"; status: ProposalStatus; data: TrackedPromptData }
  | { id: string; kind: "audit_fix"; status: ProposalStatus; data: AuditFixData };

export type ProposalKind = Proposal["kind"];

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  proposals: Proposal[];
  created_at: string;
}

export interface ThreadSummary {
  id: string;
  title: string;
  created_at: string;
}

/** Eventos NDJSON que emite POST /api/especialista (una línea JSON por evento). */
export type StreamEvent =
  | { t: "thread"; id: string; title: string }
  | { t: "text"; v: string }
  | { t: "proposal"; p: Proposal }
  | { t: "done"; messageId: string }
  | { t: "error"; message: string };

export const threadTitle = (firstMessage: string) => {
  const clean = firstMessage.replace(/\s+/g, " ").trim();
  return clean.length > 60 ? `${clean.slice(0, 57).trimEnd()}…` : clean || "Nueva conversación";
};
