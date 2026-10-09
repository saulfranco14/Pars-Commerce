"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, Copy, ExternalLink, Store } from "lucide-react";

import { PageHeader } from "@/components/admin/PageHeader";
import { STARTER_CATALOGS } from "@/features/catalog/catalogDefinitions";

function toSlug(value: string) {
  return value.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

type AssistedResult = {
  invitation_url?: string;
  preview_url?: string;
  preview_expires_at?: string;
  tenant_slug?: string;
  email_delivery?: string;
};

export default function NuevoNegocioAsistidoPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [catalog, setCatalog] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssistedResult | null>(null);
  const selected = useMemo(() => STARTER_CATALOGS.find((item) => item.key === catalog), [catalog]);

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      const response = await fetch("/api/platform/assisted-onboardings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: slug || toSlug(name), business_type: selected?.businessType ?? "otro", catalog_template_key: catalog || null, owner_name: ownerName, owner_email: ownerEmail, owner_phone: ownerPhone, billing_mode: "configuration_limited" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No pudimos preparar el negocio.");
      setResult(data);
    } catch (value) {
      setError(value instanceof Error ? value.message : "No pudimos preparar el negocio.");
    } finally {
      setSaving(false);
    }
  }

  async function copyValue(value?: string) {
    if (value) await navigator.clipboard.writeText(value);
  }

  if (result) return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader eyebrow="Plataforma" title="Negocio preparado" description="El propietario sólo necesita revisar, aprobar y configurar sus cobros." />
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
        <CheckCircle2 className="h-8 w-8 text-emerald-700" />
        <h2 className="mt-3 text-lg font-bold text-emerald-900">Alta asistida creada</h2>
        <p className="mt-1 text-sm text-emerald-800">{result.email_delivery === "sent" ? "También enviamos el acceso al correo del propietario." : "El correo quedó pendiente; comparte el enlace seguro por WhatsApp."}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => void copyValue(result.invitation_url)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground"><Copy className="h-4 w-4" />Copiar acceso del dueño</button>
          <button type="button" onClick={() => void copyValue(result.preview_url)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground"><Copy className="h-4 w-4" />Copiar vista previa</button>
          {result.preview_url && <a href={result.preview_url} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground sm:col-span-2"><ExternalLink className="h-4 w-4" />Abrir catálogo privado</a>}
        </div>
        <p className="mt-4 text-xs text-emerald-800">La vista previa es sólo lectura, vence en 72 horas y puede revocarse. El acceso pertenece únicamente al dueño.</p>
      </section>
      <Link href="/dashboard/plataforma?view=businesses" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground">Volver a negocios</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader eyebrow="Plataforma" title="Dar de alta un negocio" description="Prepara el catálogo y entrega al dueño un acceso sencillo para completar su activación." />
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-foreground">Nombre del negocio<input value={name} onChange={(event) => { setName(event.target.value); if (!slug) setSlug(toSlug(event.target.value)); }} className="input-form mt-1 min-h-12 w-full rounded-xl" placeholder="Abarrotes La Esquina" /></label>
          <label className="text-sm font-semibold text-foreground">URL del negocio<input value={slug} onChange={(event) => setSlug(toSlug(event.target.value))} className="input-form mt-1 min-h-12 w-full rounded-xl" placeholder="abarrotes-la-esquina" /></label>
          <label className="text-sm font-semibold text-foreground sm:col-span-2">Catálogo inicial<select value={catalog} onChange={(event) => setCatalog(event.target.value)} className="select-custom mt-1 min-h-12 w-full rounded-xl border border-border bg-surface px-3"><option value="">Iniciar sin catálogo</option>{STARTER_CATALOGS.map((item) => <option key={item.key} value={item.key}>{item.name} · {item.products.length} productos y {item.services.length} servicios</option>)}</select></label>
        </div>
        <div className="my-6 border-t border-border-soft" />
        <h2 className="text-sm font-bold text-foreground">Propietario del negocio</h2>
        <p className="mt-1 text-xs text-muted-foreground">Sólo necesitamos el nombre del negocio y un contacto del propietario. El correo crea el acceso; WhatsApp queda como apoyo comercial.</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-foreground">Nombre<input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} className="input-form mt-1 min-h-12 w-full rounded-xl" placeholder="Nombre del dueño" /></label>
          <label className="text-sm font-semibold text-foreground">WhatsApp<input value={ownerPhone} onChange={(event) => setOwnerPhone(event.target.value)} className="input-form mt-1 min-h-12 w-full rounded-xl" placeholder="+5215512345678" /></label>
          <label className="text-sm font-semibold text-foreground sm:col-span-2">Correo de acceso<input type="email" value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} className="input-form mt-1 min-h-12 w-full rounded-xl" placeholder="dueno@negocio.com" /></label>
        </div>
        <div className="mt-6 rounded-xl bg-surface-raised p-4 text-sm text-muted-foreground"><p className="font-bold text-foreground">Así se entrega</p><ol className="mt-2 space-y-1"><li>1. Tlaco prepara el negocio sin cobrar ni publicar.</li><li>2. El dueño revisa una vista previa privada y aprueba precios.</li><li>3. Configura contacto, operación y cobros antes de recibir pedidos.</li></ol></div>
        {error && <p role="alert" className="mt-4 text-sm font-semibold text-red-700">{error}</p>}
        <button type="button" onClick={() => void submit()} disabled={saving || !name || !ownerEmail} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground disabled:opacity-50"><Store className="h-4 w-4" />{saving ? "Preparando negocio…" : "Preparar negocio y acceso"}</button>
      </section>
    </div>
  );
}
