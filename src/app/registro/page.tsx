"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import * as yup from "yup";
import {
  Check,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Loader2,
  PackageCheck,
  Store,
  ShieldCheck,
} from "lucide-react";
import { BrandPanel } from "@/features/auth/components/BrandPanel";
import { MobileAuthHeader } from "@/features/auth/components/MobileAuthHeader";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { registroSchema } from "@/features/auth/validations/registroForm";
import { BENEFITS } from "@/features/auth/constants/benefits";
import { resolveUserError } from "@/lib/errors/resolveUserError";
import { createClient } from "@/lib/supabase/client";
import { track } from "@vercel/analytics";
import { parseRegistrationIntent } from "@/features/auth/registrationIntent";
import { getSolutionByVertical } from "@/features/solutions/solutionCatalog";
import { PLAN_PRESENTATION } from "@/features/landing/constants/pricing";
import { formatMexicanPhoneInput, isValidMexicanPhone } from "@/lib/phone";
import { deriveSlug } from "@/features/onboarding/helpers/deriveSlug";
import { create as createTenant } from "@/services/tenantsService";
import { TlacoLogo } from "@/components/brand/TlacoLogo";

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
function RegistroPricingHighlight({ plan }: { plan: keyof typeof PLAN_PRESENTATION }) {
  const name = plan === "free" ? "Gratis" : plan === "operation" ? "Operación" : plan === "growth" ? "Crecimiento" : "Escala";
  return (
  <div className="mt-8 rounded-xl border border-accent/20 bg-accent/5 p-4">
    <div className="mb-2 flex items-center gap-2">
      <Sparkles className="h-4 w-4 text-accent" aria-hidden />
      <span className="text-sm font-semibold text-foreground">
        Plan considerado: {name}
      </span>
    </div>
    <div className="space-y-1.5">
      {["No se cobra al crear la cuenta", "No necesitas tarjeta para iniciar", "Sólo se activa con tu confirmación"].map(
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
}

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
      <p className="mt-2 text-muted-foreground">Estamos preparando tu negocio con las decisiones que ya tomaste.</p>
      <p className="mt-1 font-semibold text-foreground break-all">{email}</p>
      <p className="mt-4 text-sm text-muted-foreground">
        Tu sitio nacerá publicado; los pedidos se abrirán al terminar la revisión guiada.
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
          {entering ? "Preparando tu negocio…" : "Continuar la preparación"}
        </button>
      </div>
    </div>
  );
}

const PREPARATION_STEPS = [
  { title: "Protegemos tu acceso", detail: "Tu cuenta y contacto quedan listos." },
  { title: "Cargamos tu punto de partida", detail: "Aplicamos el giro, apariencia y catálogo que elegiste." },
  { title: "Publicamos tu enlace", detail: "Tu tienda nace lista para completar su preparación." },
];

function SolutionRegistrationSuccess({
  email,
  businessName,
  preparationStage,
  entering,
  startError,
  onContinue,
}: {
  email: string;
  businessName: string;
  preparationStage: number;
  entering: boolean;
  startError: string | null;
  onContinue: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="flex min-h-16 items-center justify-between border-b border-border-soft px-5 sm:px-8"><TlacoLogo size="md" /><span className="text-sm font-semibold text-muted-foreground">Cuenta creada</span></header>
      <main className="flex flex-1 items-center px-5 py-8 sm:py-10">
        <section className="mx-auto w-full max-w-md" aria-live="polite">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            {entering ? <Loader2 className="h-7 w-7 animate-spin" aria-hidden /> : <PackageCheck className="h-7 w-7" aria-hidden />}
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-accent">Preparando {businessName}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Tu tienda está tomando forma.</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Conservamos tus decisiones para que no tengas que configurar todo desde cero.</p>
          <p className="mt-3 text-sm font-semibold text-foreground break-all">{email}</p>

          <ol className="mt-7 space-y-3">
            {PREPARATION_STEPS.map((item, index) => {
              const complete = preparationStage > index;
              const active = preparationStage === index && entering;
              return (
                <li key={item.title} className={`flex min-h-18 items-center gap-3 rounded-2xl border p-4 transition-colors ${complete ? "border-emerald-200 bg-emerald-50/60" : active ? "border-accent/35 bg-accent/[0.045]" : "border-border bg-white"}`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${complete ? "bg-emerald-500 text-white" : active ? "bg-accent text-white" : "bg-border-soft text-muted"}`}>
                    {complete ? <Check className="h-4 w-4" aria-hidden /> : active ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <span className="text-xs font-bold">{index + 1}</span>}
                  </span>
                  <span className="min-w-0"><span className="block text-sm font-bold text-foreground">{item.title}</span><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{item.detail}</span></span>
                </li>
              );
            })}
          </ol>

          {startError ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert"><p>{startError}</p><button type="button" onClick={onContinue} className="mt-3 min-h-11 rounded-lg bg-foreground px-4 text-sm font-bold text-white">Intentar de nuevo</button></div> : null}
        </section>
      </main>
      <RegistrationStepDots />
    </div>
  );
}

function RegistrationStepDots() {
  return (
    <div className="flex justify-center gap-1.5 pb-6" aria-label="Paso 4 de 4">
      {[0, 1, 2, 3].map((dot) => <span key={dot} className={`h-1.5 rounded-full ${dot === 3 ? "w-7 bg-foreground" : "w-1.5 bg-border"}`} />)}
    </div>
  );
}

function SolutionRegistrationForm({
  businessName,
  email,
  phone,
  password,
  error,
  fieldErrors,
  loading,
  onEmailChange,
  onPhoneChange,
  onPasswordChange,
  onSubmit,
}: {
  businessName: string;
  email: string;
  phone: string;
  password: string;
  error: string | null;
  fieldErrors: Record<string, string>;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const [phoneTouched, setPhoneTouched] = useState(false);
  const phoneDigits = phone.replace(/\D/g, "");
  const livePhoneError = fieldErrors.phone || (phoneTouched && !isValidMexicanPhone(phone) ? "Escribe un WhatsApp mexicano de 10 dígitos" : "");
  const phoneReady = isValidMexicanPhone(phone);
  return (
    <div className="solution-registration-flow flex min-h-dvh flex-col bg-white text-foreground">
      <header className="flex min-h-16 items-center justify-between border-b border-border-soft px-5 sm:px-8"><TlacoLogo size="md" /><Link href="/login" className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-muted-foreground hover:text-foreground">Ya tengo cuenta</Link></header>
      <main className="flex flex-1 items-center px-5 py-10 sm:py-14">
        <div className="mx-auto grid w-full max-w-4xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div><p className="text-sm font-semibold text-accent">ÚLTIMO PASO</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">Guarda la tienda de {businessName}</h1><p className="mt-4 max-w-md leading-7 text-muted-foreground">Conservaremos el nombre, apariencia, objetivos y catálogo que elegiste. Después sólo confirmarás precios y atención.</p><div className="mt-6 space-y-2 text-sm text-muted-foreground">{["No se cobra al crear la cuenta", "No necesitas tarjeta", "Tu sitio se publica automáticamente"].map((text) => <p key={text} className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" />{text}</p>)}</div></div>
          <form onSubmit={onSubmit} className="rounded-3xl border border-border bg-white p-5 shadow-[0_18px_55px_rgba(25,38,61,0.08)] sm:p-7" noValidate>
            <h2 className="text-xl font-bold">Crea tu acceso</h2><p className="mt-1 text-sm text-muted-foreground">Plan Gratis · sin activación automática de membresía</p>
            {error ? <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p> : null}
            <label htmlFor="solution-email" className="mt-6 block text-sm font-medium text-muted-foreground">Correo</label><input id="solution-email" type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} className={`${inputClass} ${fieldErrors.email ? "border-red-500" : ""}`} autoComplete="email" placeholder="tu@email.com" />{fieldErrors.email ? <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p> : null}
            <label htmlFor="solution-phone" className="mt-4 block text-sm font-medium text-muted-foreground">WhatsApp del negocio</label><input id="solution-phone" type="tel" inputMode="tel" pattern="[0-9 ]*" maxLength={18} value={phone} onChange={(event) => { setPhoneTouched(true); onPhoneChange(formatMexicanPhoneInput(event.target.value)); }} onBlur={() => setPhoneTouched(true)} aria-invalid={Boolean(livePhoneError)} aria-describedby="solution-phone-help" className={`${inputClass} ${livePhoneError ? "border-red-500" : phoneReady ? "border-emerald-500" : ""}`} autoComplete="tel" placeholder="55 1234 5678" /><p id="solution-phone-help" className={`mt-1 text-xs ${livePhoneError ? "font-semibold text-red-600" : phoneReady ? "font-semibold text-emerald-700" : "text-muted-foreground"}`}>{livePhoneError || (phoneReady ? "Número válido. Será el contacto visible y de seguimiento." : "Escribe los 10 dígitos de tu WhatsApp.")}</p>
            <div className="mt-4"><PasswordInput id="solution-password" label="Contraseña" value={password} onChange={(event) => onPasswordChange(event.target.value)} required minLength={6} inputClassName={`${inputClass} ${fieldErrors.password ? "border-red-500" : ""}`} autoComplete="new-password" placeholder="Mínimo 6 caracteres" />{fieldErrors.password ? <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p> : null}</div>
            <button type="submit" disabled={loading || !phoneReady} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-sm font-bold text-white disabled:opacity-50">{loading ? "Creando y preparando…" : "Crear mi tienda gratis"}<ArrowRight className="h-4 w-4" /></button>
            <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">Al continuar aceptas los <Link href="/terminos" className="underline">Términos</Link> y el <Link href="/privacidad" className="underline">Aviso de Privacidad</Link>.</p>
          </form>
        </div>
      </main>
      <RegistrationStepDots />
    </div>
  );
}

function RegistroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = parseRegistrationIntent(searchParams);
  const solution = intent.solutionKey ? getSolutionByVertical(intent.solutionKey) : undefined;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState(intent.phone ?? "");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [entering, setEntering] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [preparationStage, setPreparationStage] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Validación
    try {
      await registroSchema.validate({ email, password }, { abortEarly: false });
      if (!isValidMexicanPhone(phone)) {
        setFieldErrors((current) => ({ ...current, phone: "Ingresa un WhatsApp mexicano de 10 dígitos" }));
        return;
      }
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
    const fullIntent = { ...intent, phone };
    try { track("registration_started", { plan: intent.plan, giro: intent.giro, solution: intent.solutionKey ?? "direct" }); } catch { /* La analítica no bloquea el registro. */ }

    try {
      const response = await fetch("/api/auth/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          intent: fullIntent,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(
          payload.error || "No pudimos crear tu cuenta"
        );
      }

      const cleanEmail = email.trim();
      setRegisteredEmail(cleanEmail);
      setSuccess(true);
      try { track("registration_completed", { plan: intent.plan, giro: intent.giro, solution: intent.solutionKey ?? "direct" }); } catch { /* La analítica no bloquea el registro. */ }
      void handleStart(cleanEmail);
    } catch (err: unknown) {
      console.error("Error en registro:", err);
      setError(resolveUserError(err, null));
    } finally {
      setLoading(false);
    }
  }

  async function handleStart(accountEmail = registeredEmail) {
    setEntering(true);
    setStartError(null);
    setPreparationStage(0);
    // Let the owner see the first real operation instead of flashing past a
    // blank success screen while we establish their session.
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    const { error: signInError } = await createClient().auth.signInWithPassword({
      email: accountEmail,
      password,
    });
    if (signInError) {
      setStartError(resolveUserError(signInError, "supabase"));
      setEntering(false);
      return;
    }
    try {
      setPreparationStage(1);
      const businessName = intent.businessName ?? solution?.preset.defaultName ?? "Mi negocio";
      const tenant = await createTenant({
        name: businessName,
        slug: deriveSlug(businessName),
        business_type: solution?.catalog.businessType ?? intent.giro,
        catalog_template_key: intent.catalogStartMode === "own" ? undefined : solution?.catalog.key ?? intent.catalogKey,
        registration_intent: { ...intent, phone },
      }) as { id: string; slug?: string };
      setPreparationStage(2);
      await new Promise((resolve) => window.setTimeout(resolve, 450));
      router.push(`/dashboard/preparar-negocio?tenant=${encodeURIComponent(tenant.id)}`);
      router.refresh();
    } catch (creationError) {
      setStartError(creationError instanceof Error ? creationError.message : "No pudimos preparar tu negocio");
      setEntering(false);
    }
  }

  if (solution && success) {
    return <SolutionRegistrationSuccess email={registeredEmail} businessName={intent.businessName || solution.preset.defaultName} preparationStage={preparationStage} entering={entering} startError={startError} onContinue={() => void handleStart()} />;
  }

  if (solution) {
    return <SolutionRegistrationForm businessName={intent.businessName || solution.preset.defaultName} email={email} phone={phone} password={password} error={error} fieldErrors={fieldErrors} loading={loading} onEmailChange={(value) => { setEmail(value); setFieldErrors((current) => ({ ...current, email: "" })); }} onPhoneChange={(value) => { setPhone(value); setFieldErrors((current) => ({ ...current, phone: "" })); }} onPasswordChange={(value) => { setPassword(value); setFieldErrors((current) => ({ ...current, password: "" })); }} onSubmit={handleSubmit} />;
  }

  // Mostrar mensaje de éxito
  if (success) {
    return (
      <div className="flex min-h-screen flex-col lg:flex-row">
        <BrandPanel {...REGISTRO_BRAND}><RegistroPricingHighlight plan={intent.plan} /></BrandPanel>
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
        <RegistroPricingHighlight plan={intent.plan} />
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
              {intent.businessName ? `Guarda la tienda de ${intent.businessName}` : "Regístrate gratis y empieza a vender en minutos"}
            </p>

            {(solution || intent.plan !== "free") && (
              <div className="mt-4 rounded-xl border border-accent/20 bg-accent/5 p-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground"><Store className="h-4 w-4" aria-hidden /></span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{intent.businessName || solution?.preset.defaultName || "Tu negocio"}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">Conservaremos el giro, catálogo y plan que viste. {PLAN_PRESENTATION[intent.plan].promise}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-accent/15 pt-3 text-xs font-semibold text-foreground"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Hoy no se realiza ningún cobro.</div>
              </div>
            )}

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
                <label htmlFor="phone" className="block text-sm font-medium text-muted-foreground">WhatsApp del negocio</label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(event) => {
                    setPhoneTouched(true);
                    setPhone(formatMexicanPhoneInput(event.target.value));
                    if (fieldErrors.phone) setFieldErrors((current) => ({ ...current, phone: "" }));
                  }}
                  onBlur={() => setPhoneTouched(true)}
                  pattern="[0-9 ]*"
                  maxLength={18}
                  className={`${inputClass} ${fieldErrors.phone || (phoneTouched && !isValidMexicanPhone(phone)) ? "border-red-500 focus:ring-red-500/20" : isValidMexicanPhone(phone) ? "border-emerald-500 focus:ring-emerald-500/20" : ""}`}
                  autoComplete="tel"
                  placeholder="55 1234 5678"
                  aria-invalid={!!fieldErrors.phone}
                />
                {fieldErrors.phone || (phoneTouched && !isValidMexicanPhone(phone)) ? <p className="mt-1 text-sm text-red-600">{fieldErrors.phone || "Escribe un WhatsApp mexicano de 10 dígitos"}</p> : <p className={`mt-1 text-xs ${isValidMexicanPhone(phone) ? "font-semibold text-emerald-700" : "text-muted-foreground"}`}>{isValidMexicanPhone(phone) ? "Número válido para recibir y dar seguimiento a pedidos." : "Escribe los 10 dígitos de tu WhatsApp."}</p>}
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
                disabled={loading || !isValidMexicanPhone(phone)}
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

export default function RegistroPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" aria-label="Preparando registro" />}>
      <RegistroContent />
    </Suspense>
  );
}
