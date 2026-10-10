import { Heart, Shield, Lock, Gift } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  SitePageCard,
  SitePagePurchaseStep,
} from "@/types/tenantSitePages";

export const ICON_MAP: Record<string, LucideIcon> = {
  heart: Heart,
  shield: Shield,
  lock: Lock,
  gift: Gift,
};

export const DEFAULT_CARDS: SitePageCard[] = [
  {
    icon: "heart",
    title: "Atención directa",
    description:
      "Consulta dudas con el negocio y recibe seguimiento de tu pedido en el mismo lugar.",
  },
  {
    icon: "shield",
    title: "Compra con claridad",
    description:
      "Ve productos, precios, promociones y disponibilidad antes de confirmar tu compra.",
  },
  {
    icon: "lock",
    title: "Pago confirmado",
    description:
      "Elige el método disponible y conserva el estado de pago dentro de tu pedido.",
  },
  {
    icon: "gift",
    title: "Entrega a tu manera",
    description:
      "Solicita entrega, recolección o atención en sitio según las opciones de este negocio.",
  },
];

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
