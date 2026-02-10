"use client";

import { Suspense, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import logo from "@/assets/logo.png";

function parseHashParams() {
  if (typeof window === "undefined") return {};
  const hash = window.location.hash?.slice(1) ?? "";
  return Object.fromEntries(new URLSearchParams(hash));
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inviteMode, setInviteMode] = useState<boolean | null>(null);
  const [setPasswordNew, setSetPasswordNew] = useState("");
  const [setPasswordConfirm, setSetPasswordConfirm] = useState("");
  const [setPasswordLoading, setSetPasswordLoading] = useState(false);
  const [setPasswordError, setSetPasswordError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const params = parseHashParams();
    const hasToken = !!params.access_token;
    const isInvite = params.type === "invite";

    if (hasToken && params.access_token && params.refresh_token) {
      supabase.auth
        .setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        })
        .then(({ data: { session } }) => {
          if (session && isInvite) {
            setInviteMode(true);
            setEmail(session.user.email ?? "");
          } else if (session) {
            window.history.replaceState(null, "", window.location.pathname);
            window.location.href = next;
          }
        })
        .catch(() => setInviteMode(false));
    } else {
      setInviteMode(false);
    }
  }, [router, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function handleSetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSetPasswordError(null);
    const form = e.currentTarget;
    const newPassword =
      (form.elements.namedItem("new-password") as HTMLInputElement)?.value ??
      "";
    const confirmPassword =
      (form.elements.namedItem("new-password-confirm") as HTMLInputElement)
        ?.value ?? "";
    if (newPassword.length < 6) {
      setSetPasswordError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setSetPasswordError("Las contraseñas no coinciden");
      return;
    }
    setSetPasswordLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setSetPasswordLoading(false);
    if (updateError) {
      setSetPasswordError(updateError.message);
      return;
    }
    window.history.replaceState(null, "", window.location.pathname);
    window.location.href = next;
  }

  if (inviteMode === null) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <Image
          src={logo}
          alt="Pars"
          width={140}
          height={120}
          className="h-auto w-[120px] sm:w-[140px]"
          priority
        />
        <LoadingBlock message="Cargando…" />
      </div>
    );
  }

  const inputClass =
    "input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";
  const errorClass =
    "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700";

  const logoBlock = (
    <div className="flex justify-center">
      <Image
        src={logo}
        alt="Pars"
        width={140}
        height={120}
        className="h-auto w-[120px] sm:w-[140px]"
        priority
      />
    </div>
  );

  if (inviteMode === true) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-8">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm rounded-xl border border-border bg-surface-raised p-6 shadow-card sm:p-8">
          {logoBlock}
          <h1 className="mt-6 text-xl font-semibold text-foreground">
            Establece tu contraseña
          </h1>
          <p className="mt-1 text-sm text-muted">
            Crea una contraseña para acceder a tu cuenta
          </p>
          <form onSubmit={handleSetPassword} className="mt-6 space-y-4">
            {setPasswordError && (
              <div className={errorClass} role="alert">
                {setPasswordError}
              </div>
            )}
            <div>
              <label
                htmlFor="invite-email"
                className="block text-sm font-medium text-muted-foreground"
              >
                Email
              </label>
              <input
                id="invite-email"
                type="email"
                name="email"
                value={email}
                readOnly
                autoComplete="off"
                className={`${inputClass} text-muted`}
                aria-readonly
              />
            </div>
            <div>
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-muted-foreground"
              >
                Nueva contraseña
              </label>
              <input
                id="new-password"
                name="new-password"
                type="password"
                value={setPasswordNew}
                onChange={(e) => setSetPasswordNew(e.target.value)}
                required
                minLength={6}
                className={inputClass}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                aria-invalid={!!setPasswordError}
              />
            </div>
            <div>
              <label
                htmlFor="new-password-confirm"
                className="block text-sm font-medium text-muted-foreground"
              >
                Confirmar contraseña
              </label>
              <input
                id="new-password-confirm"
                name="new-password-confirm"
                type="password"
                value={setPasswordConfirm}
                onChange={(e) => setSetPasswordConfirm(e.target.value)}
                required
                minLength={6}
                className={inputClass}
                autoComplete="new-password"
                aria-invalid={!!setPasswordError}
              />
            </div>
            <button
              type="submit"
              disabled={setPasswordLoading}
              className="w-full min-h-[44px] rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              {setPasswordLoading ? "Guardando..." : "Guardar y entrar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface-raised p-6 shadow-card sm:p-8">
        {logoBlock}
        <h1 className="mt-6 text-xl font-semibold text-foreground">
          Iniciar sesión
        </h1>
        <p className="mt-1 text-sm text-muted">
          Ingresa con tu email y contraseña
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className={errorClass} role="alert">
              {error}
            </div>
          )}
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
              required
              className={inputClass}
              autoComplete="email"
              aria-invalid={!!error}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-muted-foreground"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
              autoComplete="current-password"
              aria-invalid={!!error}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[44px] rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          ¿No tienes cuenta?{" "}
          <Link
            href="/registro"
            className="font-medium text-foreground underline hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <LoadingBlock message="Cargando…" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
