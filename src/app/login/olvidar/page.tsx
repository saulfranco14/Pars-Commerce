"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import * as yup from "yup";
import { ArrowRight, Mail } from "lucide-react";
import { BrandPanel } from "@/features/auth/components/BrandPanel";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { resolveUserError } from "@/lib/errors/resolveUserError";

const forgotSchema = yup.object({
  email: yup
    .string()
    .required("El email es obligatorio")
    .email("Ingresa un email valido"),
});

type FieldErrors = Record<string, string>;

const inputBase =
  "input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:outline-none focus:ring-2";
const inputNormal = `${inputBase} focus:border-accent focus:ring-accent/20`;
const inputError = `${inputBase} border-red-400 focus:border-red-400 focus:ring-red-400/20`;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs text-red-500 dark:text-red-400" role="alert">
      {message}
    </p>
  );
}

export default function OlvidarPage() {
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await forgotSchema.validate({ email }, { abortEarly: false });
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const errors: FieldErrors = {};
        err.inner.forEach((e) => {
          if (e.path) errors[e.path] = e.message;
        });
        setFieldErrors(errors);
        setTouched(true);
        return;
      }
    }

    setFieldErrors({});
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(resolveUserError(data.error ?? null, "supabase"));
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="flex min-h-screen">
        <BrandPanel
          title="Revisa tu correo"
          subtitle="Te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y spam."
        />
        <div className="relative flex flex-1 items-center justify-center bg-background px-4 py-8">
          <div className="absolute right-4 top-4 z-10">
            <ThemeToggle />
          </div>
          <div className="w-full max-w-[400px] animate-auth-enter">
            <div className="mb-8 flex flex-col items-center lg:hidden">
              <div className="relative mb-3">
                <div
                  className="absolute inset-0 scale-150 rounded-3xl bg-accent opacity-25 blur-2xl"
                  aria-hidden
                />
                <Image
                  src="/android-chrome-192x192.png"
                  alt=""
                  width={64}
                  height={64}
                  className="relative h-16 w-16 rounded-2xl"
                  priority
                />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                Pars Commerce
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Mail className="h-5 w-5" aria-hidden />
              </div>
              <h1 className="text-xl font-bold text-foreground text-center sm:text-2xl">
                Revisa tu correo
              </h1>
              <p className="mt-2 text-sm text-muted-foreground text-center">
                Recibirás un enlace para restablecer tu contraseña. Revisa tu
                bandeja de entrada y spam.
              </p>
              <Link
                href="/login"
                className="mt-6 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent-hover active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 cursor-pointer"
              >
                Volver al login
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <BrandPanel
        title="Recupera tu cuenta"
        subtitle="Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña."
      />
      <div className="relative flex flex-1 items-center justify-center bg-background px-4 py-8">
        <div className="absolute right-4 top-4 z-10">
          <ThemeToggle />
        </div>
        <div className="relative w-full max-w-[400px] animate-auth-enter">
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="relative mb-3">
              <div
                className="absolute inset-0 scale-150 rounded-3xl bg-accent opacity-25 blur-2xl"
                aria-hidden
              />
              <Image
                src="/android-chrome-192x192.png"
                alt=""
                width={64}
                height={64}
                className="relative h-16 w-16 rounded-2xl"
                priority
              />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              Pars Commerce
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <Mail className="h-5 w-5 text-accent" aria-hidden />
            </div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              ¿Olvidaste tu contraseña?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ingresa tu email y te enviaremos un enlace para restablecerla
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              {error ? (
                <div
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400"
                  role="alert"
                >
                  {error}
                </div>
              ) : null}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  required
                  className={
                    touched && fieldErrors.email ? inputError : inputNormal
                  }
                  autoComplete="email"
                  placeholder="tu@email.com"
                  aria-invalid={!!(touched && fieldErrors.email)}
                />
                <FieldError message={touched ? fieldErrors.email : undefined} />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="group w-full min-h-[48px] rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent-hover active:scale-[0.98] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? "Enviando..." : "Enviar enlace"}
                {!loading && (
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link
                href="/login"
                className="font-semibold text-accent transition-colors hover:text-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded cursor-pointer"
              >
                Volver al login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
