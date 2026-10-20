"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  requestReset,
  sendMagicLink,
  signIn,
  signInWithGoogle,
  signUp,
  updatePassword,
  type AuthState,
} from "@/app/(auth)/actions";

const input = "w-full rounded-xl border border-line bg-card px-3.5 py-3 text-sm outline-none placeholder:text-ink-3 focus:ring-4 focus:ring-lime";
const primary =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-signal px-5 py-3 font-semibold text-signal-ink shadow-sm transition disabled:opacity-60";

function Feedback({ state }: { state: AuthState }) {
  if (state.error)
    return (
      <p role="alert" className="rounded-xl border border-bad/40 bg-bad/10 px-4 py-2.5 text-sm font-medium text-bad">
        {state.error}
      </p>
    );
  if (state.message)
    return (
      <p role="status" className="rounded-xl border border-ok/40 bg-ok/10 px-4 py-2.5 text-sm font-medium text-ok">
        {state.message}
      </p>
    );
  return null;
}

function Field({ label, children, aside }: { label: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-sm font-medium">
        {label}
        {aside}
      </span>
      {children}
    </label>
  );
}

export function GoogleButton({ next, label = "Continuar con Google" }: { next: string; label?: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="next" value={next} />
      <button type="submit" className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-line bg-card px-5 py-3 font-semibold transition hover:bg-paper-2">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z" />
          <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
          <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
          <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
        </svg>
        {label}
      </button>
    </form>
  );
}

const Divider = ({ text = "o con tu email" }: { text?: string }) => (
  <div className="my-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">
    <span className="h-px flex-1 bg-line" /> {text} <span className="h-px flex-1 bg-line" />
  </div>
);

export function SignInForm({ next, initialError }: { next: string; initialError?: string }) {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [pwState, pwAction, pwPending] = useActionState<AuthState, FormData>(signIn, initialError ? { error: initialError } : {});
  const [mlState, mlAction, mlPending] = useActionState<AuthState, FormData>(sendMagicLink, {});

  return (
    <div>
      <GoogleButton next={next} />
      <Divider />
      <div role="tablist" aria-label="Forma de entrar" className="mb-5 grid grid-cols-2 rounded-lg border border-line bg-card p-1 text-sm font-semibold">
        {(["password", "magic"] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={cn("rounded-md py-2", mode === m ? "bg-ink text-paper" : "text-ink-2")}>
            {m === "password" ? "Contraseña" : "Enlace mágico"}
          </button>
        ))}
      </div>
      {mode === "password" ? (
        <form action={pwAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <Field label="Email">
            <input name="email" type="email" required autoComplete="email" className={input} placeholder="tu@empresa.com" />
          </Field>
          <Field
            label="Contraseña"
            aside={
              <Link href="/recuperar" className="-my-2 inline-flex min-h-8 items-center text-xs font-medium text-ink-3 hover:text-ink">
                ¿La olvidaste?
              </Link>
            }
          >
            <input name="password" type="password" required autoComplete="current-password" className={input} />
          </Field>
          <Feedback state={pwState} />
          <button type="submit" disabled={pwPending} className={primary}>
            {pwPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Entrar
          </button>
        </form>
      ) : (
        <form action={mlAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <Field label="Email">
            <input name="email" type="email" required autoComplete="email" className={input} placeholder="tu@empresa.com" />
          </Field>
          <Feedback state={mlState} />
          <button type="submit" disabled={mlPending} className={primary}>
            {mlPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Mail className="h-4 w-4" aria-hidden />} Enviarme un enlace
          </button>
          <p className="text-xs text-ink-3">Te mandamos un enlace para entrar sin contraseña.</p>
        </form>
      )}
    </div>
  );
}

export function SignUpForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {});
  return (
    <div>
      <GoogleButton next={next} label="Registrarme con Google" />
      <Divider />
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <Field label="Nombre">
          <input name="name" required autoComplete="name" className={input} placeholder="Lucía" />
        </Field>
        <Field label="Email de trabajo">
          <input name="email" type="email" required autoComplete="email" className={input} placeholder="tu@empresa.com" />
        </Field>
        <Field label="Contraseña">
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className={input} placeholder="Mínimo 8 caracteres" />
        </Field>
        <label className="flex items-start gap-2.5 text-sm text-ink-2">
          <input type="checkbox" name="terms" required className="mt-0.5 h-4 w-4 accent-[var(--signal)]" />
          <span>
            Acepto los{" "}
            <Link href="/legal/terminos" className="font-medium text-ink underline">
              términos
            </Link>{" "}
            y la{" "}
            <Link href="/legal/privacidad" className="font-medium text-ink underline">
              política de privacidad
            </Link>
            .
          </span>
        </label>
        <Feedback state={state} />
        <button type="submit" disabled={pending} className={primary}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Empezar mi prueba gratis
        </button>
      </form>
    </div>
  );
}

export function ResetForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestReset, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="Email">
        <input name="email" type="email" required autoComplete="email" className={input} placeholder="tu@empresa.com" />
      </Field>
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={primary}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Enviarme el enlace
      </button>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="Nueva contraseña">
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={input} />
      </Field>
      <Field label="Repítela">
        <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={input} />
      </Field>
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={primary}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Guardar y entrar
      </button>
    </form>
  );
}
