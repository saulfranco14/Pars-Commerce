/**
 * One human label for a promotion's mechanic, shared by the dashboard, the
 * storefront and the QR banner. Neutral, multi-business copy.
 */

export interface OfferLabelShape {
  type: string;
  value: number | string;
  quantity?: number | null;
  badge_label?: string | null;
  buy_quantity?: number | null;
  pay_quantity?: number | null;
}

function money(value: number): string {
  return `$${value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatOfferLabel(offer: OfferLabelShape): string {
  const value = Number(offer.value);
  switch (offer.type) {
    case "percentage":
      return `${value}% de descuento`;
    case "fixed_amount":
      return `${money(value)} de descuento`;
    case "fixed_price":
      return `Precio especial ${money(value)}`;
    case "bundle_price":
      return offer.quantity ? `${offer.quantity} por ${money(value)}` : `Paquete en ${money(value)}`;
    case "nxm":
      return offer.buy_quantity && offer.pay_quantity
        ? `${offer.buy_quantity}x${offer.pay_quantity}`
        : "Lleva más, paga menos";
    case "event_badge":
      return offer.badge_label || "Promoción";
    default:
      return money(value);
  }
}

export function formatOfferDeadline(validUntil: string | null | undefined): string | null {
  if (!validUntil) return null;
  return new Date(validUntil).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}
