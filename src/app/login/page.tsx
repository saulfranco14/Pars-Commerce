"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import * as yup from "yup";
import {
  ShoppingBag,
  BarChart3,
  CreditCard,
  Shield,
  ArrowRight,
  Lock,
} from "lucide-react";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { createClient } from "@/lib/supabase/client";

function parseHashParams() {
  if (typeof window === "undefined") return {};
  const hash = window.location.hash?.slice(1) ?? "";
  return Object.fromEntries(new URLSearchParams(hash));
}

const loginSchema = yup.object({
  email: yup
    .string()
    .required("El email es obligatorio")
    .email("Ingresa un email valido"),
  password: yup
    .string()
    .required("La contraseña es obligatoria")
    .min(6, "Minimo 6 caracteres"),
});

const setPasswordSchema = yup.object({
  newPassword: yup
    .string()
    .required("La contraseña es obligatoria")
    .min(6, "Minimo 6 caracteres"),
  confirmPassword: yup
    .string()
    .required("Confirma tu contraseña")
    .oneOf([yup.ref("newPassword")], "Las contraseñas no coinciden"),
});

type FieldErrors = Record<string, string>;

const HIGHLIGHTS = [
  {
    icon: ShoppingBag,
    text: "Gestiona productos y ordenes",
    accent: "bg-blue-500/10 text-blue-500 dark:text-blue-400",
  },
  {
    icon: BarChart3,
    text: "Dashboard de ventas en tiempo real",
    accent: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400",
  },
  {
    icon: CreditCard,
    text: "Pagos integrados con MercadoPago",
    accent: "bg-amber-500/10 text-amber-500 dark:text-amber-400",
  },
  {
    icon: Shield,
    text: "Seguro y confiable, 24/7",
    accent: "bg-rose-500/10 text-rose-500 dark:text-rose-400",
  },
];

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

function BrandPanel() {
  return (
    <div className="relative hidden lg:flex lg:flex-1 items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-accent/10 blur-[100px]"
        aria-hidden
      />

      <div className="relative z-10 max-w-sm px-8">
        <div className="flex items-center gap-3 mb-8">
          <Image
            src="/android-chrome-192x192.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10"
          />
          <span className="text-xl font-bold text-foreground">
            Pars Commerce
          </span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Bienvenido de vuelta
        </h2>
        <p className="mt-2 text-muted-foreground leading-relaxed">
          Accede a tu dashboard para gestionar tu negocio, revisar ordenes y
          hacer crecer tus ventas.
        </p>

        <div className="mt-8 space-y-3">
          {HIGHLIGHTS.map(({ icon: Icon, text, accent }) => (
            <div
              key={text}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-all duration-200 hover:shadow-soft"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent}`}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </div>
              <span className="text-sm text-foreground">{text}</span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-muted-foreground/60">
          Mas de 50 negocios ya confian en Pars Commerce
        </p>
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [inviteMode, setInviteMode] = useState<boolean | null>(null);
  const [setPasswordNew, setSetPasswordNew] = useState("");
  const [setPasswordConfirm, setSetPasswordConfirm] = useState("");
  const [setPasswordLoading, setSetPasswordLoading] = useState(false);
  const [setPasswordError, setSetPasswordError] = useState<string | null>(null);
  const [setPasswordFieldErrors, setSetPasswordFieldErrors] =
    useState<FieldErrors>({});
  const [setPasswordTouched, setSetPasswordTouched] = useState<
    Record<string, boolean>
  >({});

  const validateField = useCallback(
    async (field: string, value: string) => {
      try {
        await loginSchema.validateAt(field, {
          email,
          password,
          [field]: value,
        });
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      } catch (err) {
        if (err instanceof yup.ValidationError) {
          setFieldErrors((prev) => ({ ...prev, [field]: err.message }));
        }
      }
    },
    [email, password],
  );

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, field === "email" ? email : password);
  };

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

    try {
      await loginSchema.validate({ email, password }, { abortEarly: false });
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const errors: FieldErrors = {};
        const allTouched: Record<string, boolean> = {};
        err.inner.forEach((e) => {
          if (e.path) {
            errors[e.path] = e.message;
            allTouched[e.path] = true;
          }
        });
        setFieldErrors(errors);
        setTouched((prev) => ({ ...prev, ...allTouched }));
        return;
      }
    }

    setFieldErrors({});
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

    try {
      await setPasswordSchema.validate(
        { newPassword: setPasswordNew, confirmPassword: setPasswordConfirm },
        { abortEarly: false },
      );
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const errors: FieldErrors = {};
        const allTouched: Record<string, boolean> = {};
        err.inner.forEach((e) => {
          if (e.path) {
            errors[e.path] = e.message;
            allTouched[e.path] = true;
          }
        });
        setSetPasswordFieldErrors(errors);
        setSetPasswordTouched((prev) => ({ ...prev, ...allTouched }));
        return;
      }
    }

    setSetPasswordFieldErrors({});
    setSetPasswordLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: setPasswordNew,
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingBlock message="Cargando…" />
      </div>
    );
  }

  const errorBanner = (msg: string) => (
    <div
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 alert-error"
      role="alert"
    >
      {msg}
    </div>
  );

  // Invite mode — set password
  if (inviteMode === true) {
    return (
      <div className="flex min-h-screen">
        <BrandPanel />
        <div className="relative flex flex-1 items-center justify-center bg-background px-4 py-8">
          <div className="absolute right-4 top-4 z-10">
            <ThemeToggle />
          </div>
          <div className="w-full max-w-[400px]">
            {/* Mobile header */}
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <Image
                src="/android-chrome-192x192.png"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8"
                priority
              />
              <span className="text-lg font-bold text-foreground">
                Pars Commerce
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <Lock className="h-5 w-5 text-accent" aria-hidden />
              </div>
              <h1 className="text-xl font-bold text-foreground text-center sm:text-2xl">
                Establece tu contraseña
              </h1>
              <p className="mt-2 text-sm text-muted-foreground text-center">
                Crea una contraseña para acceder a tu cuenta
              </p>
              <form
                onSubmit={handleSetPassword}
                className="mt-6 space-y-4"
                noValidate
              >
                {setPasswordError && errorBanner(setPasswordError)}
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
                    className={`${inputNormal} text-muted`}
                    aria-readonly
                  />
                </div>
                <div>
                  <PasswordInput
                    id="new-password"
                    label="Nueva contraseña"
                    name="new-password"
                    value={setPasswordNew}
                    onChange={(e) => {
                      setSetPasswordNew(e.target.value);
                      if (setPasswordTouched.newPassword) {
                        setPasswordSchema
                          .validateAt("newPassword", {
                            newPassword: e.target.value,
                            confirmPassword: setPasswordConfirm,
                          })
                          .then(() =>
                            setSetPasswordFieldErrors((p) => {
                              const n = { ...p };
                              delete n.newPassword;
                              return n;
                            }),
                          )
                          .catch((err) =>
                            setSetPasswordFieldErrors((p) => ({
                              ...p,
                              newPassword: err.message,
                            })),
                          );
                      }
                    }}
                    onBlur={() => {
                      setSetPasswordTouched((p) => ({
                        ...p,
                        newPassword: true,
                      }));
                      setPasswordSchema
                        .validateAt("newPassword", {
                          newPassword: setPasswordNew,
                          confirmPassword: setPasswordConfirm,
                        })
                        .then(() =>
                          setSetPasswordFieldErrors((p) => {
                            const n = { ...p };
                            delete n.newPassword;
                            return n;
                          }),
                        )
                        .catch((err) =>
                          setSetPasswordFieldErrors((p) => ({
                            ...p,
                            newPassword: err.message,
                          })),
                        );
                    }}
                    required
                    minLength={6}
                    inputClassName={
                      setPasswordTouched.newPassword &&
                      setPasswordFieldErrors.newPassword
                        ? inputError
                        : inputNormal
                    }
                    autoComplete="new-password"
                    placeholder="Minimo 6 caracteres"
                    aria-invalid={!!setPasswordFieldErrors.newPassword}
                  />
                  <FieldError
                    message={
                      setPasswordTouched.newPassword
                        ? setPasswordFieldErrors.newPassword
                        : undefined
                    }
                  />
                </div>
                <div>
                  <PasswordInput
                    id="new-password-confirm"
                    label="Confirmar contraseña"
                    name="new-password-confirm"
                    value={setPasswordConfirm}
                    onChange={(e) => {
                      setSetPasswordConfirm(e.target.value);
                      if (setPasswordTouched.confirmPassword) {
                        setPasswordSchema
                          .validateAt("confirmPassword", {
                            newPassword: setPasswordNew,
                            confirmPassword: e.target.value,
                          })
                          .then(() =>
                            setSetPasswordFieldErrors((p) => {
                              const n = { ...p };
                              delete n.confirmPassword;
                              return n;
                            }),
                          )
                          .catch((err) =>
                            setSetPasswordFieldErrors((p) => ({
                              ...p,
                              confirmPassword: err.message,
                            })),
                          );
                      }
                    }}
                    onBlur={() => {
                      setSetPasswordTouched((p) => ({
                        ...p,
                        confirmPassword: true,
                      }));
                      setPasswordSchema
                        .validateAt("confirmPassword", {
                          newPassword: setPasswordNew,
                          confirmPassword: setPasswordConfirm,
                        })
                        .then(() =>
                          setSetPasswordFieldErrors((p) => {
                            const n = { ...p };
                            delete n.confirmPassword;
                            return n;
                          }),
                        )
                        .catch((err) =>
                          setSetPasswordFieldErrors((p) => ({
                            ...p,
                            confirmPassword: err.message,
                          })),
                        );
                    }}
                    required
                    minLength={6}
                    inputClassName={
                      setPasswordTouched.confirmPassword &&
                      setPasswordFieldErrors.confirmPassword
                        ? inputError
                        : inputNormal
                    }
                    autoComplete="new-password"
                    aria-invalid={!!setPasswordFieldErrors.confirmPassword}
                  />
                  <FieldError
                    message={
                      setPasswordTouched.confirmPassword
                        ? setPasswordFieldErrors.confirmPassword
                        : undefined
                    }
                  />
                </div>
                <button
                  type="submit"
                  disabled={setPasswordLoading}
                  className="group w-full min-h-[48px] rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 flex items-center justify-center gap-2"
                >
                  {setPasswordLoading ? "Guardando..." : "Guardar y entrar"}
                  {!setPasswordLoading && (
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal login
  return (
    <div className="flex min-h-screen">
      <BrandPanel />
      <div className="relative flex flex-1 items-center justify-center bg-background px-4 py-8">
        <div className="absolute right-4 top-4 z-10">
          <ThemeToggle />
        </div>
        {/* Mobile background decoration */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] lg:hidden"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
          aria-hidden
        />
        <div className="relative w-full max-w-[400px]">
          {/* Mobile header */}
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <Image
              src="/android-chrome-192x192.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8"
              priority
            />
            <span className="text-lg font-bold text-foreground">
              Pars Commerce
            </span>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-border bg-surface p-6  sm:p-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              Iniciar sesion
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ingresa con tu email y contraseña
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              {error && errorBanner(error)}
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
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched.email) validateField("email", e.target.value);
                  }}
                  onBlur={() => handleBlur("email")}
                  required
                  className={
                    touched.email && fieldErrors.email
                      ? inputError
                      : inputNormal
                  }
                  autoComplete="email"
                  placeholder="tu@email.com"
                  aria-invalid={!!(touched.email && fieldErrors.email)}
                />
                <FieldError
                  message={touched.email ? fieldErrors.email : undefined}
                />
              </div>
              <div>
                <PasswordInput
                  id="password"
                  label="Contraseña"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (touched.password)
                      validateField("password", e.target.value);
                  }}
                  onBlur={() => handleBlur("password")}
                  required
                  inputClassName={
                    touched.password && fieldErrors.password
                      ? inputError
                      : inputNormal
                  }
                  autoComplete="current-password"
                  aria-invalid={!!(touched.password && fieldErrors.password)}
                />
                <FieldError
                  message={touched.password ? fieldErrors.password : undefined}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="group w-full min-h-[48px] rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 flex items-center justify-center gap-2"
              >
                {loading ? "Entrando..." : "Entrar"}
                {!loading && (
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">o</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <Link
                href="/registro"
                className="font-semibold text-accent transition-colors hover:text-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded"
              >
                Registrate gratis
              </Link>
            </p>
          </div>

          {/* Mobile trust signal */}
          <div className="mt-6 flex items-center justify-center gap-2 lg:hidden">
            <Shield
              className="h-3.5 w-3.5 text-muted-foreground/50"
              aria-hidden
            />
            <span className="text-xs text-muted-foreground/50">
              Conexion segura y cifrada
            </span>
          </div>
        </div>
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
