"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ExternalLink, FileText, Landmark, Loader2, LockKeyhole, MapPin, Phone, Search, ShieldCheck } from "lucide-react";

import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { FormInput } from "@/components/ui/FormInput";
import { Notification } from "@/components/ui/Notification";
import { WizardShell } from "@/components/wizard/WizardShell";
import { WizardStepHeading } from "@/components/wizard/WizardStepHeading";
import { usePlaceSearch } from "@/hooks/usePlaceSearch";
import { formatMexicanPhoneInput } from "@/lib/phone";
import {
  getLegalProfileFieldErrors,
  legalProfileSchema,
  type LegalProfileField,
  type LegalProfileForm,
} from "@/features/legal/legalProfileSchema";

import type { PlaceOption } from "@/types/places";

type LegalDocument = { id: string; title: string; version: string; content: string };
type Stage = "why" | "details" | "agreement" | "done";

const TITLE_ID = "legal-opening-title";
const REPRESENTATION_DECLARATION = "Acepto el acuerdo de Tlaco y declaro que puedo representar este negocio.";
const EMPTY_PROFILE: LegalProfileForm = {
  party_type: "individual", legal_name: "", tax_id: "", address_line1: "", address_line2: "", address_place_id: "", address_latitude: null, address_longitude: null,
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

function LegalAddressField({
  value,
  error,
  inputRef,
  onChange,
  onBlur,
}: {
  value: LegalProfileForm;
  error?: string;
  inputRef: (element: HTMLInputElement | null) => void;
  onChange: (patch: Pick<LegalProfileForm, "address_line1" | "address_place_id" | "address_latitude" | "address_longitude">) => void;
  onBlur: () => void;
}) {
  const { query, setQuery, places, searching, unavailable, pick } = usePlaceSearch(value.address_line1);

  useEffect(() => { setQuery(value.address_line1); }, [value.address_line1, setQuery]);

  const updateManualAddress = (next: string) => {
    setQuery(next);
    onChange({ address_line1: next, address_place_id: "", address_latitude: null, address_longitude: null });
  };
  const selectPlace = async (place: PlaceOption) => {
    const resolved = await pick(place);
    onChange({
      address_line1: resolved.label,
      address_place_id: resolved.id,
      address_latitude: resolved.latitude,
      address_longitude: resolved.longitude,
    });
  };

  return (
    <div>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Domicilio</span>
        <span className="relative block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => updateManualAddress(event.target.value)}
            onBlur={onBlur}
            placeholder="Busca calle, número y colonia"
            autoComplete="street-address"
            aria-invalid={Boolean(error)}
            aria-describedby="legal-address-help"
            className={`block w-full rounded-2xl border-2 bg-background py-3 pl-10 pr-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors ${error ? "border-red-500 focus:border-red-500" : "border-border focus:border-accent"}`}
          />
        </span>
      </label>
      {searching ? <p className="mt-2 text-xs text-muted-foreground">Buscando en el mapa…</p> : null}
      {places.length > 0 ? (
        <div className="mt-2 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          {places.map((place) => (
            <button
              key={place.id}
              type="button"
              onPointerDown={(event) => { event.preventDefault(); void selectPlace(place); }}
              onClick={(event) => { if (event.detail === 0) void selectPlace(place); }}
              className="flex min-h-11 w-full items-start gap-2 border-b border-border-soft px-3 py-2.5 text-left text-sm last:border-0 hover:bg-muted"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
              {place.label}
            </button>
          ))}
        </div>
      ) : null}
      {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : null}
      {!error ? <p id="legal-address-help" className={`mt-1 text-[11px] ${value.address_place_id ? "font-semibold text-emerald-700" : "text-muted-foreground"}`}>{value.address_place_id ? "Ubicación confirmada en el mapa. Queda privada." : "Incluye el número exterior. Puedes elegir una sugerencia o escribirla manualmente."}</p> : null}
      {unavailable ? <p className="mt-1 text-xs text-amber-700">El mapa no respondió; puedes continuar con tu domicilio completo.</p> : null}
    </div>
  );
}

export function LegalOpeningCard() {
  const router = useRouter();
  const params = useSearchParams();
  const tenantId = params.get("tenant") ?? "";
  const returnTo = params.get("return") || "/dashboard";
  const [profile, setProfile] = useState<LegalProfileForm>(EMPTY_PROFILE);
  const [documents, setDocuments] = useState<LegalDocument[] | null>(null);
  const [stage, setStage] = useState<Stage>("why");
  const [showTaxId, setShowTaxId] = useState(false);
  const [showMoreFields, setShowMoreFields] = useState(false);
  const [openedDocumentIds, setOpenedDocumentIds] = useState<Set<string>>(() => new Set());
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<LegalProfileField, string>>>({});
  const inputRefs = useRef<Partial<Record<LegalProfileField, HTMLInputElement | null>>>({});

  useEffect(() => {
    if (!tenantId) return;
    void Promise.all([
      fetch(`/api/tenants/${tenantId}/legal-profile`, { cache: "no-store" }).then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "No pudimos cargar tus datos.");
        return data;
      }),
      fetch(`/api/legal/offers?tenant_id=${tenantId}`, { cache: "no-store" }).then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "No pudimos cargar los documentos.");
        return data;
      }),
    ]).then(([profileData, offerData]) => {
      if (profileData.profile) {
        const stored = profileData.profile as Partial<LegalProfileForm>;
        setProfile((current) => ({ ...current, ...stored, tax_id: stored.tax_id ?? "", address_line2: stored.address_line2 ?? "", address_place_id: stored.address_place_id ?? "", address_latitude: stored.address_latitude ?? null, address_longitude: stored.address_longitude ?? null, city: stored.city ?? "", state: stored.state ?? "", postal_code: stored.postal_code ?? "", contractual_email: stored.contractual_email ?? "", contractual_phone: stored.contractual_phone ? formatMexicanPhoneInput(stored.contractual_phone) : "", representative_name: stored.representative_name ?? "", representative_role: stored.representative_role ?? "", public_seller_name: stored.public_seller_name ?? "", public_privacy_contact: stored.public_privacy_contact ?? "" }));
        setShowTaxId(Boolean(stored.tax_id));
      }
      if (Array.isArray(offerData.documents)) setDocuments(offerData.documents);
    }).catch((reason) => {
      setDocuments([]);
      setError(reason instanceof Error ? reason.message : "No pudimos cargar esta ficha. Intenta de nuevo.");
    });
  }, [tenantId]);

  const set = <K extends LegalProfileField,>(field: K, value: LegalProfileForm[K]) => {
    const normalized = field === "tax_id" ? String(value).replace(/\s/g, "").toUpperCase() : field === "contractual_phone" ? formatMexicanPhoneInput(String(value)) : value;
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
    if (!accepted || !documentsReady) return;
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
  const documentsReady = Boolean(documents && documents.length >= 4);
  const allDocumentsOpened = documentsReady && documents!.every((document) => openedDocumentIds.has(document.id));
  const nextLabel = stage === "why" ? "Empezar" : stage === "details" ? "Continuar" : stage === "agreement" ? "Aceptar y continuar" : "Ir a mi negocio";
  const canContinue = stage === "agreement" ? accepted && documentsReady && allDocumentsOpened && !busy : !busy;

  return <WizardShell titleId={TITLE_ID} step={step} total={3} canContinue={canContinue} nextLabel={busy ? "Guardando…" : nextLabel} backLabel={stage === "why" ? "Salir por ahora" : stage === "done" ? "Ver acuerdo" : "Anterior"} closeLabel="Salir por ahora" onBack={back} onNext={next} onClose={() => router.replace("/dashboard?legal_deferred=1")} header={<TlacoLogo size="md" />}>
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-center lg:gap-12">
      <div>
        {error ? <Notification className="mb-5" tone="error" message={error} /> : null}
        {stage === "why" ? <><WizardStepHeading titleId={TITLE_ID} eyebrow="Antes de activar pedidos" title="Dejemos claro que este negocio es tuyo." subtitle="Nos toma menos de dos minutos y te ayuda a tener todo en orden desde el inicio." /><div className="mt-6 space-y-3 rounded-2xl border border-border bg-surface p-4 text-sm leading-6 text-muted-foreground"><p className="font-semibold text-foreground">¿Para qué te pedimos esto?</p><p>Es como ponerle nombre y dirección a tu local: nos dice a quién contactar si algo pasa con la tienda, pedidos o datos.</p><p>Tu nombre, domicilio y teléfono quedan privados. Los <a className="font-semibold text-accent underline" href="/terminos" target="_blank" rel="noreferrer">términos</a> y el <a className="font-semibold text-accent underline" href="/privacidad" target="_blank" rel="noreferrer">aviso de privacidad</a> siempre están a la vista.</p></div></> : null}
        {stage === "details" ? (
          <form noValidate onSubmit={(event) => { event.preventDefault(); void saveDetails(); }}>
            <WizardStepHeading titleId={TITLE_ID} eyebrow="Lo esencial primero" title="¿A nombre de quién abrimos tu tienda?" subtitle="Sólo te pedimos tres datos ahora. Si quieres, completa el resto aquí mismo antes de revisar el acuerdo." />
            <div className="mt-8 space-y-5">
              <FormInput ref={registerInput("legal_name")} label="Nombre legal" placeholder="Ana López García" autoComplete="name" icon={Landmark} value={profile.legal_name} error={fieldErrors.legal_name} onBlur={() => validateField("legal_name")} onChange={(event) => set("legal_name", event.target.value)} />
              <LegalAddressField
                value={profile}
                error={fieldErrors.address_line1}
                inputRef={registerInput("address_line1")}
                onBlur={() => validateField("address_line1")}
                onChange={(patch) => {
                  setProfile((current) => ({ ...current, ...patch }));
                  setFieldErrors((current) => ({ ...current, address_line1: undefined }));
                }}
              />
              <FormInput
                ref={registerInput("contractual_phone")}
                label="Teléfono"
                placeholder="55 1234 5678"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={12}
                icon={Phone}
                value={profile.contractual_phone}
                error={fieldErrors.contractual_phone}
                hint="Usaremos un número mexicano de 10 dígitos para contactarte si hace falta."
                onBlur={() => validateField("contractual_phone")}
                onChange={(event) => set("contractual_phone", event.target.value)}
              />
              {showTaxId ? (
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm font-bold text-foreground">RFC <span className="font-medium text-muted-foreground">(opcional)</span></p><button type="button" onClick={() => { setShowTaxId(false); set("tax_id", ""); }} className="min-h-10 text-xs font-bold text-muted-foreground underline hover:text-foreground">Lo agrego después</button></div>
                  <FormInput ref={registerInput("tax_id")} label="RFC" optional placeholder="LOGA900101ABC" autoCapitalize="characters" maxLength={13} icon={FileText} value={profile.tax_id} error={fieldErrors.tax_id} onBlur={() => validateField("tax_id")} onChange={(event) => set("tax_id", event.target.value)} />
                </div>
              ) : (
                <button type="button" onClick={() => setShowTaxId(true)} className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-dashed border-border bg-surface px-4 text-left text-sm font-semibold text-foreground transition-colors hover:border-accent hover:bg-accent/5"><span>¿Tienes tu RFC a la mano?</span><span className="text-xs text-muted-foreground">Opcional · agregar</span></button>
              )}
              {showMoreFields ? (
                <div className="space-y-5 rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-foreground">Datos para completar después</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Te sirven para facturación, contacto y lo que decidas publicar. Nada aparece en tu tienda sin que tú lo elijas.</p></div><button type="button" onClick={() => setShowMoreFields(false)} className="min-h-10 shrink-0 text-xs font-bold text-muted-foreground underline hover:text-foreground">Ocultar</button></div>
                  <FormInput ref={registerInput("contractual_email")} label="Correo contractual" optional type="email" placeholder="ana@tudominio.mx" autoComplete="email" value={profile.contractual_email} error={fieldErrors.contractual_email} onBlur={() => validateField("contractual_email")} onChange={(event) => set("contractual_email", event.target.value)} />
                  <div className="grid gap-5 sm:grid-cols-2"><FormInput ref={registerInput("city")} label="Ciudad" optional placeholder="Ciudad de México" autoComplete="address-level2" value={profile.city} error={fieldErrors.city} onBlur={() => validateField("city")} onChange={(event) => set("city", event.target.value)} /><FormInput ref={registerInput("state")} label="Estado" optional placeholder="Ciudad de México" autoComplete="address-level1" value={profile.state} error={fieldErrors.state} onBlur={() => validateField("state")} onChange={(event) => set("state", event.target.value)} /></div>
                  <FormInput ref={registerInput("postal_code")} label="Código postal" optional placeholder="06600" inputMode="numeric" autoComplete="postal-code" maxLength={5} value={profile.postal_code} error={fieldErrors.postal_code} onBlur={() => validateField("postal_code")} onChange={(event) => set("postal_code", event.target.value.replace(/\D/g, ""))} />
                  <FormInput ref={registerInput("public_seller_name")} label="Nombre que verá tu cliente" optional placeholder="Boutique Ana" value={profile.public_seller_name} error={fieldErrors.public_seller_name} onBlur={() => validateField("public_seller_name")} onChange={(event) => set("public_seller_name", event.target.value)} />
                  <FormInput ref={registerInput("public_privacy_contact")} label="Contacto público de privacidad" optional placeholder="privacidad@tudominio.mx" value={profile.public_privacy_contact} error={fieldErrors.public_privacy_contact} onBlur={() => validateField("public_privacy_contact")} onChange={(event) => set("public_privacy_contact", event.target.value)} />
                </div>
              ) : (
                <button type="button" onClick={() => setShowMoreFields(true)} className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-dashed border-border bg-surface px-4 text-left text-sm font-semibold text-foreground transition-colors hover:border-accent hover:bg-accent/5"><span>Completar otros datos</span><span className="text-xs text-muted-foreground">Opcional · después</span></button>
              )}
            </div>
          </form>
        ) : null}
        {stage === "agreement" ? <section><WizardStepHeading titleId={TITLE_ID} eyebrow="Último paso" title="Revisa los cuatro documentos." subtitle="Ábrelos con calma. Cuando termines, confirmas que puedes representar a este negocio." />{documents === null ? <div className="mt-7 flex min-h-28 items-center justify-center gap-3 rounded-2xl border border-border bg-surface text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin text-accent" aria-hidden />Cargando tus documentos…</div> : null}{documents !== null && !documentsReady ? <Notification className="mt-7" tone="error" message="Los documentos todavía no están disponibles. No puedes aceptar hasta que Tlaco cargue los cuatro PDFs." /> : null}{documentsReady ? <><div className="mt-7 space-y-3">{documents!.map((document) => { const opened = openedDocumentIds.has(document.id); return <article key={document.id} className="rounded-2xl border border-border bg-surface p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-foreground">{document.title}</p><p className="mt-1 text-xs text-muted-foreground">Versión {document.version} · PDF membretado Tlaco</p></div>{opened ? <span className="shrink-0 text-xs font-bold text-emerald-700">Revisado</span> : null}</div><p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{document.content}</p><a onClick={() => setOpenedDocumentIds((current) => new Set(current).add(document.id))} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 text-sm font-bold text-accent transition-colors hover:bg-accent/10" href={`/api/legal/documents/${document.id}?tenant_id=${encodeURIComponent(tenantId)}`} target="_blank" rel="noreferrer"><FileText className="h-4 w-4" aria-hidden />Abrir PDF <ExternalLink className="h-4 w-4" aria-hidden /></a></article>; })}</div><p className="mt-4 text-xs leading-5 text-muted-foreground">Abre los {documents!.length} PDFs para habilitar la confirmación. Después siempre los encontrarás en Datos legales y contratos.</p><label className={`mt-5 flex gap-3 rounded-2xl border p-4 text-sm leading-6 ${allDocumentsOpened ? "cursor-pointer border-accent/30 bg-accent/5 text-foreground" : "border-border bg-muted text-muted-foreground"}`}><input disabled={!allDocumentsOpened} type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-[var(--accent)] disabled:opacity-50" />{allDocumentsOpened ? REPRESENTATION_DECLARATION : "Abre cada PDF para poder confirmar el acuerdo."}</label></> : null}</section> : null}
        {stage === "done" ? <section><WizardStepHeading titleId={TITLE_ID} eyebrow="Todo listo" title="Ya puedes abrir pedidos." subtitle="Tu comprobante quedó guardado en Datos legales y contratos." /><div className="mt-7 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800"><CheckCircle2 className="h-6 w-6 shrink-0" aria-hidden /><p className="text-sm font-semibold">Tu ficha de apertura y el acuerdo ya están listos.</p></div></section> : null}
      </div>
      <div className="hidden lg:block lg:mt-0"><p className="mb-2 text-xs font-semibold text-muted-foreground">Tu ficha de apertura</p><LegalProfilePreview profile={profile} stage={stage} /></div>
    </div>
  </WizardShell>;
}
