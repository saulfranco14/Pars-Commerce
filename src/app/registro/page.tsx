"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as yup from "yup";
import {
  Check,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { BrandPanel } from "@/features/auth/components/BrandPanel";
import { MobileAuthHeader } from "@/features/auth/components/MobileAuthHeader";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { registroSchema } from "@/features/auth/validations/registroForm";
import { BENEFITS } from "@/features/auth/constants/benefits";
import { resolveUserError } from "@/lib/errors/resolveUserError";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "input-form mt-1 block w-full min-h-11 rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

// Título, lista y remate propios del registro — mismo molde que el panel de
// login (`BrandPanel`), contenido distinto porque responde a otra pregunta
// ("por qué registrarme" en vez de "por qué confiar").
const REGISTRO_BRAND = {
  title: "Digitaliza tu negocio hoy",
  subtitle:
    "Crea tu tienda en línea, gestiona productos, recibe pedidos y cobra con tarjeta. Empiezas gratis y creces cuando tu operación lo pida.",
  items: BENEFITS,
  footnote: "Sin tarjeta de crédito para empezar. Cambia o cancela desde tu panel.",
};

// Único bloque que login no tiene — se pasa como children al panel
// compartido en vez de duplicar todo el componente por esta diferencia.
const registroPricingHighlight = (
  <div className="mt-8 rounded-xl border border-accent/20 bg-accent/5 p-4">
    <div className="mb-2 flex items-center gap-2">
      <Sparkles className="h-4 w-4 text-accent" aria-hidden />
      <span className="text-sm font-semibold text-foreground">
        Plan Gratis — $0/mes
      </span>
    </div>
    <div className="space-y-1.5">
      {["Hasta 5 mesas activas", "Cobros con tarjeta", "Tu propia tienda web"].map(
        (f) => (
          <div key={f} className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
            <span className="text-xs text-muted-foreground">{f}</span>
          </div>
        ),
      )}
    </div>
  </div>
);

function SuccessMessage({
  email,
  onStart,
  entering,
  startError,
}: {
  email: string;
  onStart: () => void;
  entering: boolean;
  startError: string | null;
}) {
  return (
    <div className="px-2 text-center sm:px-4 lg:px-0">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
        <CheckCircle2 className="h-8 w-8 text-emerald-600" aria-hidden />
      </div>
      <h2 className="text-2xl font-bold text-foreground">¡Tu cuenta ya fue creada!</h2>
      <p className="mt-2 text-muted-foreground">Todo está listo para comenzar.</p>
      <p className="mt-1 font-semibold text-foreground break-all">{email}</p>
      <p className="mt-4 text-sm text-muted-foreground">
        El siguiente paso es crear tu negocio y elegir cómo quieres empezar a vender.
      </p>
      <div className="mt-6 space-y-3">
        {startError && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700" role="alert">
            {startError}
          </p>
        )}
        <button
          type="button"
          onClick={onStart}
          disabled={entering}
          className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground shadow-sm shadow-accent/15 transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          {entering ? "Preparando tu espacio…" : "Crear mi negocio"}
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
  const [entering, setEntering] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

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

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(
          payload.error || "No pudimos crear tu cuenta"
        );
      }

      setRegisteredEmail(email.trim());
      setSuccess(true);
    } catch (err: unknown) {
      console.error("Error en registro:", err);
      setError(resolveUserError(err, null));
    } finally {
      setLoading(false);
    }
  }

  async function handleStart() {
    setEntering(true);
    setStartError(null);
    const { error: signInError } = await createClient().auth.signInWithPassword({
      email: registeredEmail,
      password,
    });
    if (signInError) {
      setStartError(resolveUserError(signInError, "supabase"));
      setEntering(false);
      return;
    }
    router.push("/dashboard/crear-negocio");
    router.refresh();
  }

  // Mostrar mensaje de éxito
  if (success) {
    return (
      <div className="flex min-h-screen flex-col lg:flex-row">
        <BrandPanel {...REGISTRO_BRAND}>{registroPricingHighlight}</BrandPanel>
        <div className="relative flex min-h-dvh flex-1 flex-col items-center justify-center bg-background px-4 py-6 sm:py-8">
          <MobileAuthHeader accountHref="/login" accountLabel="Iniciar sesión" />
          <div
            className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] lg:hidden"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
            aria-hidden
          />
          <div className="relative w-full max-w-md animate-auth-enter pb-8 pt-20 sm:pb-0 lg:pt-0">
            <SuccessMessage
              email={registeredEmail}
              onStart={() => void handleStart()}
              entering={entering}
              startError={startError}
            />
          </div>
        </div>
      </div>
    );
  }

  // Formulario de registro
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <BrandPanel {...REGISTRO_BRAND} animated>
        {registroPricingHighlight}
      </BrandPanel>
      <div className="relative flex min-h-dvh flex-1 flex-col items-center justify-center bg-background px-4 py-6 sm:py-8">
        <MobileAuthHeader accountHref="/login" accountLabel="Iniciar sesión" />
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
        <div className="relative w-full max-w-sm animate-auth-enter pb-8 pt-20 sm:pb-0 lg:pt-0">
          <div className="px-2 sm:px-4 lg:px-0">
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
                className="group w-full min-h-12 cursor-pointer rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 flex items-center justify-center gap-2"
              >
                {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
                {!loading && (
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                )}
              </button>

              {/* Los términos dicen que la cuenta se crea aceptándolos, así que
                  el consentimiento tiene que estar visible aquí. */}
              <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
                Al crear tu cuenta aceptas los{" "}
                <Link
                  href="/terminos"
                  className="font-medium text-accent underline-offset-2 hover:underline"
                >
                  Términos de servicio
                </Link>{" "}
                y el{" "}
                <Link
                  href="/privacidad"
                  className="font-medium text-accent underline-offset-2 hover:underline"
                >
                  Aviso de Privacidad
                </Link>
                .
              </p>
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
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
