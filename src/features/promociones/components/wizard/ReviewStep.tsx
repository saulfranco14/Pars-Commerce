"use client";

import Image from "next/image";
import { CalendarRange, FileText, Layers, Tag } from "lucide-react";

import { Notification } from "@/components/ui/Notification";
import { WizardStepHeading } from "@/components/wizard/WizardStepHeading";
import { PromotionPreviewStrip } from "@/features/promociones/components/wizard/PromotionPreviewStrip";
import { PromotionCollage } from "@/features/promociones/components/PromotionCollage";

import { formatOfferLabel } from "@/lib/offers/formatOfferLabel";
import { PROMOTION_MECHANICS } from "@/features/promociones/constants/promotionMechanics";
import { OFFER_WIZARD_TITLE_ID } from "@/features/promociones/constants/offerWizard";
import { collageImages, promotionCollageLabel } from "@/features/promociones/helpers/promotionVisual";

import type { OfferWizardValues, PickerItem, PickerSubcatalog } from "@/features/promociones/interfaces/offerWizard";

function describeScope(values: OfferWizardValues, itemsById: Map<string, PickerItem>, subcatalogs: PickerSubcatalog[]): string {
  if (values.mechanic === "bundle_price") {
    return values.packItems
      .map((item) => `${item.quantity} × ${itemsById.get(item.product_id)?.name ?? "Producto"}`)
      .join(", ");
  }
  if (values.appliesToAll) return "Toda la tienda";
  if (values.productIds.length === 0 && values.subcatalogIds.length > 0) {
    return values.subcatalogIds.map((id) => subcatalogs.find((entry) => entry.id === id)?.name ?? "Categoría").join(", ");
  }
  if (values.productIds.length === 0) return "Sin productos (solo etiqueta)";
  return values.productIds.map((id) => itemsById.get(id)?.name ?? "Producto").join(", ");
}

function describeValidity(values: OfferWizardValues): string {
  if (values.validity === "none" || (!values.validFrom && !values.validUntil)) return "Sin fecha de fin";
  const format = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  if (values.validFrom && values.validUntil) return `Del ${format(values.validFrom)} al ${format(values.validUntil)}`;
  return values.validUntil ? `Hasta el ${format(values.validUntil)}` : `Desde el ${format(values.validFrom)}`;
}

export function ReviewStep({
  values,
  itemsById,
  subcatalogs,
  error,
  submitting,
  isEdit,
  onSaveDraft,
}: {
  values: OfferWizardValues;
  itemsById: Map<string, PickerItem>;
  subcatalogs: PickerSubcatalog[];
  error: string | null;
  submitting: boolean;
  isEdit: boolean;
  onSaveDraft: () => void;
}) {
  const mechanic = PROMOTION_MECHANICS.find((entry) => entry.value === values.mechanic);
  const label = formatOfferLabel({
    type: values.mechanic,
    value: Number(values.value) || 0,
    buy_quantity: values.buyQuantity,
    pay_quantity: values.payQuantity,
    badge_label: values.badgeLabel,
  });
  const rows = [
    { icon: Tag, term: "Tipo", detail: `${mechanic?.title ?? ""} · ${label}` },
    { icon: Layers, term: values.mechanic === "bundle_price" ? "Incluye" : "Aplica a", detail: describeScope(values, itemsById, subcatalogs) },
    { icon: CalendarRange, term: "Vigencia", detail: describeValidity(values) },
    ...(values.description.trim() ? [{ icon: FileText, term: "Descripción", detail: values.description.trim() }] : []),
  ];

  return (
    <div className="space-y-6">
      <WizardStepHeading
        titleId={OFFER_WIZARD_TITLE_ID}
        eyebrow="Revisar"
        title={isEdit ? "¿Guardamos los cambios?" : "Todo listo para publicar"}
        subtitle="Así la verán tus clientes en la tienda y en el carrito."
      />

      <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
        <div className="relative aspect-16/7 bg-accent/10">
          {values.imageUrl ? (
            <>
              <Image src={values.imageUrl} alt="" fill sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
              <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground shadow-sm">
                {label}
              </span>
            </>
          ) : (
            <PromotionCollage
              {...promotionCollageLabel({ type: values.mechanic, value: Number(values.value) || 0, buy_quantity: values.buyQuantity, pay_quantity: values.payQuantity, badge_label: values.badgeLabel })}
              images={collageImages(
                values.mechanic === "bundle_price" ? values.packItems.map((item) => item.product_id) : values.productIds,
                (id) => itemsById.get(id)?.image_url,
              )}
            />
          )}
        </div>
        <div className="p-5">
          <p className="text-xl font-bold text-foreground">{values.name || "Sin nombre"}</p>
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

      <PromotionPreviewStrip values={values} itemsById={itemsById} />

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
