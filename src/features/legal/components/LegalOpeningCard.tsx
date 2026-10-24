"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2, CheckCircle2, FileText, Landmark, Loader2, Mail, MapPin,
  Phone, ShieldCheck, Store, UserRound,
} from "lucide-react";

import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { FormInput } from "@/components/ui/FormInput";
import { Notification } from "@/components/ui/Notification";
import {
  getLegalProfileFieldErrors,
  legalProfileSchema,
  type LegalProfileField,
  type LegalProfileForm,
} from "@/features/legal/legalProfileSchema";

type LegalDocument = {
  id: string;
  title: string;
  version: string;
  content: string;
  content_hash: string;
};

const REPRESENTATION_DECLARATION =
  "Acepto el acuerdo de Tlaco y declaro que puedo representar este negocio.";

const EMPTY_PROFILE: LegalProfileForm = {
  party_type: "individual",
  legal_name: "",
  tax_id: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "México",
  contractual_email: "",
  contractual_phone: "",
  representative_name: "",
  representative_role: "",
  public_seller_name: "",
  public_privacy_contact: "",
};

function StepSeal({ number, title, ready }: { number: number; title: string; ready: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${ready ? "bg-emerald-600 text-white" : "bg-border-soft text-muted-foreground"}`}>
        {ready ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : number}
      </span>
      <span className="text-sm font-semibold text-foreground">{title}</span>
    </li>
  );
}

export function LegalOpeningCard() {
  const router = useRouter();
  const params = useSearchParams();
  const tenantId = params.get("tenant") ?? "";
  const returnTo = params.get("return") || "/dashboard";
  const [profile, setProfile] = useState<LegalProfileForm>(EMPTY_PROFILE);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [stage, setStage] = useState<"intro" | "details" | "agreement" | "done">("intro");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<LegalProfileField, string>>>({});
  const inputRefs = useRef<Partial<Record<LegalProfileField, HTMLInputElement | null>>>({});

  useEffect(() => {
    if (!tenantId) return;
    void Promise.all([
      fetch(`/api/tenants/${tenantId}/legal-profile`, { cache: "no-store" }).then((response) => response.json()),
      fetch(`/api/legal/offers?tenant_id=${tenantId}`, { cache: "no-store" }).then((response) => response.json()),
    ])
      .then(([profileData, offerData]) => {
        if (profileData.profile) {
          const stored = profileData.profile as Partial<LegalProfileForm>;
          setProfile((current) => ({
            ...current,
            ...stored,
            address_line2: stored.address_line2 ?? "",
            representative_name: stored.representative_name ?? "",
            representative_role: stored.representative_role ?? "",
          }));
        }
        if (Array.isArray(offerData.documents)) setDocuments(offerData.documents);
      })
      .catch(() => setError("No pudimos cargar el acuerdo. Intenta de nuevo."));
  }, [tenantId]);

  const profileReady = legalProfileSchema.safeParse(profile).success;

  const set = <K extends LegalProfileField,>(field: K, value: LegalProfileForm[K]) => {
    const normalized = field === "tax_id"
      ? String(value).replace(/\s/g, "").toUpperCase()
      : field === "contractual_phone"
        ? String(value).replace(/[\s()-]/g, "")
        : value;
    setProfile((current) => ({ ...current, [field]: normalized as LegalProfileForm[K] }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const registerInput = (field: LegalProfileField) => (element: HTMLInputElement | null) => {
    inputRefs.current[field] = element;
  };

  const validateField = (field: LegalProfileField) => {
    const errors = getLegalProfileFieldErrors(profile);
    setFieldErrors((current) => ({ ...current, [field]: errors[field] }));
  };

  const focusFirstInvalidField = (errors: Partial<Record<LegalProfileField, string>>) => {
    const firstField = Object.keys(errors)[0] as LegalProfileField | undefined;
    if (!firstField) return;
    requestAnimationFrame(() => {
      const input = inputRefs.current[firstField];
      input?.scrollIntoView({ behavior: "smooth", block: "center" });
      input?.focus();
    });
  };

  async function saveDetails() {
    if (!tenantId) return;
    const parsed = legalProfileSchema.safeParse(profile);
    if (!parsed.success) {
      const errors = getLegalProfileFieldErrors(profile);
      setFieldErrors(errors);
      setError("Revisa los campos marcados para continuar.");
      focusFirstInvalidField(errors);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/tenants/${tenantId}/legal-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No pudimos guardar tus datos.");
      const saved = data.profile as Partial<LegalProfileForm>;
      setProfile((current) => ({
        ...current,
        ...saved,
        address_line2: saved.address_line2 ?? "",
        representative_name: saved.representative_name ?? "",
        representative_role: saved.representative_role ?? "",
      }));
      setStage("agreement");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No pudimos guardar tus datos.");
    } finally {
      setBusy(false);
    }
  }

  async function accept() {
    if (!accepted || !tenantId) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/legal/acceptances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          idempotency_key: crypto.randomUUID?.() ?? `${tenantId}-${Date.now()}`,
          declaration: REPRESENTATION_DECLARATION,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No pudimos registrar tu aceptación.");
      setStage("done");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No pudimos registrar tu aceptación.");
    } finally {
      setBusy(false);
    }
  }

  if (!tenantId) {
    return <main className="mx-auto flex min-h-dvh max-w-md items-center px-5"><Notification tone="error" message="No encontramos el negocio que quieres abrir." /></main>;
  }

  const title = stage === "intro"
    ? "Antes de abrir tu tienda, dejemos tus datos listos."
    : stage === "details"
      ? "Cuéntanos quién administra el negocio."
      : stage === "agreement"
        ? "Revisa el acuerdo con calma."
        : "Tu tienda ya puede abrir pedidos.";
  const copy = stage === "intro"
    ? "Esto deja claro quién usa Tlaco, cómo cuidamos la información y cómo puedes salir cuando lo necesites."
    : stage === "details"
      ? "Los usamos sólo para tu expediente. Tus clientes verán únicamente los datos que tú autorizas."
      : stage === "agreement"
        ? "Puedes leer cada documento antes de decidir. No hay cargos automáticos por aceptar."
        : "Guardamos tu comprobante con los documentos exactos que acabas de aceptar.";

  return (
    <main className="min-h-dvh bg-background px-4 py-4 sm:px-8 sm:py-6">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
        <section className="order-2 flex min-w-0 flex-col rounded-3xl border border-border bg-surface-raised p-5 shadow-card sm:p-8 lg:order-1">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Apertura Tlaco</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{copy}</p>
          </div>

          <ol className="mt-7 grid gap-3 sm:grid-cols-3">
            <StepSeal number={1} title="Datos" ready={profileReady} />
            <StepSeal number={2} title="Acuerdo" ready={stage === "done"} />
            <StepSeal number={3} title="Abrir pedidos" ready={stage === "done"} />
          </ol>

          {error ? <Notification className="mt-6" tone="error" message={error} /> : null}

          {stage === "intro" ? (
            <div className="mt-auto pt-8">
              <button type="button" onClick={() => setStage("details")} className="min-h-12 w-full rounded-2xl bg-accent px-5 text-sm font-bold text-accent-foreground hover:bg-accent-hover sm:w-auto">Completar ahora</button>
              <button type="button" onClick={() => router.replace("/dashboard?legal_deferred=1")} className="mt-3 min-h-12 w-full rounded-2xl border border-border px-5 text-sm font-semibold text-foreground hover:bg-border-soft sm:ml-3 sm:mt-0 sm:w-auto">Salir por ahora</button>
            </div>
          ) : null}

          {stage === "details" ? (
            <form className="mt-7 space-y-6" noValidate onSubmit={(event) => { event.preventDefault(); void saveDetails(); }}>
              <fieldset>
                <legend className="sr-only">Tipo de persona</legend>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" aria-pressed={profile.party_type === "individual"} onClick={() => set("party_type", "individual")} className={`min-h-12 rounded-2xl border-2 px-3 text-sm font-bold ${profile.party_type === "individual" ? "border-accent bg-accent/5 text-accent" : "border-border text-muted-foreground"}`}><UserRound className="mr-2 inline h-4 w-4" />Persona física</button>
                  <button type="button" aria-pressed={profile.party_type === "company"} onClick={() => set("party_type", "company")} className={`min-h-12 rounded-2xl border-2 px-3 text-sm font-bold ${profile.party_type === "company" ? "border-accent bg-accent/5 text-accent" : "border-border text-muted-foreground"}`}><Building2 className="mr-2 inline h-4 w-4" />Persona moral</button>
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput ref={registerInput("legal_name")} label={profile.party_type === "individual" ? "Nombre legal" : "Razón social"} placeholder={profile.party_type === "individual" ? "Ana López García" : "Comercializadora Ejemplo, S.A. de C.V."} autoComplete="name" icon={Landmark} value={profile.legal_name} error={fieldErrors.legal_name} onBlur={() => validateField("legal_name")} onChange={(event) => set("legal_name", event.target.value)} />
                <FormInput ref={registerInput("tax_id")} label="RFC" placeholder="LOGA900101ABC" autoCapitalize="characters" maxLength={13} icon={FileText} value={profile.tax_id} error={fieldErrors.tax_id} onBlur={() => validateField("tax_id")} onChange={(event) => set("tax_id", event.target.value)} />
                <FormInput ref={registerInput("contractual_email")} label="Correo contractual" placeholder="ana@tudominio.mx" type="email" autoComplete="email" icon={Mail} value={profile.contractual_email} error={fieldErrors.contractual_email} onBlur={() => validateField("contractual_email")} onChange={(event) => set("contractual_email", event.target.value)} />
                <FormInput ref={registerInput("contractual_phone")} label="Teléfono contractual" placeholder="55 1234 5678" type="tel" inputMode="tel" autoComplete="tel" icon={Phone} value={profile.contractual_phone} error={fieldErrors.contractual_phone} onBlur={() => validateField("contractual_phone")} onChange={(event) => set("contractual_phone", event.target.value)} />
                <FormInput ref={registerInput("address_line1")} label="Domicilio fiscal" placeholder="Av. Reforma 123, Col. Juárez" autoComplete="street-address" icon={MapPin} className="sm:col-span-2" value={profile.address_line1} error={fieldErrors.address_line1} onBlur={() => validateField("address_line1")} onChange={(event) => set("address_line1", event.target.value)} />
                <FormInput ref={registerInput("address_line2")} label="Interior o referencia" placeholder="Local 4 · Edificio B" optional className="sm:col-span-2" value={profile.address_line2} error={fieldErrors.address_line2} onBlur={() => validateField("address_line2")} onChange={(event) => set("address_line2", event.target.value)} />
                <FormInput ref={registerInput("city")} label="Ciudad" placeholder="Ciudad de México" autoComplete="address-level2" value={profile.city} error={fieldErrors.city} onBlur={() => validateField("city")} onChange={(event) => set("city", event.target.value)} />
                <FormInput ref={registerInput("state")} label="Estado" placeholder="Ciudad de México" autoComplete="address-level1" value={profile.state} error={fieldErrors.state} onBlur={() => validateField("state")} onChange={(event) => set("state", event.target.value)} />
                <FormInput ref={registerInput("postal_code")} label="Código postal" placeholder="06600" inputMode="numeric" autoComplete="postal-code" maxLength={5} value={profile.postal_code} error={fieldErrors.postal_code} onBlur={() => validateField("postal_code")} onChange={(event) => set("postal_code", event.target.value.replace(/\D/g, ""))} />
                <FormInput ref={registerInput("public_seller_name")} label="Nombre que verá tu cliente" placeholder="Boutique Ana" icon={Store} value={profile.public_seller_name} error={fieldErrors.public_seller_name} onBlur={() => validateField("public_seller_name")} onChange={(event) => set("public_seller_name", event.target.value)} />
                <FormInput ref={registerInput("public_privacy_contact")} label="Contacto de privacidad público" placeholder="privacidad@boutiqueana.mx" icon={ShieldCheck} className="sm:col-span-2" value={profile.public_privacy_contact} error={fieldErrors.public_privacy_contact} onBlur={() => validateField("public_privacy_contact")} onChange={(event) => set("public_privacy_contact", event.target.value)} />
                {profile.party_type === "company" ? <>
                  <FormInput ref={registerInput("representative_name")} label="Persona representante" placeholder="María Torres" icon={UserRound} value={profile.representative_name} error={fieldErrors.representative_name} onBlur={() => validateField("representative_name")} onChange={(event) => set("representative_name", event.target.value)} />
                  <FormInput ref={registerInput("representative_role")} label="Cargo o facultad" placeholder="Administradora única" value={profile.representative_role} error={fieldErrors.representative_role} onBlur={() => validateField("representative_role")} onChange={(event) => set("representative_role", event.target.value)} />
                </> : null}
              </div>

              <div className="sticky bottom-0 -mx-5 flex flex-col-reverse gap-3 border-t border-border bg-surface-raised px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:static sm:mx-0 sm:flex-row sm:border-0 sm:bg-transparent sm:p-0">
                <button type="button" onClick={() => setStage("intro")} className="min-h-12 rounded-2xl border border-border px-5 text-sm font-semibold">Volver</button>
                <button type="submit" disabled={busy} className="min-h-12 rounded-2xl bg-accent px-5 text-sm font-bold text-accent-foreground disabled:opacity-60">{busy ? "Guardando…" : "Revisar acuerdo"}</button>
              </div>
            </form>
          ) : null}

          {stage === "agreement" ? <section className="mt-7 space-y-3"><div className="space-y-3">{documents.map((document) => <details key={document.id} className="rounded-2xl border border-border bg-background p-4"><summary className="cursor-pointer list-none text-sm font-bold text-foreground">{document.title}<span className="ml-2 text-xs font-medium text-muted-foreground">v{document.version}</span></summary><p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{document.content}</p><a className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-accent underline" href={`/api/legal/documents/${document.id}?tenant_id=${encodeURIComponent(tenantId)}`} target="_blank" rel="noreferrer">Abrir PDF membretado</a></details>)}</div><label className="mt-5 flex cursor-pointer gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-4 text-sm leading-6 text-foreground"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-[var(--accent)]" />{REPRESENTATION_DECLARATION}</label><div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row"><button type="button" onClick={() => setStage("details")} className="min-h-12 rounded-2xl border border-border px-5 text-sm font-semibold">Revisar datos</button><button type="button" disabled={!accepted || busy} onClick={() => void accept()} className="min-h-12 rounded-2xl bg-accent px-5 text-sm font-bold text-accent-foreground disabled:opacity-60">{busy ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Guardando…</> : "Aceptar y continuar"}</button></div></section> : null}
          {stage === "done" ? <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><CheckCircle2 className="h-7 w-7 text-emerald-600" aria-hidden /><h2 className="mt-3 text-lg font-bold text-foreground">Todo listo para abrir.</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Tu comprobante se generó y podrás consultarlo desde Datos legales y contratos.</p><button type="button" onClick={() => router.replace(returnTo)} className="mt-5 min-h-12 rounded-2xl bg-accent px-5 text-sm font-bold text-accent-foreground">Volver a mi negocio</button></div> : null}
        </section>

        <aside className="order-1 flex min-h-48 flex-col justify-between rounded-3xl border border-border bg-surface p-6 shadow-soft lg:order-2">
          <TlacoLogo size="xl" />
          <div><p className="text-lg font-bold tracking-tight text-foreground">Tu negocio sigue seguro.</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Puedes leer todo con calma. No hay una verificación de correo ni un cobro escondido en este paso.</p></div>
        </aside>
      </div>
    </main>
  );
}
