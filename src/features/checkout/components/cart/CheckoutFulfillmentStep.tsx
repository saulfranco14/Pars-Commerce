"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CreditCard,
  Landmark,
  MapPin,
  PackageCheck,
} from "lucide-react";

import { AddressCapture, type DeliveryAddress } from "./AddressCapture";
import { isOpenAt, nextOpening } from "@/features/configuracion/helpers/businessHours";
import type { BusinessHours } from "@/features/configuracion/interfaces/businessHours";
import type {
  CheckoutFulfillmentMethod,
  CheckoutPaymentMethod,
} from "@/features/checkout/interfaces/publicCheckout";

export type PublicCheckoutOptions = {
  deliveryEnabled: boolean;
  deliveryFee: number;
  deliveryAreaLabel: string | null;
  pickupEnabled: boolean;
  pickupPoints: {
    id: string;
    name: string;
    address_text: string;
    reference?: string | null;
    instructions?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    mapbox_feature_id?: string | null;
    /** Already resolved to point-specific or inherited business hours. */
    business_hours?: BusinessHours | null;
  }[];
  onlinePaymentEnabled: boolean;
  transferEnabled: boolean;
  cashEnabled: boolean;
};

export type CheckoutFulfillmentSelection = {
  fulfillment: CheckoutFulfillmentMethod;
  payment: CheckoutPaymentMethod;
  pickupPointId?: string;
  delivery?: DeliveryAddress;
};

const EMPTY_DELIVERY: DeliveryAddress = {
  recipient_name: "",
  phone: "",
  address_text: "",
  reference: "",
};

export function createInitialCheckoutSelection(options: PublicCheckoutOptions): CheckoutFulfillmentSelection {
  return {
    fulfillment: options.deliveryEnabled ? "delivery" : "pickup",
    payment: options.onlinePaymentEnabled
      ? "mercadopago"
      : options.transferEnabled
        ? "bank_transfer"
        : "cash",
    pickupPointId: options.pickupPoints[0]?.id,
    delivery: { ...EMPTY_DELIVERY },
  };
}

interface CheckoutFulfillmentStepProps {
  options: PublicCheckoutOptions;
  selection: CheckoutFulfillmentSelection;
  subtotal: number;
  accentColor: string;
  footerContainerId: string;
  onSelectionChange: (selection: CheckoutFulfillmentSelection) => void;
  onContinue: (selection: CheckoutFulfillmentSelection) => void;
}

export function CheckoutFulfillmentStep({
  options,
  selection,
  subtotal,
  accentColor,
  footerContainerId,
  onSelectionChange,
  onContinue,
}: CheckoutFulfillmentStepProps) {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<"fulfillment" | "payment">("fulfillment");
  const now = useMemo(() => new Date(), []);
  const { fulfillment, payment, pickupPointId } = selection;
  const delivery = selection.delivery ?? EMPTY_DELIVERY;
  const phoneDigits = delivery.phone.replace(/\D/g, "");
  const deliveryComplete = Boolean(
    delivery.recipient_name.trim().length >= 2 &&
      phoneDigits.length >= 10 &&
      phoneDigits.length <= 12 &&
      delivery.address_text.trim().length >= 6,
  );
  const fulfillmentComplete = fulfillment === "pickup" ? Boolean(pickupPointId) : deliveryComplete;
  const paymentAvailable =
    (payment === "mercadopago" && options.onlinePaymentEnabled) ||
    (payment === "bank_transfer" && options.transferEnabled) ||
    (payment === "cash" && options.cashEnabled && fulfillment === "pickup");
  const deliveryFee = fulfillment === "delivery" ? options.deliveryFee : 0;
  const orderTotal = subtotal + deliveryFee;

  useEffect(() => setMounted(true), []);

  const chooseFulfillment = (next: CheckoutFulfillmentMethod) => {
    let nextPayment = payment;
    if (next === "delivery" && payment === "cash") {
      nextPayment = options.onlinePaymentEnabled ? "mercadopago" : "bank_transfer";
    }
    onSelectionChange({
      ...selection,
      fulfillment: next,
      payment: nextPayment,
      pickupPointId: selection.pickupPointId ?? options.pickupPoints[0]?.id,
      delivery: selection.delivery ?? { ...EMPTY_DELIVERY },
    });
  };

  const footer = (
    <div className="rounded-t-[28px] border-x border-t border-border bg-white px-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-12px_32px_rgba(15,23,42,0.14)] xl:rounded-none xl:border-x-0 xl:px-5 xl:pb-4 xl:shadow-none">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-xs text-gray-500">
          <p>{fulfillment === "delivery" ? "Entrega a domicilio" : "Recolección"}</p>
          {deliveryFee > 0 ? <p>Envío ${deliveryFee.toFixed(2)}</p> : null}
        </div>
        <div className="text-right"><p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Total</p><p className="text-lg font-black tabular-nums text-gray-950">${orderTotal.toFixed(2)}</p></div>
      </div>
      <button
        type="button"
        disabled={tab === "fulfillment" ? !fulfillmentComplete : !fulfillmentComplete || !paymentAvailable}
        onClick={() => tab === "fulfillment" ? setTab("payment") : onContinue(selection)}
        className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl px-4 text-base font-bold text-white shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: accentColor }}
      >
        {tab === "fulfillment" ? "Continuar a forma de pago" : "Continuar con mis datos"}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
      <p className={`mt-2 min-h-4 text-center text-[11px] text-gray-500 ${fulfillmentComplete ? "invisible" : ""}`} aria-hidden={fulfillmentComplete}>
        {fulfillment === "delivery" ? "Completa nombre, teléfono y dirección." : "Elige un punto de recolección."}
      </p>
    </div>
  );

  const footerTarget = mounted ? document.getElementById(footerContainerId) : null;
  return (
    <section className="space-y-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.08em] text-gray-500">Paso 1 de 2</p>
        <h3 className="mt-1 text-lg font-bold text-gray-900">Organiza tu entrega</h3>
        <p className="mt-1 text-sm text-gray-500">Primero elige cómo recibirlo; después cómo pagarlo.</p>
      </div>

      <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1" role="tablist" aria-label="Entrega y pago">
        <StepTab active={tab === "fulfillment"} completed={fulfillmentComplete} onClick={() => setTab("fulfillment")} number="1" label="Recibir" icon={MapPin} />
        <StepTab active={tab === "payment"} completed={paymentAvailable} onClick={() => setTab("payment")} number="2" label="Pagar" icon={CreditCard} />
      </div>

      {tab === "fulfillment" ? (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {options.deliveryEnabled ? <Choice active={fulfillment === "delivery"} onClick={() => chooseFulfillment("delivery")} icon={MapPin} title="Entrega a domicilio" text={`${options.deliveryAreaLabel ?? "Zona disponible"}${options.deliveryFee > 0 ? ` · $${options.deliveryFee.toFixed(2)}` : ""}`} /> : null}
            {options.pickupEnabled ? <Choice active={fulfillment === "pickup"} onClick={() => chooseFulfillment("pickup")} icon={PackageCheck} title="Recoger en un punto" text={`${options.pickupPoints.length} ${options.pickupPoints.length === 1 ? "ubicación disponible" : "ubicaciones disponibles"}`} /> : null}
          </div>
          {fulfillment === "delivery" ? <AddressCapture value={delivery} onChange={(nextDelivery) => onSelectionChange({ ...selection, delivery: nextDelivery })} /> : null}
          {fulfillment === "pickup" ? <PickupPointChoices points={options.pickupPoints} selectedId={pickupPointId} now={now} onSelect={(id) => onSelectionChange({ ...selection, pickupPointId: id })} /> : null}
        </div>
      ) : (
        <div className="space-y-3">
          <div><p className="text-sm font-bold text-gray-900">¿Cómo quieres pagar?</p><p className="mt-1 text-xs leading-5 text-gray-500">Sólo aparecen los métodos que este negocio ya configuró.</p></div>
          <div className="grid gap-2">
            {options.onlinePaymentEnabled ? <Choice active={payment === "mercadopago"} onClick={() => onSelectionChange({ ...selection, payment: "mercadopago" })} icon={CreditCard} title="Pagar en línea" text="Confirmación inmediata con Mercado Pago." /> : null}
            {options.transferEnabled ? <Choice active={payment === "bank_transfer"} onClick={() => onSelectionChange({ ...selection, payment: "bank_transfer" })} icon={Landmark} title="Transferencia bancaria" text="Subes tu comprobante y el negocio lo valida." /> : null}
            {options.cashEnabled && fulfillment === "pickup" ? <Choice active={payment === "cash"} onClick={() => onSelectionChange({ ...selection, payment: "cash" })} icon={PackageCheck} title="Pagar al recoger" text="Pagas directamente cuando recibes tu pedido." /> : null}
          </div>
          {!paymentAvailable ? <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">Elige uno de los métodos disponibles para continuar.</p> : null}
        </div>
      )}

      {footerTarget ? createPortal(footer, footerTarget) : null}
    </section>
  );
}

function StepTab({ active, completed, onClick, number, label, icon: Icon }: { active: boolean; completed: boolean; onClick: () => void; number: string; label: string; icon: typeof MapPin }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex h-12 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold transition ${active ? "bg-white text-gray-950 shadow-sm" : "text-gray-500"}`}
    >
      <span
        className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${active ? "bg-blue-600 text-white" : "bg-white text-gray-500"}`}
      >
        <Icon className="h-4 w-4" aria-hidden />
        {completed ? (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-gray-100">
            <Check className="h-2.5 w-2.5" aria-hidden />
          </span>
        ) : (
          <span className="sr-only">Paso {number}</span>
        )}
      </span>
      <span className="leading-none">{label}</span>
    </button>
  );
}

function PickupPointChoices({ points, selectedId, now, onSelect }: { points: PublicCheckoutOptions["pickupPoints"]; selectedId?: string; now: Date; onSelect: (id: string) => void }) {
  const visible = points.slice(0, 3);
  const hidden = points.slice(3);
  return <div className="space-y-2"><div><p className="text-sm font-bold text-gray-900">Elige el punto que te conviene</p><p className="mt-1 text-xs text-gray-500">Compara ubicación y horario antes de continuar.</p></div>{visible.map((point) => <PickupPointChoice key={point.id} point={point} active={selectedId === point.id} now={now} onClick={() => onSelect(point.id)} />)}{hidden.length > 0 ? <details className="group rounded-xl border border-gray-200 bg-white"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3 text-sm font-bold text-gray-700">Ver {hidden.length} puntos más <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" aria-hidden /></summary><div className="space-y-2 border-t border-gray-100 p-2">{hidden.map((point) => <PickupPointChoice key={point.id} point={point} active={selectedId === point.id} now={now} onClick={() => onSelect(point.id)} />)}</div></details> : null}</div>;
}

function PickupPointChoice({ point, active, now, onClick }: { point: PublicCheckoutOptions["pickupPoints"][number]; active: boolean; now: Date; onClick: () => void }) {
  const availability = getAvailability(point.business_hours ?? null, now);
  return <button type="button" onClick={onClick} aria-pressed={active} className={`flex min-h-16 w-full items-start gap-3 rounded-xl border p-3 text-left transition ${active ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900" : "border-gray-200 bg-white hover:border-gray-400"}`}><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" /><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-bold text-gray-900">{point.name}</span><span className={`shrink-0 text-[10px] font-bold ${availability.open ? "text-emerald-700" : "text-amber-700"}`}>{availability.label}</span></span><span className="mt-0.5 block text-xs leading-4 text-gray-500">{point.address_text}</span>{point.reference ? <span className="mt-1 block text-[11px] text-gray-600">Referencia: {point.reference}</span> : null}</span></button>;
}

function getAvailability(hours: BusinessHours | null, now: Date): { open: boolean; label: string } {
  if (!hours) return { open: false, label: "Horario por confirmar" };
  if (isOpenAt(hours, now)) return { open: true, label: "Abierto ahora" };
  const opens = nextOpening(hours, now);
  if (!opens) return { open: false, label: "Cerrado" };
  const label = new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", weekday: "short", hour: "2-digit", minute: "2-digit" }).format(opens);
  return { open: false, label: `Abre ${label}` };
}

function Choice({ active, onClick, icon: Icon, title, text }: { active: boolean; onClick: () => void; icon: typeof MapPin; title: string; text: string }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={`flex min-h-16 w-full items-start gap-3 rounded-xl border p-3 text-left transition ${active ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900" : "border-gray-200 bg-white hover:border-gray-400"}`}><Icon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" /><span><span className="block text-sm font-bold text-gray-900">{title}</span><span className="mt-0.5 block text-xs leading-4 text-gray-500">{text}</span></span></button>;
}
