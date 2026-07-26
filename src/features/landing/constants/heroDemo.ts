import {
  BarChart3,
  Banknote,
  Globe,
  QrCode,
  Repeat,
  Table2,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * El hero cuenta UNA historia en DOS dispositivos: lo que hace el cliente en su
 * celular y lo que el negocio ve en su panel en el mismo instante. Ese doble
 * lado es lo que la competencia (ej. los "sistemas de gestión" de Mercado Pago)
 * nunca muestra — enseñan una lista de funciones y un precio, así que nadie
 * sabe cómo se siente el producto antes de pagar.
 *
 * IMPORTANTE: los beats recorren MÓDULOS DISTINTOS de la plataforma (QR/mesas,
 * órdenes, suscripciones, préstamos, sitio web, mi dinero), no solo mesas. El
 * hero tiene que dejar claro de entrada que esto es una plataforma completa.
 *
 * Copy neutral/multinegocio (CLAUDE.md §6).
 */

/** Qué pantalla ve el cliente en su celular durante el beat. */
export type HeroPhoneView =
  | "scan"
  | "menu"
  | "tracker"
  | "subscription"
  | "loan"
  | "storefront"
  | "paid";

/** Qué vista del panel ve el negocio durante el beat. */
export type HeroPanelView =
  | "tables"
  | "orders"
  | "subscriptions"
  | "loans"
  | "site"
  | "money";

export interface HeroBeat {
  key: string;
  /** Nombre del módulo — el rail lo usa como etiqueta. */
  label: string;
  /** El beneficio en una línea, no el mecanismo. */
  caption: string;
  icon: LucideIcon;
  /** Lado del cliente. */
  phone: {
    view: HeroPhoneView;
    /** Qué está haciendo el cliente ahora mismo. */
    action: string;
    /** Dibuja el ripple del tap — el cliente hizo algo físicamente. */
    tap?: boolean;
  };
  /** Lado del negocio. */
  panel: {
    view: HeroPanelView;
    /** Título de la pantalla del panel (como en el Sidebar). */
    title: string;
    /** Aviso tipo toast — lo que acaba de pasar. */
    notice?: string;
    /**
     * El número que más importa de este módulo. En móvil no cabe el panel
     * completo, así que se muestra solo este dato + el aviso: alcanza para
     * contar que el negocio ve la acción del cliente, sin costar 300px de alto.
     */
    metric: { label: string; value: string };
  };
}

export const HERO_BEATS: HeroBeat[] = [
  {
    key: "qr",
    label: "Códigos QR",
    caption:
      "Tu cliente escanea el QR de tu negocio. Sin app, sin registro, sin terminal.",
    icon: QrCode,
    phone: { view: "scan", action: "Escaneando tu QR" },
    panel: {
      view: "tables",
      title: "Mesas",
      notice: "Mesa 4 · cliente conectado",
      metric: { label: "Mesas activas", value: "3" },
    },
  },
  {
    key: "mesas",
    label: "Mesas",
    caption:
      "Pide desde su celular y tú ves qué mesa pidió qué, sin que nadie anote nada.",
    icon: Table2,
    phone: { view: "menu", action: "Armando su pedido", tap: true },
    panel: {
      view: "tables",
      title: "Mesas",
      notice: "Nuevo pedido · Mesa 4 · $284.00",
      metric: { label: "Por cobrar", value: "$284" },
    },
  },
  {
    key: "ordenes",
    label: "Órdenes",
    caption:
      "Cada pedido queda registrado y tu cliente sigue su avance hasta que está listo.",
    icon: BarChart3,
    phone: { view: "tracker", action: "Viendo su avance" },
    panel: {
      view: "orders",
      title: "Órdenes / Tickets",
      notice: "Mesa 4 · marcado como listo",
      metric: { label: "Órdenes hoy", value: "85" },
    },
  },
  {
    key: "suscripciones",
    label: "Suscripciones",
    caption:
      "Cobra en cuotas o de forma recurrente. La tarjeta se autoriza una vez y el cargo se hace solo.",
    icon: Repeat,
    phone: { view: "subscription", action: "Eligiendo pagar en cuotas", tap: true },
    panel: {
      view: "subscriptions",
      title: "Suscripciones",
      notice: "Nueva suscripción · 3 cuotas",
      metric: { label: "Suscripciones activas", value: "18" },
    },
  },
  {
    key: "prestamos",
    label: "Préstamos",
    caption:
      "Dale crédito a tus clientes de confianza y el cobro se hace automático.",
    icon: Banknote,
    phone: { view: "loan", action: "Pagando su abono" },
    panel: {
      view: "loans",
      title: "Préstamos",
      notice: "Abono recibido · $500.00",
      metric: { label: "Por cobrar", value: "$21,500" },
    },
  },
  {
    key: "sitio",
    label: "Sitio web",
    caption:
      "Tu tienda en línea se genera sola. Tu cliente también te compra desde su casa.",
    icon: Globe,
    phone: { view: "storefront", action: "Comprando en tu sitio", tap: true },
    panel: {
      view: "site",
      title: "Sitio web",
      notice: "Pedido en línea · $640.00",
      metric: { label: "Pedidos web hoy", value: "9" },
    },
  },
  {
    key: "dinero",
    label: "Mi dinero",
    caption:
      "Todo lo que cobraste, en un solo lugar: cuánto entró y cuándo cae en tu cuenta.",
    icon: Wallet,
    phone: { view: "paid", action: "Pago confirmado" },
    panel: {
      view: "money",
      title: "Mi dinero",
      notice: "Depósito programado · mañana",
      metric: { label: "Por recibir", value: "$8,240" },
    },
  },
];

/** Milisegundos que dura cada beat antes de avanzar solo. */
export const HERO_BEAT_MS = 3600;
