"use client";

import Image from "next/image";
import { CalendarClock, FileText, Package, Repeat, Store, Truck, Users } from "lucide-react";

import { Notification } from "@/components/ui/Notification";
import { WizardStepHeading } from "@/components/wizard/WizardStepHeading";

import { formatCurrency } from "@/features/qr/helpers/format";
import { formatInterval } from "@/lib/offers/planPeriods";
import { DURATION_PRESETS, FULFILLMENT_LABELS, WEEKDAY_LABELS } from "@/features/planes/constants/planOptions";
import { PLAN_WIZARD_TITLE_ID } from "@/features/planes/constants/planWizard";

import type { PickerItem } from "@/features/promociones/interfaces/offerWizard";
import type { PlanWizardValues } from "@/features/planes/interfaces/planWizard";

export function PlanReviewStep({
  values,
  itemsById,
  listValue,
  error,
  submitting,
  isEdit,
  onSaveDraft,
}: {
  values: PlanWizardValues;
  itemsById: Map<string, PickerItem>;
  listValue: number;
  error: string | null;
  submitting: boolean;
  isEdit: boolean;
  onSaveDraft: () => void;
}) {
  const every = formatInterval({ unit: values.intervalUnit, count: values.intervalCount });
  const price = Number(values.price) || 0;
  const duration = DURATION_PRESETS.find((preset) => preset.value === values.maxPeriods)?.label ?? `${values.maxPeriods} periodos`;
  const rows = [
    {
      icon: Package,
      term: "Incluye cada periodo",
      detail: values.items.map((item) => `${item.quantity} × ${itemsById.get(item.product_id)?.name ?? "Producto"}`).join(", "),
    },
    { icon: Repeat, term: "Se repite", detail: `Cada ${every} · ${duration}` },
    {
      icon: values.fulfillmentMethods.includes("delivery") ? Truck : Store,
      term: "Entrega",
      detail: [
        values.fulfillmentMethods.map((method) => FULFILLMENT_LABELS[method]).join(" o "),
        values.preferredWeekday !== null ? `los ${WEEKDAY_LABELS[values.preferredWeekday].toLowerCase()}` : null,
      ]
        .filter(Boolean)
        .join(", "),
    },
    {
      icon: CalendarClock,
      term: "Cobro",
      detail: `Pago cada periodo: el pedido se genera ${values.renewalLeadDays} días antes y hay ${values.graceDays} días de tolerancia.`,
    },
    ...(values.maxActiveMembers ? [{ icon: Users, term: "Cupo", detail: `${values.maxActiveMembers} clientes` }] : []),
    ...(values.description.trim() ? [{ icon: FileText, term: "Descripción", detail: values.description.trim() }] : []),
  ];

  return (
    <div className="space-y-6">
      <WizardStepHeading
        titleId={PLAN_WIZARD_TITLE_ID}
        eyebrow="Revisar"
        title={isEdit ? "¿Guardamos los cambios?" : "Todo listo para publicar"}
        subtitle={isEdit ? "Quienes ya están suscritos conservan el precio y los productos con los que entraron." : "Así lo verán tus clientes en la tienda."}
      />

      <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
        <div className="relative aspect-16/7 bg-accent/10">
          {values.imageUrl ? (
            <Image src={values.imageUrl} alt="" fill sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center">
              <Repeat className="h-10 w-10 text-accent/60" aria-hidden />
            </span>
          )}
          <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground shadow-sm">
            Suscripción
          </span>
        </div>
        <div className="p-5">
          <p className="text-xl font-bold text-foreground">{values.name || "Sin nombre"}</p>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
            <span className="text-3xl font-bold tracking-tight text-foreground">{formatCurrency(price)}</span>
            <span className="text-sm font-medium text-muted-foreground">/ {every}</span>
            {listValue > price ? <span className="text-sm text-muted-foreground line-through">{formatCurrency(listValue)}</span> : null}
          </p>
          <dl className="mt-4 space-y-3">
            {rows.map(({ icon: Icon, term, detail }) => (
              <div key={term} className="flex gap-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0">
                  <dt className="text-xs font-semibold text-muted-foreground">{term}</dt>
                  <dd className="text-sm text-foreground">{detail}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {error ? <Notification tone="error" message={error} /> : null}

      <button
        type="button"
        onClick={onSaveDraft}
        disabled={submitting}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:bg-border-soft hover:text-foreground disabled:opacity-50"
      >
        <FileText className="h-4 w-4" aria-hidden />
        Guardar como borrador (no se publica)
      </button>
    </div>
  );
}
