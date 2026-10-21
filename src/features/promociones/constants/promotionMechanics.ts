import { BadgePercent, CircleDollarSign, Gift, Layers, Sparkles, Tag } from "lucide-react";

import type { PromotionMechanicOption } from "@/features/promociones/interfaces/offerTemplate";

export const PROMOTION_MECHANICS: readonly PromotionMechanicOption[] = [
  {
    value: "percentage",
    title: "Descuento en %",
    description: "Baja el precio un porcentaje.",
    example: "15% en bebidas",
    icon: BadgePercent,
  },
  {
    value: "nxm",
    title: "2x1, 3x2…",
    description: "Lleva más piezas y paga menos.",
    example: "2x1 en tacos al pastor",
    icon: Gift,
  },
  {
    value: "bundle_price",
    title: "Paquete a precio",
    description: "Junta varios productos o servicios en un solo precio.",
    example: "Lavado + encerado por $199",
    icon: Layers,
  },
  {
    value: "fixed_price",
    title: "Precio especial",
    description: "Un precio fijo por tiempo limitado.",
    example: "Café del día a $25",
    icon: Tag,
  },
  {
    value: "fixed_amount",
    title: "Descuento en pesos",
    description: "Resta una cantidad al precio.",
    example: "$20 menos en cada playera",
    icon: CircleDollarSign,
  },
  {
    value: "event_badge",
    title: "Temporada o evento",
    description: "Destaca productos con una etiqueta, sin cambiar precio.",
    example: "Buen Fin, Día de las madres",
    icon: Sparkles,
  },
];

export const PERCENTAGE_PRESETS = [10, 15, 20, 30] as const;

export const NXM_PRESETS = [
  { buy: 2, pay: 1 },
  { buy: 3, pay: 2 },
  { buy: 4, pay: 3 },
] as const;

/** Mechanics that sell a fixed group of items together. */
export const GROUP_MECHANICS = new Set(["bundle_price", "nxm"]);
