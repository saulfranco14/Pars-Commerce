"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, CheckCircle2, FileText, Landmark, Loader2, Mail, MapPin, Phone, ShieldCheck, Store, UserRound } from "lucide-react";

import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { FormInput } from "@/components/ui/FormInput";
import { Notification } from "@/components/ui/Notification";

type LegalProfile = {
  party_type: "individual" | "company";
  legal_name: string;
  tax_id: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  contractual_email: string;
  contractual_phone: string;
  representative_name: string;
  representative_role: string;
  public_seller_name: string;
  public_privacy_contact: string;
};

type LegalDocument = { id: string; title: string; version: string; content: string; content_hash: string; effective_at?: string | null };

const REPRESENTATION_DECLARATION = "Acepto el acuerdo de Tlaco y declaro que puedo representar este negocio.";

const EMPTY_PROFILE: LegalProfile = {
  party_type: "individual", legal_name: "", tax_id: "", address_line1: "", address_line2: "", city: "", state: "", postal_code: "", country: "México", contractual_email: "", contractual_phone: "", representative_name: "", representative_role: "", public_seller_name: "", public_privacy_contact: "",
};

function StepSeal({ number, title, ready }: { number: number; title: string; ready: boolean }) {
  return <li className="flex items-center gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${ready ? "bg-emerald-600 text-white" : "bg-border-soft text-muted-foreground"}`}>{ready ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : number}</span><span className="text-sm font-semibold text-foreground">{title}</span></li>;
}

export function LegalOpeningCard() {
  const router = useRouter();
  const params = useSearchParams();
  const tenantId = params.get("tenant") ?? "";
  const returnTo = params.get("return") || "/dashboard";
  const [profile, setProfile] = useState<LegalProfile>(EMPTY_PROFILE);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [stage, setStage] = useState<"intro" | "details" | "agreement" | "done">("intro");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    void Promise.all([
      fetch(`/api/tenants/${tenantId}/legal-profile`, { cache: "no-store" }).then((response) => response.json()),
      fetch(`/api/legal/offers?tenant_id=${tenantId}`, { cache: "no-store" }).then((response) => response.json()),
    ]).then(([profileData, offerData]) => {
      if (profileData.profile) setProfile((current) => ({ ...current, ...profileData.profile }));
      if (Array.isArray(offerData.documents)) setDocuments(offerData.documents);
    }).catch(() => setError("No pudimos cargar el acuerdo. Intenta de nuevo."));
  }, [tenantId]);

  const profileReady = useMemo(() => {
    const basics = [profile.legal_name, profile.tax_id, profile.address_line1, profile.city, profile.state, profile.postal_code, profile.contractual_email, profile.contractual_phone, profile.public_seller_name, profile.public_privacy_contact];
    return basics.every((value) => value.trim()) && (profile.party_type === "individual" || (profile.representative_name.trim() && profile.representative_role.trim()));
  }, [profile]);
  const set = <K extends keyof LegalProfile,>(field: K, value: LegalProfile[K]) =>
    setProfile((current) => ({ ...current, [field]: value }));

  async function saveDetails() {
    if (!tenantId || !profileReady) { setError("Completa los datos marcados para continuar."); return; }
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/tenants/${tenantId}/legal-profile`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No pudimos guardar tus datos.");
      setStage("agreement");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No pudimos guardar tus datos."); }
    finally { setBusy(false); }
  }

  async function accept() {
    if (!accepted || !tenantId) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/legal/acceptances", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenant_id: tenantId, idempotency_key: crypto.randomUUID?.() ?? `${tenantId}-${Date.now()}`, declaration: REPRESENTATION_DECLARATION }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No pudimos registrar tu aceptación.");
      setStage("done");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No pudimos registrar tu aceptación."); }
    finally { setBusy(false); }
  }

  if (!tenantId) return <main className="mx-auto flex min-h-dvh max-w-md items-center px-5"><Notification tone="error" message="No encontramos el negocio que quieres abrir." /></main>;

  const title = stage === "intro" ? "Antes de abrir tu tienda, dejemos tus datos listos." : stage === "details" ? "Cuéntanos quién administra el negocio." : stage === "agreement" ? "Revisa el acuerdo con calma." : "Tu tienda ya puede abrir pedidos.";
  const copy = stage === "intro" ? "Esto deja claro quién usa Tlaco, cómo cuidamos la información y cómo puedes salir cuando lo necesites." : stage === "details" ? "Usaremos estos datos para tu expediente. No se mostrarán públicamente." : stage === "agreement" ? "Puedes leer cada documento antes de decidir. No hay cargos automáticos por aceptar." : "Guardamos tu comprobante con los documentos exactos que acabas de aceptar.";

  return <main className="min-h-dvh bg-background px-5 py-6 sm:px-8"><div className="mx-auto grid min-h-[calc(100dvh-3rem)] max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-stretch"><section className="order-2 flex min-w-0 flex-col rounded-3xl border border-border bg-surface-raised p-5 shadow-card sm:p-8 lg:order-1"><div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">Apertura Tlaco</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1><p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{copy}</p></div><ol className="mt-7 grid gap-3 sm:grid-cols-3"><StepSeal number={1} title="Datos" ready={profileReady}/><StepSeal number={2} title="Acuerdo" ready={stage === "done"}/><StepSeal number={3} title="Abrir pedidos" ready={stage === "done"}/></ol>{error ? <Notification className="mt-6" tone="error" message={error} /> : null}
    {stage === "intro" ? <div className="mt-auto pt-8"><button type="button" onClick={() => setStage("details")} className="min-h-12 w-full rounded-2xl bg-accent px-5 text-sm font-bold text-accent-foreground hover:bg-accent-hover sm:w-auto">Completar ahora</button><button type="button" onClick={() => router.replace("/dashboard?legal_deferred=1")} className="mt-3 min-h-12 w-full rounded-2xl border border-border px-5 text-sm font-semibold text-foreground hover:bg-border-soft sm:ml-3 sm:mt-0 sm:w-auto">Salir por ahora</button></div> : null}
    {stage === "details" ? <form className="mt-7 space-y-5" onSubmit={(event) => { event.preventDefault(); void saveDetails(); }}><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => set("party_type", "individual")} className={`min-h-12 rounded-2xl border-2 px-3 text-sm font-bold ${profile.party_type === "individual" ? "border-accent bg-accent/5 text-accent" : "border-border text-muted-foreground"}`}><UserRound className="mr-2 inline h-4 w-4"/>Persona física</button><button type="button" onClick={() => set("party_type", "company")} className={`min-h-12 rounded-2xl border-2 px-3 text-sm font-bold ${profile.party_type === "company" ? "border-accent bg-accent/5 text-accent" : "border-border text-muted-foreground"}`}><Building2 className="mr-2 inline h-4 w-4"/>Persona moral</button></div><div className="grid gap-4 sm:grid-cols-2"><FormInput label={profile.party_type === "individual" ? "Nombre legal" : "Razón social"} icon={Landmark} value={profile.legal_name} onChange={(event) => set("legal_name", event.target.value)} required/><FormInput label="RFC" icon={FileText} value={profile.tax_id} onChange={(event) => set("tax_id", event.target.value)} required/><FormInput label="Correo contractual" type="email" icon={Mail} value={profile.contractual_email} onChange={(event) => set("contractual_email", event.target.value)} required/><FormInput label="Teléfono contractual" type="tel" icon={Phone} value={profile.contractual_phone} onChange={(event) => set("contractual_phone", event.target.value)} required/><FormInput label="Domicilio" icon={MapPin} className="sm:col-span-2" value={profile.address_line1} onChange={(event) => set("address_line1", event.target.value)} required/><FormInput label="Interior o referencia" optional className="sm:col-span-2" value={profile.address_line2} onChange={(event) => set("address_line2", event.target.value)}/><FormInput label="Ciudad" value={profile.city} onChange={(event) => set("city", event.target.value)} required/><FormInput label="Estado" value={profile.state} onChange={(event) => set("state", event.target.value)} required/><FormInput label="Código postal" value={profile.postal_code} onChange={(event) => set("postal_code", event.target.value)} required/><FormInput label="Nombre que verá tu cliente" icon={Store} value={profile.public_seller_name} onChange={(event) => set("public_seller_name", event.target.value)} required/><FormInput label="Contacto de privacidad público" icon={ShieldCheck} className="sm:col-span-2" value={profile.public_privacy_contact} onChange={(event) => set("public_privacy_contact", event.target.value)} required/>{profile.party_type === "company" ? <><FormInput label="Representante" icon={UserRound} value={profile.representative_name} onChange={(event) => set("representative_name", event.target.value)} required/><FormInput label="Cargo o facultad" value={profile.representative_role} onChange={(event) => set("representative_role", event.target.value)} required/></> : null}</div><div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row"><button type="button" onClick={() => setStage("intro")} className="min-h-12 rounded-2xl border border-border px-5 text-sm font-semibold">Volver</button><button type="submit" disabled={busy} className="min-h-12 rounded-2xl bg-accent px-5 text-sm font-bold text-accent-foreground disabled:opacity-60">{busy ? "Guardando…" : "Revisar acuerdo"}</button></div></form> : null}
    {stage === "agreement" ? <section className="mt-7 space-y-3"><div className="space-y-3">{documents.map((document) => <details key={document.id} className="rounded-2xl border border-border bg-background p-4"><summary className="cursor-pointer list-none text-sm font-bold text-foreground">{document.title}<span className="ml-2 text-xs font-medium text-muted-foreground">v{document.version}</span></summary><p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{document.content}</p><a className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-accent underline" href={`/api/legal/documents/${document.id}?tenant_id=${encodeURIComponent(tenantId)}`} target="_blank" rel="noreferrer">Abrir PDF membretado</a></details>)}</div><label className="mt-5 flex cursor-pointer gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-4 text-sm leading-6 text-foreground"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-[var(--accent)]"/>{REPRESENTATION_DECLARATION}</label><div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row"><button type="button" onClick={() => setStage("details")} className="min-h-12 rounded-2xl border border-border px-5 text-sm font-semibold">Revisar datos</button><button type="button" disabled={!accepted || busy} onClick={() => void accept()} className="min-h-12 rounded-2xl bg-accent px-5 text-sm font-bold text-accent-foreground disabled:opacity-60">{busy ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin"/>Guardando…</> : "Aceptar y continuar"}</button></div></section> : null}
    {stage === "done" ? <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><CheckCircle2 className="h-7 w-7 text-emerald-600" aria-hidden/><h2 className="mt-3 text-lg font-bold text-foreground">Todo listo para abrir.</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Tu comprobante se generó y podrás consultarlo desde Datos legales y contratos.</p><button type="button" onClick={() => router.replace(returnTo)} className="mt-5 min-h-12 rounded-2xl bg-accent px-5 text-sm font-bold text-accent-foreground">Volver a mi negocio</button></div> : null}</section><aside className="order-1 flex min-h-48 flex-col justify-between rounded-3xl border border-border bg-surface p-6 shadow-soft lg:order-2"><TlacoLogo size="xl"/><div><p className="text-lg font-bold tracking-tight text-foreground">Tu negocio sigue seguro.</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Puedes leer todo con calma. No hay una verificación de correo ni un cobro escondido en este paso.</p></div></aside></div></main>;
}
