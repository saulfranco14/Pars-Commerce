"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
      <div className="min-h-screen flex items-center justify-center bg-zinc-100">
        <p className="text-zinc-600">Cargando...</p>
      </div>
    );
  }

  if (inviteMode === true) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100">
        <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">
            Establece tu contraseña
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Crea una contraseña para acceder a tu cuenta
          </p>
          <form onSubmit={handleSetPassword} className="mt-6 space-y-4">
            {setPasswordError && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {setPasswordError}
              </div>
            )}
            <div>
              <label
                htmlFor="invite-email"
                className="block text-sm font-medium text-zinc-700"
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
                className="mt-1 block w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-500"
              />
            </div>
            <div>
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-zinc-700"
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
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label
                htmlFor="new-password-confirm"
                className="block text-sm font-medium text-zinc-700"
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
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              disabled={setPasswordLoading}
              className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {setPasswordLoading ? "Guardando..." : "Guardar y entrar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Ingresa con tu email y contraseña
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              autoComplete="email"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-600">
          ¿No tienes cuenta?{" "}
          <Link
            href="/registro"
            className="font-medium text-zinc-900 underline"
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
        <div className="min-h-screen flex items-center justify-center bg-zinc-100">
          <p className="text-zinc-600">Cargando...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
