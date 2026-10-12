"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Banknote, CheckCircle2, ChevronDown, Clock3, CreditCard, MapPin, PackagePlus, Pencil, Plus, Save, Search, Truck, type LucideIcon } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { btnPrimaryFlex, btnSecondary } from "@/components/ui/buttonClasses";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import { apiFetch } from "@/services/apiFetch";
import { describeWeek } from "@/features/configuracion/helpers/businessHours";
import type { BusinessHours } from "@/features/configuracion/interfaces/businessHours";
import { PickupPointForm, type PickupPointDraft } from "./PickupPointForm";

type PaymentMethod = { id: string; kind: "bank_transfer" | "cash"; label: string | null; bank_name: string | null; account_holder: string | null; clabe: string | null; account_number: string | null; is_active: boolean };
type PickupPoint = PickupPointDraft;
type FulfillmentSettings = { online_payment_enabled?: boolean; delivery_enabled: boolean; delivery_fee: number | string; delivery_area_label: string | null; pickup_enabled: boolean };
type SavedData = { settings: FulfillmentSettings | null; pickupPoints: PickupPoint[]; paymentMethods: PaymentMethod[]; onlinePaymentConnected: boolean; businessHours: BusinessHours | null };
type FulfillmentForm = { online_payment_enabled: boolean; delivery_enabled: boolean; delivery_fee: string; delivery_area_label: string; pickup_enabled: boolean; pickup_points: PickupPoint[]; transfer: { id?: string; enabled: boolean; label: string; bank_name: string; account_holder: string; clabe: string; account_number: string }; cash_enabled: boolean };

const newPoint = (): PickupPoint => ({ name: "", address_text: "", reference: "", instructions: "", mapbox_feature_id: null, latitude: null, longitude: null, business_hours: null });
const emptyForm: FulfillmentForm = { online_payment_enabled: true, delivery_enabled: false, delivery_fee: "", delivery_area_label: "", pickup_enabled: false, pickup_points: [], transfer: { enabled: false, label: "Transferencia SPEI", bank_name: "", account_holder: "", clabe: "", account_number: "" }, cash_enabled: false };

/**
 * A compact operating console: the owner turns on only the ways they can
 * actually fulfil today. Point details live in a focused sheet so the main
 * setup stays scannable on a phone as well as in the desktop site editor.
 */
export function FulfillmentSettingsPanel({ tenantId, tenantSlug }: { tenantId: string; tenantSlug: string }) {
  const [data, setData] = useState<SavedData | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FulfillmentForm>(emptyForm);
  const [pointEditor, setPointEditor] = useState<{ index: number | null; value: PickupPoint } | null>(null);
  const [pointEditorTab, setPointEditorTab] = useState<"location" | "hours">("location");
  const [pointError, setPointError] = useState<string | null>(null);

  async function load() {
    const next = await apiFetch(`/api/tenant-fulfillment?tenant_id=${encodeURIComponent(tenantId)}`) as SavedData;
    setData(next);
    const transfer = next.paymentMethods.find((method) => method.kind === "bank_transfer");
    const cash = next.paymentMethods.find((method) => method.kind === "cash");
    setForm({
      online_payment_enabled: next.settings?.online_payment_enabled !== false,
      delivery_enabled: Boolean(next.settings?.delivery_enabled),
      delivery_fee: String(next.settings?.delivery_fee ?? ""),
      delivery_area_label: next.settings?.delivery_area_label ?? "",
      pickup_enabled: Boolean(next.settings?.pickup_enabled),
      pickup_points: next.pickupPoints.filter((point) => point.name || point.address_text),
      transfer: transfer ? { id: transfer.id, enabled: Boolean(transfer.is_active), label: transfer.label ?? "Transferencia SPEI", bank_name: transfer.bank_name ?? "", account_holder: transfer.account_holder ?? "", clabe: transfer.clabe ?? "", account_number: transfer.account_number ?? "" } : emptyForm.transfer,
      cash_enabled: Boolean(cash?.is_active),
    });
  }

  useEffect(() => { void load().catch((caught) => setError(caught instanceof Error ? caught.message : "No se pudo cargar la configuración.")); }, [tenantId]);

  function updateForm<Key extends keyof FulfillmentForm>(key: Key, value: FulfillmentForm[Key]) { setForm((current) => ({ ...current, [key]: value })); }
  function openPointEditor(index: number | null, value: PickupPoint) {
    setPointEditorTab("location");
    setPointError(null);
    setPointEditor({ index, value });
  }
  function savePoint() {
    if (!pointEditor) return;
    const clean = { ...pointEditor.value, name: pointEditor.value.name?.trim() ?? "", address_text: pointEditor.value.address_text?.trim() ?? "" };
    if (!clean.name || !clean.address_text) { setPointError("Agrega el nombre y la dirección del punto."); setPointEditorTab("location"); return; }
    setForm((current) => ({ ...current, pickup_points: pointEditor.index === null ? [...current.pickup_points, clean] : current.pickup_points.map((point, index) => index === pointEditor.index ? clean : point) }));
    setError(null);
    setPointError(null);
    setPointEditor(null);
  }
  function removePoint(index: number) {
    setForm((current) => ({ ...current, pickup_points: current.pickup_points.filter((_, currentIndex) => currentIndex !== index) }));
  }
  async function save() {
    setSaving(true); setMessage(null); setError(null);
    try {
      await apiFetch("/api/tenant-fulfillment", { method: "PATCH", body: JSON.stringify({ ...form, tenant_id: tenantId, delivery_fee: Number(form.delivery_fee || 0) }) });
      await load();
      setMessage("Guardado. El checkout ya mostrará sólo tus opciones activas.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo guardar."); }
    finally { setSaving(false); }
  }

  if (!data && !error) return <div className="py-8 text-sm text-muted-foreground">Cargando cobros y entregas…</div>;
  return <section className="mx-auto max-w-3xl space-y-5 pb-[calc(9rem+env(safe-area-inset-bottom))] md:pb-24"><div><p className="text-xs font-bold uppercase tracking-widest text-accent">Operación de tu tienda</p><h2 className="mt-1 text-xl font-bold text-foreground">Cobros y entregas</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Activa únicamente lo que ya puedes atender. Así el cliente llega al checkout con opciones claras.</p></div>
    {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p> : null}
    <ConfigCard icon={CreditCard} title="Pago en línea" description={data?.onlinePaymentConnected ? "Cobra con Mercado Pago desde el checkout seguro." : "Conecta Mercado Pago antes de activarlo para tus clientes."} enabled={form.online_payment_enabled} onToggle={(checked) => updateForm("online_payment_enabled", checked)}>{!data?.onlinePaymentConnected ? <Link href={`/dashboard/${tenantSlug}/configuracion?tab=finanzas`} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90">Configurar Mercado Pago <ChevronDown className="h-4 w-4 -rotate-90" /></Link> : <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Mercado Pago conectado. Puedes activarlo o dejar sólo transferencia y efectivo.</p>}</ConfigCard>
    <ConfigCard icon={Truck} title="Entrega a domicilio" description="El cliente busca su dirección con Mapbox o la captura manualmente." enabled={form.delivery_enabled} onToggle={(checked) => updateForm("delivery_enabled", checked)}><div className="grid gap-3 sm:grid-cols-2"><Field label="Costo de entrega" value={form.delivery_fee} inputMode="decimal" placeholder="$ 45" onChange={(value) => updateForm("delivery_fee", value)} /><MapboxAreaField value={form.delivery_area_label} onChange={(value) => updateForm("delivery_area_label", value)} /></div></ConfigCard>
    <ConfigCard icon={MapPin} title="Recolección en negocio" description="Agrega una o varias sucursales; la primera será el punto principal." enabled={form.pickup_enabled} onToggle={(checked) => { updateForm("pickup_enabled", checked); if (!checked) updateForm("cash_enabled", false); }}>
      <div className="space-y-3">
        {form.pickup_points.map((point, index) => {
          const effectiveHours = point.business_hours ?? data?.businessHours ?? null;
          const schedule = effectiveHours ? describeWeek(effectiveHours)[0] : "Horario por confirmar";
          return <article key={point.id ?? `${point.name}-${index}`} className="rounded-xl border border-border bg-background p-3">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"><MapPin className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-bold text-foreground">{point.name}</p>{index === 0 ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Principal</span> : null}{point.mapbox_feature_id ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700"><CheckCircle2 className="h-3 w-3" />Mapa</span> : null}</div>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{point.address_text}{point.reference ? ` · ${point.reference}` : ""}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-foreground"><Clock3 className="h-3.5 w-3.5 text-accent" />{schedule}<span className="font-normal text-muted-foreground">· {point.business_hours ? "Propio" : "General"}</span></p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => openPointEditor(index, point)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-bold text-foreground"><Pencil className="h-4 w-4" />Editar</button><button type="button" onClick={() => removePoint(index)} className="min-h-11 rounded-xl border border-red-200 text-sm font-bold text-red-600">Quitar</button></div>
          </article>;
        })}
        <button type="button" onClick={() => openPointEditor(null, newPoint())} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-accent/50 bg-accent/[0.035] px-4 text-sm font-bold text-accent"><Plus className="h-4 w-4" />Agregar punto de recolección</button>
      </div>
    </ConfigCard>
    <ConfigCard icon={CreditCard} title="Transferencia bancaria" description="El cliente recibe tus datos y sube su comprobante para revisión." enabled={form.transfer.enabled} onToggle={(checked) => updateForm("transfer", { ...form.transfer, enabled: checked })}><div className="grid gap-3 sm:grid-cols-2"><Field label="Nombre visible" value={form.transfer.label} onChange={(value) => updateForm("transfer", { ...form.transfer, label: value })} /><Field label="Banco" value={form.transfer.bank_name} placeholder="BBVA" onChange={(value) => updateForm("transfer", { ...form.transfer, bank_name: value })} /><Field label="Titular" value={form.transfer.account_holder} placeholder="Nombre o razón social" onChange={(value) => updateForm("transfer", { ...form.transfer, account_holder: value })} /><Field label="CLABE (18 dígitos)" value={form.transfer.clabe} inputMode="numeric" onChange={(value) => updateForm("transfer", { ...form.transfer, clabe: value.replace(/\D/g, "").slice(0, 18) })} /></div></ConfigCard>
    <ConfigCard icon={Banknote} title="Efectivo al recoger" description="El cliente paga cuando pasa por su pedido." enabled={form.cash_enabled} disabled={!form.pickup_enabled} onToggle={(checked) => updateForm("cash_enabled", checked)} />
    {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><p>{message}</p><Link href={`/sitio/${tenantSlug}/inicio`} className="mt-2 inline-flex font-bold text-emerald-800 underline underline-offset-2">Ver cómo lo verá el cliente</Link></div> : null}
    <MobileActionBar className="md:hidden"><button type="button" onClick={() => void save()} disabled={saving} className="mx-auto flex min-h-12 w-full max-w-3xl items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-accent-foreground shadow-sm transition-colors hover:bg-accent/90 disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Guardando…" : "Guardar cobros y entregas"}</button></MobileActionBar>
    <div className="sticky bottom-0 z-20 hidden border-t border-border bg-background/95 py-3 shadow-[0_-8px_20px_rgba(15,23,42,0.08)] backdrop-blur md:block"><button type="button" onClick={() => void save()} disabled={saving} className="mx-auto flex min-h-12 w-full max-w-3xl items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-accent-foreground shadow-sm transition-colors hover:bg-accent/90 disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Guardando…" : "Guardar cobros y entregas"}</button></div>
    <FormSheet isOpen={pointEditor !== null} onClose={() => { setPointEditor(null); setPointError(null); }} title={pointEditor?.index === null ? "Agregar punto de recolección" : "Editar punto de recolección"} description="Ubicación exacta, referencia y horario visible para el cliente." icon={PackagePlus} maxWidth="max-w-2xl" footer={<div className="flex flex-col gap-2 sm:flex-row-reverse"><button type="button" onClick={savePoint} className={`${btnPrimaryFlex} sm:flex-1`}>{pointEditor?.index === null ? "Agregar punto" : "Guardar punto"}</button><button type="button" onClick={() => { setPointEditor(null); setPointError(null); }} className={`${btnSecondary} sm:flex-1`}>Cancelar</button></div>}>
      {pointError ? <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{pointError}</p> : null}
      {pointEditor ? <PickupPointForm value={pointEditor.value} globalHours={data?.businessHours ?? null} tab={pointEditorTab} onTabChange={setPointEditorTab} onChange={(value) => { setPointError(null); setPointEditor({ ...pointEditor, value }); }} /> : null}
    </FormSheet>
  </section>;
}

function ConfigCard({ icon: Icon, title, description, enabled, disabled, onToggle, children }: { icon: LucideIcon; title: string; description: string; enabled?: boolean; disabled?: boolean; onToggle?: (checked: boolean) => void; children?: ReactNode }) { const isToggleable = typeof enabled === "boolean" && onToggle; return <section className={`rounded-2xl border p-4 ${enabled ? "border-accent/35 bg-accent/[0.03]" : "border-border bg-surface"} ${disabled ? "opacity-50" : ""}`}><div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-foreground">{title}</h3><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p></div>{isToggleable ? <button type="button" role="switch" aria-checked={enabled} aria-label={`${enabled ? "Desactivar" : "Activar"} ${title}`} disabled={disabled} onClick={() => onToggle(!enabled)} className={`h-7 w-12 shrink-0 rounded-full p-1 transition ${enabled ? "bg-accent" : "bg-muted"}`}><span className={`block h-5 w-5 rounded-full bg-white shadow transition ${enabled ? "translate-x-5" : ""}`} /></button> : null}</div>{(!isToggleable || enabled) && children ? <div className="mt-4 border-t border-border/60 pt-4">{children}</div> : null}</div></div></section>; }
function Field({ label, value, onChange, placeholder, inputMode, help }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; inputMode?: "decimal" | "numeric"; help?: string }) { return <label className="block text-sm font-semibold text-foreground">{label}<input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} inputMode={inputMode} className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15" />{help ? <span className="mt-1.5 block text-xs font-normal leading-5 text-muted-foreground">{help}</span> : null}</label>; }

function MapboxAreaField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [query, setQuery] = useState(value);
  const [places, setPlaces] = useState<{ id: string; label: string }[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => { setQuery(value); }, [value]);
  useEffect(() => {
    if (query.trim().length < 3 || query === value) { setPlaces([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/public/places?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const body = await response.json() as { features?: { id: string; label: string }[]; unavailable?: boolean };
        setPlaces(body.features ?? []); setUnavailable(Boolean(body.unavailable));
      } catch (caught) { if (!(caught instanceof DOMException && caught.name === "AbortError")) setPlaces([]); }
    }, 320);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, value]);
  return <div className="relative text-sm font-semibold text-foreground"><label htmlFor="delivery-area">Zona que atiendes</label><div className="relative mt-1.5"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input id="delivery-area" value={query} onChange={(event) => setQuery(event.target.value)} onBlur={() => onChange(query.trim())} placeholder="Busca una ciudad o zona" className="min-h-11 w-full rounded-xl border border-border bg-background py-0 pl-9 pr-3 text-sm font-normal outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15" /></div>{places.length > 0 ? <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-lg">{places.map((place) => <button key={place.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setQuery(place.label); onChange(place.label); setPlaces([]); }} className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-normal text-foreground hover:bg-muted">{place.label}</button>)}</div> : null}<span className="mt-1.5 block text-xs font-normal leading-5 text-muted-foreground">Busca la ciudad o colonia en Mapbox; también puedes describir una cobertura más amplia.</span>{unavailable ? <span className="mt-1 block text-xs font-normal text-amber-700">Mapbox no respondió; puedes escribir la zona manualmente.</span> : null}</div>;
}
