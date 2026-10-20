import { Gift, Heart, Lock, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type {
  SitePageCard,
  SitePagePurchaseStep,
} from "@/types/tenantSitePages";

export const CARD_ICONS: Record<NonNullable<SitePageCard["icon"]>, LucideIcon> = {
  heart: Heart,
  shield: Shield,
  lock: Lock,
  gift: Gift,
};

export const DEFAULT_PURCHASE_STEPS: SitePagePurchaseStep[] = [
  {
    title: "Explora y agrega",
    description:
      "Revisa el catálogo, promociones y precios; agrega lo que necesitas al carrito.",
  },
  {
    title: "Elige cómo recibirlo",
    description: "Selecciona entrega, recolección o una fecha disponible y confirma tu pedido.",
  },
  {
    title: "Sigue la confirmación",
    description:
      "El negocio recibe tu orden, confirma el pago y te avisa cuando esté lista.",
  },
];
