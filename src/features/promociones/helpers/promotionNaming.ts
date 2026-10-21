import { formatCurrency } from "@/features/qr/helpers/format";

import type { OfferWizardValues } from "@/features/promociones/interfaces/offerWizard";

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} + ${names[1]}`;
  return `${names[0]}, ${names[1]} y ${names.length - 2} más`;
}

/** A name the merchant can keep as is: "2x1 en Tacos al pastor", "Combo Lavado + Encerado". */
export function suggestPromotionName(values: OfferWizardValues, nameOf: (id: string) => string | undefined): string {
  const productNames = values.productIds.map(nameOf).filter((name): name is string => Boolean(name));
  const packNames = values.packItems.map((item) => nameOf(item.product_id)).filter((name): name is string => Boolean(name));
  const target = values.appliesToAll ? "toda la tienda" : joinNames(productNames) || "productos seleccionados";
  const amount = Number(values.value);

  switch (values.mechanic) {
    case "percentage":
      return amount > 0 ? `${amount}% en ${target}` : `Descuento en ${target}`;
    case "fixed_amount":
      return amount > 0 ? `${formatCurrency(amount)} menos en ${target}` : `Descuento en ${target}`;
    case "fixed_price":
      return amount > 0 ? `${target} a ${formatCurrency(amount)}` : `Precio especial en ${target}`;
    case "nxm":
      return `${values.buyQuantity}x${values.payQuantity} en ${productNames[0] ?? "tu producto"}`;
    case "bundle_price":
      return packNames.length > 0 ? `Combo ${joinNames(packNames)}` : "Combo especial";
    case "event_badge":
      return values.badgeLabel.trim() || "Temporada especial";
    default:
      return "Nueva promoción";
  }
}
