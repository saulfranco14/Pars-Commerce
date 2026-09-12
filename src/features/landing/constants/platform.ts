import {
  BarChart3,
  Banknote,
  ClipboardList,
  Landmark,
  Package,
  QrCode,
  Repeat,
  Scissors,
  Table2,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PlatformGroupKey = "vender" | "cobrar" | "crecer";

export interface PlatformCapability {
  key: string;
  group: PlatformGroupKey;
  icon: LucideIcon;
  title: string;
  owner: string;
  customer: string | null;
}

export interface PlatformGroup {
  key: PlatformGroupKey;
  label: string;
  headline: string;
  description: string;
}

export const PLATFORM_GROUPS: PlatformGroup[] = [
  {
    key: "vender",
    label: "Vender",
    headline: "Todo lo que ofreces, en un catálogo",
    description:
      "Productos, servicios, pedidos y tu propio sitio web. Tu cliente encuentra lo que buscas vender, sin que tú expliques nada.",
  },
  {
    key: "cobrar",
    label: "Cobrar",
    headline: "Cobra como tu cliente quiera pagar",
    description:
      "QR en el negocio, tienda en línea, cuotas, suscripciones o crédito. Y ves tu dinero claro, sin adivinar cuándo te llega.",
  },
  {
    key: "crecer",
    label: "Crecer",
    headline: "Entiende tu negocio y súmale gente",
    description:
      "Métricas, clientes, equipo con permisos y las funciones nuevas que vamos soltando. Creces sin perder el control.",
  },
];

export const PLATFORM_CAPABILITIES: PlatformCapability[] = [
  // ── Vender ────────────────────────────────────────────────────
  {
    key: "productos",
    group: "vender",
    icon: Package,
    title: "Productos",
    owner:
      "Sube tu inventario con fotos, precios, categorías y variantes. Todo en un solo lugar.",
    customer:
      "Ve fotos reales y precios claros antes de pedir — nada de preguntar “¿cuánto cuesta?”.",
  },
  {
    key: "servicios",
    group: "vender",
    icon: Scissors,
    title: "Servicios",
    owner:
      "Vende servicios igual que productos: lavados, cortes, reparaciones, rentas o consultoría.",
    customer:
      "Elige el servicio que necesita y sabe exactamente qué incluye y cuánto cuesta.",
  },
  {
    key: "ordenes",
    group: "vender",
    icon: ClipboardList,
    title: "Órdenes y tickets",
    owner:
      "Cada pedido queda registrado con hora, productos, total y quién lo atendió. Historial completo.",
    customer:
      "Recibe su ticket y puede seguir su pedido de recibido a en proceso y listo.",
  },

  // ── Cobrar ────────────────────────────────────────────────────
  {
    key: "qr",
    group: "cobrar",
    icon: QrCode,
    title: "Códigos QR",
    owner:
      "Genera QR para cobrar en el mostrador, en la mesa o a domicilio. Los imprimes y listo.",
    customer:
      "Escanea con su cámara y paga en segundos. Sin app, sin registro, sin terminal.",
  },
  {
    key: "mesas",
    group: "cobrar",
    icon: Table2,
    title: "Mesas y pedidos en sitio",
    owner:
      "Controla qué mesa está ocupada, qué pidió y cuánto debe. Tu equipo avanza el estado del pedido.",
    customer:
      "Pide desde su celular, ve el avance y divide la cuenta con quien lo acompaña.",
  },
  {
    key: "suscripciones",
    group: "cobrar",
    icon: Repeat,
    title: "Suscripciones y cuotas",
    owner:
      "Cobra en pagos fijos o recurrentes. La tarjeta se autoriza una vez y el cargo se hace solo.",
    customer:
      "Paga en cuotas o se suscribe sin volver a meter su tarjeta cada vez.",
  },
  {
    key: "prestamos",
    group: "cobrar",
    icon: Banknote,
    title: "Préstamos y crédito",
    owner:
      "Si le fías a un cliente de confianza, aquí llevas el control: defines monto, plazo e interés, y el cobro es automático.",
    customer:
      "Se lleva lo que necesita hoy y paga en abonos, sin ir a una financiera.",
  },
  {
    key: "liquidaciones",
    group: "cobrar",
    icon: Wallet,
    title: "Mi dinero",
    owner:
      "Ve cuánto te entró, cuánto está por recibir y cuándo cae en tu cuenta. Sin sorpresas.",
    customer: null,
  },
  {
    key: "cuentas-bancarias",
    group: "cobrar",
    icon: Landmark,
    title: "Cuentas bancarias",
    owner:
      "Registra a qué cuenta quieres que te depositemos. Tú decides dónde aterriza tu dinero.",
    customer: null,
  },

  // ── Crecer ────────────────────────────────────────────────────
  {
    key: "ventas",
    group: "crecer",
    icon: BarChart3,
    title: "Ventas y comisiones",
    owner:
      "Qué se vende más, qué día vendes mejor y cuánto pagaste de comisión. Números simples, sin contador.",
    customer: null,
  },
  {
    key: "clientes",
    group: "crecer",
    icon: Users,
    title: "Clientes",
    owner:
      "Tu lista de clientes con su historial de compras y pagos. Sabes a quién venderle otra vez.",
    customer:
      "Lo reconoces cuando vuelve — no tiene que repetir sus datos cada visita.",
  },
  {
    key: "equipo",
    group: "crecer",
    icon: UsersRound,
    title: "Equipo y permisos",
    owner:
      "Invita a tu personal con permisos por rol: quién cobra, quién atiende y quién ve el dinero.",
    customer:
      "Lo atiende cualquiera de tu equipo y su pedido no se pierde en el cambio de turno.",
  },
];
