/**
 * Pure helper: human-readable label for a promotion's value, by type. Mirrors
 * the storefront's formatPromoValue so the QR banner reads consistently. No
 * React. Neutral/multi-business copy.
 */

interface PromoValueShape {
  type: string;
  value: number;
  quantity?: number | null;
  badge_label?: string | null;
}

export function formatPromoLabel(p: PromoValueShape): string {
  const val = Number(p.value);
  switch (p.type) {
    case "percentage":
      return `${val}% de descuento`;
    case "fixed_amount":
      return `$${val.toFixed(2)} de descuento`;
    case "bundle_price":
      return p.quantity ? `${p.quantity} por $${val.toFixed(2)}` : `$${val.toFixed(2)}`;
    case "fixed_price":
      return `Precio especial $${val.toFixed(2)}`;
    case "event_badge":
      return p.badge_label || "Promoción";
    default:
      return `$${val.toFixed(2)}`;
  }
}
