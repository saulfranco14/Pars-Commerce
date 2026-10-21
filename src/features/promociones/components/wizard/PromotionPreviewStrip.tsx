"use client";

import { formatCurrency } from "@/features/qr/helpers/format";
import { previewPromotion } from "@/features/promociones/helpers/promotionPreview";

import type { OfferWizardValues, PickerItem } from "@/features/promociones/interfaces/offerWizard";

/** "Pagan $X en lugar de $Y" for the first chosen item, pack or NxM group. */
export function PromotionPreviewStrip({
  values,
  itemsById,
}: {
  values: OfferWizardValues;
  itemsById: Map<string, PickerItem>;
}) {
  const sourceIds = values.mechanic === "bundle_price" ? values.packItems : values.productIds.map((id) => ({ product_id: id, quantity: 1 }));
  const items = sourceIds.flatMap((entry) => {
    const item = itemsById.get(entry.product_id);
    return item ? [{ id: item.id, name: item.name, price: item.price, quantity: entry.quantity }] : [];
  });
  const preview = previewPromotion({
    mechanic: values.mechanic,
    value: Number(values.value) || 0,
    buyQuantity: values.buyQuantity,
    payQuantity: values.payQuantity,
    items,
  });
  if (!preview || preview.listTotal <= 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-accent/8 p-4" aria-live="polite">
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{preview.caption}</p>
        <p className="mt-0.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums text-foreground">{formatCurrency(preview.finalTotal)}</span>
          {preview.savings > 0 ? (
            <span className="text-sm tabular-nums text-muted-foreground line-through">{formatCurrency(preview.listTotal)}</span>
          ) : null}
        </p>
      </div>
      {preview.savings > 0 ? (
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
          Ahorran {formatCurrency(preview.savings)} ({preview.savingsPercent}%)
        </span>
      ) : (
        <span className="text-sm font-medium text-amber-700">Este precio no es menor al normal.</span>
      )}
    </div>
  );
}
