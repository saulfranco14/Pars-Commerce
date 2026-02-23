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
    title: "Bienestar",
    description:
      "Creemos en el bienestar como pilar de una vida plena. Ofrecemos productos de calidad para redescubrir y disfrutar.",
  },
  {
    icon: "shield",
    title: "Calidad garantizada",
    description:
      "Productos certificados, seguros y fabricados con materiales premium. Tu satisfacción es nuestra prioridad.",
  },
  {
    icon: "lock",
    title: "Discreción total",
    description:
      "Respetamos tu privacidad. Empaque sin marca identificable y entrega confidencial para comprar con tranquilidad.",
  },
  {
    icon: "gift",
    title: "Entrega personalizada",
    description:
      "Adaptamos nuestro servicio a tu comodidad y preferencias. Elige la opción que mejor te funcione.",
  },
];

export const DEFAULT_PURCHASE_STEPS: SitePagePurchaseStep[] = [
  {
    title: "Selecciona tu producto",
    description:
      "Explora nuestro catálogo y elige el producto perfecto para ti.",
  },
  {
    title: "Realiza tu pedido",
    description: "Contáctanos por WhatsApp con tu selección.",
  },
  {
    title: "Recibe y disfruta",
    description:
      "Tu paquete lo podrás en nuestro negocio o lo llevaremos a tu domicilio.",
  },
];
