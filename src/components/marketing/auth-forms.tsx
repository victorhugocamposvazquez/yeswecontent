"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Input, Label } from "@/components/ui";
import {
  requestReset,
  sendMagicLink,
  signIn,
  signInWithGoogle,
  signUp,
  updatePassword,
  type AuthState,
} from "@/app/(auth)/actions";

function Feedback({ state }: { state: AuthState }) {
  if (state.error)
    return (
      <p role="alert" className="rounded-xl border border-bad/30 bg-bad-soft px-4 py-2.5 text-sm font-medium text-bad">
        {state.error}
      </p>
    );
  if (state.message)
    return (
      <p role="status" className="rounded-xl border border-ok/30 bg-ok-soft px-4 py-2.5 text-sm font-medium text-ok">
        {state.message}
      </p>
    );
  return null;
}

function Field({ label, htmlFor, children, aside }: { label: string; htmlFor: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label htmlFor={htmlFor}>{label}</Label>
        {aside}
      </div>
      {children}
    </div>
  );
}

export function GoogleButton({ next, label = "Continuar con Google" }: { next: string; label?: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="next" value={next} />
      <Button type="submit" variant="outline" size="lg" className="w-full gap-3">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z" />
          <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
          <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
          <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
        </svg>
        {label}
      </Button>
    </form>
  );
}

const Divider = ({ text = "o con tu email" }: { text?: string }) => (
  <div className="my-5 flex items-center gap-3 text-xs text-ink-3">
    <span className="h-px flex-1 bg-line" /> {text} <span className="h-px flex-1 bg-line" />
  </div>
);

const submit = "h-11 w-full";

export function SignInForm({ next, initialError }: { next: string; initialError?: string }) {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [pwState, pwAction, pwPending] = useActionState<AuthState, FormData>(signIn, initialError ? { error: initialError } : {});
  const [mlState, mlAction, mlPending] = useActionState<AuthState, FormData>(sendMagicLink, {});

  return (
    <div>
      <GoogleButton next={next} />
      <Divider />
      <div role="tablist" aria-label="Forma de entrar" className="mb-5 grid grid-cols-2 rounded-xl border border-line bg-paper-2 p-1 text-sm font-semibold">
        {(["password", "magic"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn("h-9 rounded-lg transition-colors duration-150", mode === m ? "bg-card text-ink shadow-[var(--shadow-xs)]" : "text-ink-2 hover:text-ink")}
          >
            {m === "password" ? "Contraseña" : "Enlace mágico"}
          </button>
        ))}
      </div>
      {mode === "password" ? (
        <form action={pwAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <Field label="Email" htmlFor="si-email">
            <Input id="si-email" name="email" type="email" required autoComplete="email" placeholder="tu@empresa.com" className="h-11" />
          </Field>
          <Field
            label="Contraseña"
            htmlFor="si-password"
            aside={
              <Link href="/recuperar" className="-my-1 mb-1.5 inline-flex min-h-7 items-center text-xs font-medium text-ink-3 transition-colors duration-150 hover:text-ink">
                ¿La olvidaste?
              </Link>
            }
          >
            <Input id="si-password" name="password" type="password" required autoComplete="current-password" className="h-11" />
          </Field>
          <Feedback state={pwState} />
          <Button type="submit" size="lg" disabled={pwPending} className={submit}>
            {pwPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Entrar
          </Button>
        </form>
      ) : (
        <form action={mlAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <Field label="Email" htmlFor="ml-email">
            <Input id="ml-email" name="email" type="email" required autoComplete="email" placeholder="tu@empresa.com" className="h-11" />
          </Field>
          <Feedback state={mlState} />
          <Button type="submit" size="lg" disabled={mlPending} className={submit}>
            {mlPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Mail className="h-4 w-4" aria-hidden />} Enviarme un enlace
          </Button>
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
        <Field label="Nombre" htmlFor="su-name">
          <Input id="su-name" name="name" required autoComplete="name" placeholder="Lucía" className="h-11" />
        </Field>
        <Field label="Email de trabajo" htmlFor="su-email">
          <Input id="su-email" name="email" type="email" required autoComplete="email" placeholder="tu@empresa.com" className="h-11" />
        </Field>
        <Field label="Contraseña" htmlFor="su-password">
          <Input id="su-password" name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="Mínimo 8 caracteres" className="h-11" />
        </Field>
        <label className="flex items-start gap-2.5 text-sm text-ink-2">
          <input type="checkbox" name="terms" required className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--signal)]" />
          <span>
            Acepto los{" "}
            <Link href="/legal/terminos" className="font-medium text-ink underline underline-offset-2">
              términos
            </Link>{" "}
            y la{" "}
            <Link href="/legal/privacidad" className="font-medium text-ink underline underline-offset-2">
              política de privacidad
            </Link>
            .
          </span>
        </label>
        <Feedback state={state} />
        <Button type="submit" size="lg" disabled={pending} className={submit}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Empezar mi prueba gratis
        </Button>
      </form>
    </div>
  );
}

export function ResetForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestReset, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="Email" htmlFor="rs-email">
        <Input id="rs-email" name="email" type="email" required autoComplete="email" placeholder="tu@empresa.com" className="h-11" />
      </Field>
      <Feedback state={state} />
      <Button type="submit" size="lg" disabled={pending} className={submit}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Enviarme el enlace
      </Button>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="Nueva contraseña" htmlFor="np-password">
        <Input id="np-password" name="password" type="password" required minLength={8} autoComplete="new-password" className="h-11" />
      </Field>
      <Field label="Repítela" htmlFor="np-confirm">
        <Input id="np-confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="h-11" />
      </Field>
      <Feedback state={state} />
      <Button type="submit" size="lg" disabled={pending} className={submit}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Guardar y entrar
      </Button>
    </form>
  );
}
