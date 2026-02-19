"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as yup from "yup";
import {
  Zap,
  Store,
  TrendingUp,
  Check,
  ArrowRight,
  Sparkles,
  Mail,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { registroSchema } from "@/lib/registroValidation";

const BENEFITS = [
  { icon: Zap, text: "Crea tu tienda en 2 minutos" },
  { icon: Store, text: "Tu propia URL para compartir" },
  { icon: TrendingUp, text: "Dashboard de ventas incluido" },
];

const inputClass =
  "input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

function BrandPanel() {
  return (
    <div className="relative hidden lg:flex lg:flex-1 items-center justify-center overflow-hidden">
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden
      />
      {/* Glow blob */}
      <div
        className="absolute bottom-1/3 left-1/2 -translate-x-1/2 translate-y-1/2 h-80 w-80 rounded-full bg-accent/10 blur-[100px]"
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
          Digitaliza tu negocio hoy
        </h2>
        <p className="mt-2 text-muted-foreground leading-relaxed">
          Crea tu tienda en linea, gestiona productos, recibe pedidos y cobra
          con MercadoPago. Todo gratis.
        </p>

        <div className="mt-8 space-y-3">
          {BENEFITS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Icon className="h-4 w-4 text-accent" aria-hidden />
              </div>
              <span className="text-sm text-foreground">{text}</span>
            </div>
          ))}
        </div>

        {/* Pricing highlight */}
        <div className="mt-8 rounded-xl border border-accent/20 bg-accent/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-accent" aria-hidden />
            <span className="text-sm font-semibold text-foreground">
              Plan Gratis — $0/mes
            </span>
          </div>
          <div className="space-y-1.5">
            {[
              "Productos ilimitados",
              "Pagos con MercadoPago",
              "Tu propia tienda web",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <Check
                  className="h-3.5 w-3.5 text-accent shrink-0"
                  aria-hidden
                />
                <span className="text-xs text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-xs text-muted-foreground/60">
          Sin tarjeta de credito. Sin comisiones de plataforma.
        </p>
      </div>
    </div>
  );
}

function SuccessMessage({
  email,
  onClose,
}: {
  email: string;
  onClose: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
        <Mail className="h-8 w-8 text-emerald-500" aria-hidden />
      </div>
      <h2 className="text-2xl font-bold text-foreground">¡Registro exitoso!</h2>
      <p className="mt-2 text-muted-foreground">
        Hemos enviado un correo de confirmación a:
      </p>
      <p className="mt-1 font-semibold text-foreground break-all">{email}</p>
      <p className="mt-4 text-sm text-muted-foreground">
        Revisa tu bandeja de entrada y haz clic en el enlace para activar tu
        cuenta.
      </p>
      <div className="mt-6 space-y-3">
        <Link
          href="/login"
          className="block w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          Ir al login
        </Link>
        <button
          onClick={onClose}
          className="block w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-raised"
        >
          Registrar otra cuenta
        </button>
      </div>
    </div>
  );
}

export default function RegistroPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Validación
    try {
      await registroSchema.validate({ email, password }, { abortEarly: false });
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const errors: Record<string, string> = {};
        err.inner.forEach((e) => {
          if (e.path) errors[e.path] = e.message;
        });
        setFieldErrors(errors);
        return;
      }
      throw err;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Error al enviar el correo de confirmación",
        );
      }

      setRegisteredEmail(email.trim());
      setSuccess(true);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Error desconocido");
      console.error("Error en registro:", error);
      setError(error.message || "Error al registrar usuario. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const logoBlock = (
    <div className="flex items-center gap-2.5">
      <Image
        src="/android-chrome-192x192.png"
        alt=""
        width={32}
        height={32}
        className="h-8 w-8"
        priority
      />
      <span className="text-lg font-bold text-foreground">Pars Commerce</span>
    </div>
  );

  // Mostrar mensaje de éxito
  if (success) {
    return (
      <div className="flex min-h-screen flex-col lg:flex-row">
        <BrandPanel />
        <div className="relative flex min-h-dvh flex-1 flex-col items-center justify-center bg-background px-4 py-6 sm:py-8">
          <div className="absolute right-4 top-4 z-20">
            <ThemeToggle />
          </div>
          <div
            className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] lg:hidden"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
            aria-hidden
          />
          <div className="relative w-full max-w-md pb-8 sm:pb-0">
            <div className="mb-6 lg:hidden">{logoBlock}</div>
            <SuccessMessage
              email={registeredEmail}
              onClose={() => {
                setSuccess(false);
                setEmail("");
                setPassword("");
                setRegisteredEmail("");
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Formulario de registro
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <BrandPanel />
      <div className="relative flex min-h-dvh flex-1 flex-col items-center justify-center bg-background px-4 py-6 sm:py-8">
        <div className="absolute right-4 top-4 z-20">
          <ThemeToggle />
        </div>
        {/* Mobile subtle background decoration */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] lg:hidden"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
          aria-hidden
        />
        <div className="relative w-full max-w-sm pb-8 sm:pb-0">
          <div className="mb-6 lg:hidden">{logoBlock}</div>
          <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              Crear cuenta
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Regístrate gratis y empieza a vender en minutos
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-4 sm:mt-8"
              noValidate
            >
              {error && (
                <div
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 alert-error"
                  role="alert"
                >
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
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email)
                      setFieldErrors((p) => ({ ...p, email: "" }));
                  }}
                  className={`${inputClass} ${fieldErrors.email ? "border-red-500 focus:ring-red-500/20" : ""}`}
                  autoComplete="email"
                  placeholder="tu@email.com"
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={
                    fieldErrors.email ? "email-error" : undefined
                  }
                />
                {fieldErrors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-600">
                    {fieldErrors.email}
                  </p>
                )}
              </div>
              <div>
                <PasswordInput
                  id="password"
                  label="Contraseña"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password)
                      setFieldErrors((p) => ({ ...p, password: "" }));
                  }}
                  required
                  minLength={6}
                  inputClassName={`${inputClass} ${fieldErrors.password ? "border-red-500 focus:ring-red-500/20" : ""}`}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  aria-invalid={!!fieldErrors.password}
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.password}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="group w-full min-h-[48px] rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 flex items-center justify-center gap-2"
              >
                {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
                {!loading && (
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                )}
              </button>
            </form>

            {/* Mobile benefits */}
            <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3 sm:gap-x-8 lg:hidden">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <span className="text-xs text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3 lg:mt-8">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">o</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/login"
                className="font-semibold text-accent transition-colors hover:text-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded"
              >
                Iniciar sesion
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
