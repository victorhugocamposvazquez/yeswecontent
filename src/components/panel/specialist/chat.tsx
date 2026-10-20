"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, Headset, LoaderCircle, MessagesSquare, RotateCcw, Sparkles, Square, SquarePen, X } from "lucide-react";
import { MarkdownView } from "@/components/panel/markdown-view";
import { applyProposal, deleteThread, dismissProposal, loadThreadMessages } from "@/app/panel/especialista/actions";
import type { ActionState } from "@/lib/panel/action-types";
import { threadTitle, type ChatMessage, type Proposal, type StreamEvent, type ThreadSummary } from "@/lib/panel/specialist-types";
import { ProposalCard } from "./proposal-card";
import { ThreadList } from "./thread-list";

type Thread = ThreadSummary & { messages: ChatMessage[] | null; persisted: boolean };
type Booking = { href: string; external: boolean } | null;

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export function SpecialistChat({
  siteName,
  persist,
  initialThreads,
  starters,
  booking,
  aiEnabled,
}: {
  siteName: string;
  persist: boolean;
  initialThreads: ThreadSummary[];
  starters: string[];
  booking: Booking;
  aiEnabled: boolean;
}) {
  const [threads, setThreads] = useState<Thread[]>(() => initialThreads.map((t) => ({ ...t, messages: null, persisted: true })));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const streamIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stickRef = useRef(false);

  const active = threads.find((t) => t.id === activeId) ?? null;
  const messages = active?.messages ?? [];

  /* ───────── utilidades de estado ───────── */

  const patchThread = useCallback((id: string, fn: (t: Thread) => Thread) => {
    setThreads((list) => list.map((t) => (t.id === id ? fn(t) : t)));
  }, []);

  const patchMessage = useCallback(
    (threadId: string, messageId: string, fn: (m: ChatMessage) => ChatMessage) => {
      patchThread(threadId, (t) => ({ ...t, messages: (t.messages ?? []).map((m) => (m.id === messageId ? fn(m) : m)) }));
    },
    [patchThread],
  );

  const nearBottom = () => {
    const el = endRef.current;
    if (!el) return true;
    return el.getBoundingClientRect().top < window.innerHeight + 240;
  };
  const scrollToEnd = (smooth = true) => endRef.current?.scrollIntoView({ block: "end", behavior: smooth ? "smooth" : "auto" });

  // Sigue el final de la conversación tras pintar, si el usuario estaba abajo.
  useLayoutEffect(() => {
    if (!stickRef.current) return;
    stickRef.current = false;
    scrollToEnd(false);
  }, [threads]);

  /* ───────── hoja de conversaciones (móvil) ───────── */

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setSheetOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  useEffect(() => () => abortRef.current?.abort(), []);

  /* ───────── enviar ───────── */

  async function send(raw: string, base?: ChatMessage[]) {
    const text = raw.trim();
    if (!text || streaming) return;
    setError(null);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "";

    const now = new Date().toISOString();
    const userMsg: ChatMessage = { id: uid(), role: "user", content: text, proposals: [], created_at: now };
    const asstId = uid();
    const asst: ChatMessage = { id: asstId, role: "assistant", content: "", proposals: [], created_at: now };

    let tid = activeId;
    let history: ChatMessage[];
    let persisted = false;
    if (!tid || !active) {
      tid = `tmp-${uid()}`;
      history = [userMsg];
      setThreads((list) => [{ id: tid!, title: threadTitle(text), created_at: now, messages: [userMsg, asst], persisted: false }, ...list]);
      setActiveId(tid);
    } else {
      persisted = active.persisted;
      const prev = base ?? active.messages ?? [];
      history = [...prev.filter((m) => m.content.trim()), userMsg];
      patchThread(tid, (t) => ({ ...t, messages: [...prev, userMsg, asst] }));
    }
    streamIdRef.current = tid;
    setStreaming(true);
    stickRef.current = true;

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/especialista", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          threadId: persist && persisted ? tid : null,
          messages: history.map((m) => ({ role: m.role, content: m.content, proposals: m.proposals.map((p) => ({ kind: p.kind, status: p.status, data: p.data })) })),
        }),
      });
      if (!res.ok || !res.body) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? "No he podido contestar ahora mismo.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        if (nearBottom()) stickRef.current = true;
        for (const line of lines) {
          if (!line.trim()) continue;
          handleEvent(JSON.parse(line) as StreamEvent, asstId);
        }
      }
    } catch (e) {
      if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : "No he podido contestar ahora mismo.");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function handleEvent(ev: StreamEvent, asstId: string) {
    const tid = streamIdRef.current;
    if (!tid) return;
    switch (ev.t) {
      case "thread":
        setThreads((list) => list.map((t) => (t.id === tid ? { ...t, id: ev.id, title: ev.title, persisted: true } : t)));
        setActiveId((cur) => (cur === tid ? ev.id : cur));
        streamIdRef.current = ev.id;
        break;
      case "text":
        patchMessage(tid, asstId, (m) => ({ ...m, content: m.content + ev.v }));
        break;
      case "proposal":
        patchMessage(tid, asstId, (m) => ({ ...m, proposals: [...m.proposals, ev.p] }));
        break;
      case "done":
        patchMessage(tid, asstId, (m) => ({ ...m, id: ev.messageId }));
        break;
      case "error":
        setError(ev.message);
        break;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  function retry() {
    if (!active?.messages) return;
    const list = [...active.messages];
    while (list.length && list[list.length - 1].role === "assistant" && !list[list.length - 1].content.trim()) list.pop();
    const lastUser = [...list].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    void send(lastUser.content, list.slice(0, list.lastIndexOf(lastUser)));
  }

  /* ───────── conversaciones ───────── */

  async function selectThread(id: string) {
    setSheetOpen(false);
    if (id === activeId) return;
    setError(null);
    setActiveId(id);
    const t = threads.find((x) => x.id === id);
    if (t && t.messages === null && t.persisted) {
      setLoadingThread(true);
      const msgs = await loadThreadMessages(id).catch(() => []);
      patchThread(id, (x) => ({ ...x, messages: msgs }));
      stickRef.current = true;
      setLoadingThread(false);
    }
  }

  function newThread() {
    setSheetOpen(false);
    setActiveId(null);
    setError(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function removeThread(id: string) {
    const t = threads.find((x) => x.id === id);
    if (!t || !window.confirm(`¿Eliminar la conversación «${t.title}»?`)) return;
    if (t.persisted && persist) {
      const r = await deleteThread(id);
      if (!r?.ok) {
        setError(r?.message ?? "No se pudo eliminar.");
        return;
      }
    }
    setThreads((list) => list.filter((x) => x.id !== id));
    if (activeId === id) setActiveId(null);
  }

  /* ───────── propuestas ───────── */

  const setProposalStatus = (messageId: string, p: Proposal, status: Proposal["status"]) => {
    if (!activeId) return;
    patchMessage(activeId, messageId, (m) => ({ ...m, proposals: m.proposals.map((x) => (x.id === p.id ? ({ ...x, status } as Proposal) : x)) }));
  };

  async function onApply(messageId: string, p: Proposal): Promise<ActionState> {
    const r = await applyProposal(persist ? messageId : null, p).catch(() => ({ ok: false, message: "No se pudo aplicar. Inténtalo de nuevo.", at: Date.now() }));
    if (r?.ok) setProposalStatus(messageId, p, "applied");
    return r;
  }

  async function onDismiss(messageId: string, p: Proposal): Promise<ActionState> {
    const r = await dismissProposal(persist ? messageId : null, p.id).catch(() => null);
    setProposalStatus(messageId, p, "dismissed");
    return r;
  }

  /* ───────── entrada ───────── */

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    // En pantallas táctiles Intro hace salto de línea; se envía con el botón.
    if (window.matchMedia("(pointer: coarse)").matches) return;
    e.preventDefault();
    void send(input);
  }

  function autosize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }

  const bookingLink = booking && (
    <a
      href={booking.href}
      {...(booking.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex min-h-11 items-center gap-2 rounded-[10px] border border-line bg-card px-3 text-[13px] font-medium shadow-[var(--shadow-xs)] transition-colors hover:bg-paper-2"
    >
      <Headset className="h-4 w-4 text-signal" aria-hidden /> Hablar con una persona
    </a>
  );

  const lastAsst = messages[messages.length - 1];
  const waitingFirstToken = streaming && lastAsst?.role === "assistant" && !lastAsst.content && !lastAsst.proposals.length;

  return (
    <div className="lg:grid lg:h-[calc(100dvh-9.5rem)] lg:min-h-[34rem] lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-5">
      {/* Lista de conversaciones (escritorio) */}
      <aside className="hidden min-h-0 flex-col gap-4 lg:flex">
        <div>
          <h1 className="text-[1.65rem] font-semibold tracking-tight">Especialista SEO</h1>
          <p className="mt-1 text-[13px] text-ink-2">Tu consultor de SEO y visibilidad en IA, con los datos de {siteName}.</p>
        </div>
        <div className="min-h-0 flex-1 rounded-2xl border border-line bg-card p-2 shadow-[var(--shadow-xs)]">
          <ThreadList threads={threads} activeId={activeId} busy={streaming} onSelect={selectThread} onNew={newThread} onDelete={removeThread} />
        </div>
        {bookingLink}
      </aside>

      {/* Conversación */}
      <section className="flex min-h-0 flex-col lg:overflow-hidden lg:rounded-2xl lg:border lg:border-line lg:bg-card lg:shadow-[var(--shadow-xs)]" aria-label="Conversación con el especialista">
        {/* Barra superior móvil */}
        <div className="-mt-2 mb-3 flex items-center gap-1 lg:hidden">
          <button type="button" onClick={() => setSheetOpen(true)} className="-ml-2 grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-paper-2" aria-label="Ver conversaciones">
            <MessagesSquare className="h-5 w-5" aria-hidden />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <h1 className="truncate text-base font-semibold">{active ? active.title : "Especialista SEO"}</h1>
            {!active && <p className="truncate text-xs text-ink-3">Con los datos de {siteName}</p>}
          </div>
          <button type="button" onClick={newThread} disabled={streaming} className="-mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-paper-2 disabled:opacity-40" aria-label="Nueva conversación">
            <SquarePen className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:min-h-0 lg:overflow-y-auto lg:px-8 lg:pb-6 lg:pt-6" aria-live="polite" aria-busy={streaming}>
          {loadingThread ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-3">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Cargando conversación…
            </div>
          ) : !active || messages.length === 0 ? (
            <div className="mx-auto flex max-w-2xl flex-col items-center py-6 text-center lg:py-12">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-signal-soft text-signal ring-1 ring-signal/15" aria-hidden>
                <Sparkles className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-xl font-semibold tracking-tight">¿En qué te ayudo hoy?</h2>
              <p className="mt-1 max-w-md text-sm text-ink-2">
                Conozco tu auditoría, tus consultas en Google, cómo te citan ChatGPT y compañía, y tu plan de contenidos. Pregunta como se lo preguntarías a tu consultora.
              </p>
              {!aiEnabled && <p className="mt-2 text-xs text-ink-3">Sin clave de IA configurada: verás respuestas de ejemplo construidas con tus datos.</p>}
              <ul className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                {starters.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => void send(s)}
                      disabled={streaming}
                      className="flex min-h-11 w-full items-center rounded-xl border border-line bg-card px-4 py-3 text-left text-[13px] text-ink-2 shadow-[var(--shadow-xs)] transition-all duration-150 hover:border-line-2 hover:bg-paper-2 hover:text-ink disabled:opacity-50"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
              {booking && <div className="mt-6 lg:hidden">{bookingLink}</div>}
            </div>
          ) : (
            <ol className="mx-auto max-w-3xl space-y-6">
              {messages.map((m) =>
                m.role === "user" ? (
                  <li key={m.id} className="flex justify-end">
                    <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[14px] leading-relaxed text-paper">{m.content}</p>
                  </li>
                ) : (
                  <li key={m.id} className="flex gap-3">
                    <span className="mt-0.5 hidden h-8 w-8 shrink-0 place-items-center rounded-full bg-signal-soft text-signal sm:grid" aria-hidden>
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-3">
                      {m.content ? (
                        <MarkdownView md={m.content} className="max-w-none text-[14px] [&_h2]:mt-5 [&_h2]:text-base [&_h3]:text-[15px]" />
                      ) : waitingFirstToken && m === lastAsst ? (
                        <p className="flex items-center gap-2 py-1 text-sm text-ink-3">
                          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Revisando tus datos…
                        </p>
                      ) : null}
                      {m.proposals.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Propuestas · tú decides</p>
                          {m.proposals.map((p) => (
                            <ProposalCard key={p.id} proposal={p} disabled={streaming && m === lastAsst} onApply={(x) => onApply(m.id, x)} onDismiss={(x) => onDismiss(m.id, x)} />
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                ),
              )}
            </ol>
          )}

          {error && (
            <div role="alert" className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center gap-2 rounded-xl border border-bad/20 bg-bad-soft px-4 py-3 text-[13px] text-bad">
              <span className="flex-1">{error}</span>
              {active?.messages?.some((m) => m.role === "user") && (
                <button type="button" onClick={retry} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 font-medium text-ink hover:bg-paper-2">
                  <RotateCcw className="h-4 w-4" aria-hidden /> Reintentar
                </button>
              )}
            </div>
          )}
          <div ref={endRef} className="h-px scroll-mb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:scroll-mb-0" />
        </div>

        {/* Entrada: fija abajo en móvil, al pie de la tarjeta en escritorio */}
        <form
          onSubmit={onSubmit}
          className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/90 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:static lg:z-auto lg:border-line lg:bg-paper-2/60 lg:px-6 lg:pb-5 lg:pt-4 lg:backdrop-blur-none print:hidden"
        >
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <label htmlFor="specialist-input" className="sr-only">
              Escribe tu pregunta
            </label>
            <textarea
              id="specialist-input"
              ref={inputRef}
              value={input}
              rows={1}
              maxLength={4000}
              enterKeyHint="send"
              placeholder="Pregunta lo que quieras…"
              onChange={(e) => {
                setInput(e.target.value);
                autosize(e.target);
              }}
              onKeyDown={onKeyDown}
              className="max-h-42 min-h-11 flex-1 resize-none rounded-2xl border border-line-2 bg-card px-4 py-2.5 text-base leading-6 shadow-[var(--shadow-xs)] outline-none transition placeholder:text-ink-3 hover:border-ink-3 focus:border-signal focus:shadow-[var(--ring)]"
            />
            {streaming ? (
              <button type="button" onClick={stop} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-paper" aria-label="Detener respuesta">
                <Square className="h-4 w-4 fill-current" aria-hidden />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-signal text-signal-ink shadow-[var(--shadow-sm)] transition hover:bg-signal-2 active:translate-y-px disabled:opacity-40"
                aria-label="Enviar pregunta"
              >
                <ArrowUp className="h-5 w-5" aria-hidden />
              </button>
            )}
          </div>
          <p className="mx-auto mt-1.5 hidden max-w-3xl text-center text-xs text-ink-3 lg:block">Las propuestas no se aplican hasta que las confirmas. Revisa siempre las recomendaciones.</p>
        </form>
      </section>

      {/* Hoja de conversaciones (móvil) */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Conversaciones">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Cerrar" onClick={() => setSheetOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl bg-card px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2 shadow-[var(--shadow-lg)]">
            <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-line" aria-hidden />
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">Especialista SEO</p>
              <button type="button" onClick={() => setSheetOpen(false)} className="-mr-2 grid h-11 w-11 place-items-center rounded-full hover:bg-paper-2" aria-label="Cerrar">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ThreadList threads={threads} activeId={activeId} busy={streaming} onSelect={selectThread} onNew={newThread} onDelete={removeThread} />
            </div>
            {booking && <div className="mt-3">{bookingLink}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
