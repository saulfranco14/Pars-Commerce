"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, FileText, Landmark, Loader2, LockKeyhole, MapPin, Phone, ShieldCheck } from "lucide-react";

import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { FormInput } from "@/components/ui/FormInput";
import { Notification } from "@/components/ui/Notification";
import { WizardShell } from "@/components/wizard/WizardShell";
import { WizardStepHeading } from "@/components/wizard/WizardStepHeading";
import {
  getLegalProfileFieldErrors,
  legalProfileSchema,
  type LegalProfileField,
  type LegalProfileForm,
} from "@/features/legal/legalProfileSchema";

type LegalDocument = { id: string; title: string; version: string; content: string };
type Stage = "why" | "details" | "agreement" | "done";

const TITLE_ID = "legal-opening-title";
const REPRESENTATION_DECLARATION = "Acepto el acuerdo de Tlaco y declaro que puedo representar este negocio.";
const EMPTY_PROFILE: LegalProfileForm = {
  party_type: "individual", legal_name: "", tax_id: "", address_line1: "", address_line2: "",
  city: "", state: "", postal_code: "", country: "México", contractual_email: "",
  contractual_phone: "", representative_name: "", representative_role: "", public_seller_name: "", public_privacy_contact: "",
};

function LegalProfilePreview({ profile, stage }: { profile: LegalProfileForm; stage: Stage }) {
  const isComplete = stage === "done";
  return (
    <aside className="rounded-[1.6rem] border border-border bg-surface-raised p-1.5 shadow-card" aria-label="Vista previa de tu ficha de apertura">
      <div className="rounded-[1.3rem] bg-surface p-5">
        <div className="flex items-center justify-between"><p className="text-xs font-semibold text-muted-foreground">Así cuidamos tus datos</p><LockKeyhole className="h-4 w-4 text-accent" aria-hidden /></div>
        <div className="mt-5 rounded-2xl border border-border bg-background p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Ficha de apertura</p>
          <p className="mt-2 truncate text-base font-bold text-foreground">{profile.legal_name || "Tu nombre legal"}</p>
          <p className="mt-1 truncate text-sm text-muted-foreground">{profile.address_line1 || "Tu domicilio"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{profile.contractual_phone || "Tu teléfono"}</p>
        </div>
        <div className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${isComplete ? "bg-emerald-50 text-emerald-700" : "bg-accent/8 text-accent"}`}>
          {isComplete ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <ShieldCheck className="h-4 w-4" aria-hidden />}
          {isComplete ? "Lista para abrir pedidos" : "Privada: no se muestra en tu tienda"}
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">Tus clientes sólo verán los datos que tú decidas publicar después.</p>
      </div>
    </aside>
  );
}

export function LegalOpeningCard() {
  const router = useRouter();
  const params = useSearchParams();
  const tenantId = params.get("tenant") ?? "";
  const returnTo = params.get("return") || "/dashboard";
  const [profile, setProfile] = useState<LegalProfileForm>(EMPTY_PROFILE);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [stage, setStage] = useState<Stage>("why");
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
    ]).then(([profileData, offerData]) => {
      if (profileData.profile) {
        const stored = profileData.profile as Partial<LegalProfileForm>;
        setProfile((current) => ({ ...current, ...stored, tax_id: stored.tax_id ?? "", address_line2: stored.address_line2 ?? "", city: stored.city ?? "", state: stored.state ?? "", postal_code: stored.postal_code ?? "", contractual_email: stored.contractual_email ?? "", representative_name: stored.representative_name ?? "", representative_role: stored.representative_role ?? "", public_seller_name: stored.public_seller_name ?? "", public_privacy_contact: stored.public_privacy_contact ?? "" }));
      }
      if (Array.isArray(offerData.documents)) setDocuments(offerData.documents);
    }).catch(() => setError("No pudimos cargar esta ficha. Intenta de nuevo."));
  }, [tenantId]);

  const set = <K extends LegalProfileField,>(field: K, value: LegalProfileForm[K]) => {
    const normalized = field === "tax_id" ? String(value).replace(/\s/g, "").toUpperCase() : field === "contractual_phone" ? String(value).replace(/[\s()-]/g, "") : value;
    setProfile((current) => ({ ...current, [field]: normalized as LegalProfileForm[K] }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };
  const registerInput = (field: LegalProfileField) => (element: HTMLInputElement | null) => { inputRefs.current[field] = element; };
  const validateField = (field: LegalProfileField) => setFieldErrors((current) => ({ ...current, [field]: getLegalProfileFieldErrors(profile)[field] }));
  const focusFirstInvalidField = (errors: Partial<Record<LegalProfileField, string>>) => {
    const field = Object.keys(errors)[0] as LegalProfileField | undefined;
    if (!field) return;
    requestAnimationFrame(() => { inputRefs.current[field]?.scrollIntoView({ behavior: "smooth", block: "center" }); inputRefs.current[field]?.focus(); });
  };

  async function saveDetails() {
    const parsed = legalProfileSchema.safeParse(profile);
    if (!parsed.success) {
      const errors = getLegalProfileFieldErrors(profile);
      setFieldErrors(errors);
      setError("Sólo revisa los campos marcados y seguimos.");
      focusFirstInvalidField(errors);
      return;
    }
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/tenants/${tenantId}/legal-profile`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No pudimos guardar tus datos.");
      setStage("agreement");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No pudimos guardar tus datos."); }
    finally { setBusy(false); }
  }

  async function accept() {
    if (!accepted) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/legal/acceptances", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenant_id: tenantId, idempotency_key: crypto.randomUUID?.() ?? `${tenantId}-${Date.now()}`, declaration: REPRESENTATION_DECLARATION }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No pudimos registrar tu aceptación.");
      setStage("done");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No pudimos registrar tu aceptación."); }
    finally { setBusy(false); }
  }

  function next() {
    if (stage === "why") { setStage("details"); return; }
    if (stage === "details") { void saveDetails(); return; }
    if (stage === "agreement") { void accept(); return; }
    router.replace(returnTo);
  }
  function back() {
    if (stage === "why") { router.replace("/dashboard?legal_deferred=1"); return; }
    if (stage === "details") { setError(null); setStage("why"); return; }
    if (stage === "agreement") { setStage("details"); return; }
    setStage("agreement");
  }

  if (!tenantId) return <main className="mx-auto flex min-h-dvh max-w-md items-center px-5"><Notification tone="error" message="No encontramos el negocio que quieres abrir." /></main>;
  const step = stage === "why" ? 0 : stage === "details" ? 1 : 2;
  const nextLabel = stage === "why" ? "Empezar" : stage === "details" ? "Continuar" : stage === "agreement" ? "Aceptar y continuar" : "Ir a mi negocio";
  const canContinue = stage === "agreement" ? accepted && !busy : !busy;

  return <WizardShell titleId={TITLE_ID} step={step} total={3} canContinue={canContinue} nextLabel={busy ? "Guardando…" : nextLabel} backLabel={stage === "why" ? "Salir por ahora" : stage === "done" ? "Ver acuerdo" : "Anterior"} closeLabel="Salir por ahora" onBack={back} onNext={next} onClose={() => router.replace("/dashboard?legal_deferred=1")} header={<TlacoLogo size="md" />}>
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-center lg:gap-12">
      <div>
        {error ? <Notification className="mb-5" tone="error" message={error} /> : null}
        {stage === "why" ? <><WizardStepHeading titleId={TITLE_ID} eyebrow="Antes de activar pedidos" title="Dejemos claro que este negocio es tuyo." subtitle="Nos toma menos de dos minutos y te ayuda a tener todo en orden desde el inicio." /><div className="mt-7 space-y-4 rounded-2xl border border-border bg-surface p-5 text-sm leading-6 text-muted-foreground"><p className="font-semibold text-foreground">¿Para qué te pedimos esto?</p><p>Para saber a quién contactar si algo pasa con la tienda, tus pedidos o tus datos. Nada raro: es como ponerle nombre y dirección a tu local.</p><p>Tu nombre, domicilio y teléfono quedan privados. Lo demás lo puedes completar después, cuando lo tengas a la mano.</p></div></> : null}
        {stage === "details" ? <form noValidate onSubmit={(event) => { event.preventDefault(); void saveDetails(); }}><WizardStepHeading titleId={TITLE_ID} eyebrow="Lo esencial primero" title="¿A nombre de quién abrimos tu tienda?" subtitle="Sólo te pedimos tres datos ahora. El resto lo completas después, sin frenar tu avance." /><div className="mt-8 space-y-5"><FormInput ref={registerInput("legal_name")} label="Nombre legal" placeholder="Ana López García" autoComplete="name" icon={Landmark} value={profile.legal_name} error={fieldErrors.legal_name} onBlur={() => validateField("legal_name")} onChange={(event) => set("legal_name", event.target.value)} /><FormInput ref={registerInput("address_line1")} label="Domicilio" placeholder="Av. Reforma 123, Col. Juárez" autoComplete="street-address" icon={MapPin} value={profile.address_line1} error={fieldErrors.address_line1} onBlur={() => validateField("address_line1")} onChange={(event) => set("address_line1", event.target.value)} /><FormInput ref={registerInput("contractual_phone")} label="Teléfono" placeholder="55 1234 5678" type="tel" inputMode="tel" autoComplete="tel" icon={Phone} value={profile.contractual_phone} error={fieldErrors.contractual_phone} onBlur={() => validateField("contractual_phone")} onChange={(event) => set("contractual_phone", event.target.value)} /><div className="rounded-2xl border border-border bg-surface p-4"><FormInput ref={registerInput("tax_id")} label="RFC" optional placeholder="LOGA900101ABC" autoCapitalize="characters" maxLength={13} icon={FileText} value={profile.tax_id} error={fieldErrors.tax_id} hint="¿No lo tienes a la mano? Sigue sin problema; te lo pediremos cuando haga falta." onBlur={() => validateField("tax_id")} onChange={(event) => set("tax_id", event.target.value)} /></div></div></form> : null}
        {stage === "agreement" ? <section><WizardStepHeading titleId={TITLE_ID} eyebrow="Último paso" title="Lee el acuerdo a tu ritmo." subtitle="Explica cómo usamos tus datos y cómo puedes salir cuando quieras." /><div className="mt-7 space-y-3">{documents.map((document) => <details key={document.id} className="rounded-2xl border border-border bg-surface p-4"><summary className="cursor-pointer list-none text-sm font-bold text-foreground">{document.title}<span className="ml-2 text-xs font-medium text-muted-foreground">v{document.version}</span></summary><p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{document.content}</p><a className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-accent underline" href={`/api/legal/documents/${document.id}?tenant_id=${encodeURIComponent(tenantId)}`} target="_blank" rel="noreferrer">Abrir PDF membretado</a></details>)}</div><label className="mt-5 flex cursor-pointer gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-4 text-sm leading-6 text-foreground"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-[var(--accent)]" />{REPRESENTATION_DECLARATION}</label></section> : null}
        {stage === "done" ? <section><WizardStepHeading titleId={TITLE_ID} eyebrow="Todo listo" title="Ya puedes abrir pedidos." subtitle="Tu comprobante quedó guardado en Datos legales y contratos." /><div className="mt-7 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800"><CheckCircle2 className="h-6 w-6 shrink-0" aria-hidden /><p className="text-sm font-semibold">Tu ficha de apertura y el acuerdo ya están listos.</p></div></section> : null}
      </div>
      <div className="mt-8 lg:mt-0"><p className="mb-2 text-xs font-semibold text-muted-foreground">Tu ficha de apertura</p><LegalProfilePreview profile={profile} stage={stage} /></div>
    </div>
  </WizardShell>;
}
