import {
  Package,
  ShoppingCart,
  Globe,
  CreditCard,
  Sparkles,
  Users,
  Wrench,
  BarChart3,
} from "lucide-react";

export const PRIMARY_FEATURES = [
  {
    icon: Package,
    title: "Catalogo de productos",
    description:
      "Agrega y organiza tu inventario con fotos, precios, descripciones y subcategorias. Todo centralizado para que gestiones tu oferta facilmente.",
    accent:
      "bg-rose-500/10 text-rose-500 dark:bg-rose-400/10 dark:text-rose-400",
  },
  {
    icon: Globe,
    title: "Sitio web automatico",
    description:
      "Tu tienda publica se genera al instante. Cada negocio tiene su URL personalizada con colores y logo propios.",
    accent:
      "bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400",
  },
  {
    icon: ShoppingCart,
    title: "Ordenes y pedidos",
    description:
      "Recibe y gestiona pedidos en un solo lugar. Estado, historial, asignacion a equipo y seguimiento completo.",
    accent:
      "bg-amber-500/10 text-amber-500 dark:bg-amber-400/10 dark:text-amber-400",
  },
  {
    icon: CreditCard,
    title: "Checkout y pagos",
    description:
      "Carrito, checkout seguro y pagos con MercadoPago. Tus clientes compran con total confianza y seguridad.",
    accent:
      "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-400",
  },
] as const;

export const SECONDARY_FEATURES = [
  {
    icon: BarChart3,
    title: "Ventas y reportes",
    description: "Metricas simples para entender como va tu negocio.",
    accent:
      "bg-violet-500/10 text-violet-500 dark:bg-violet-400/10 dark:text-violet-400",
  },
  {
    icon: Sparkles,
    title: "Promociones",
    description: "Crea ofertas y descuentos en fechas importantes.",
    accent:
      "bg-pink-500/10 text-pink-500 dark:bg-pink-400/10 dark:text-pink-400",
  },
  {
    icon: Users,
    title: "Equipo",
    description: "Invita colaboradores y asigna permisos de trabajo.",
    accent:
      "bg-cyan-500/10 text-cyan-500 dark:bg-cyan-400/10 dark:text-cyan-400",
  },
  {
    icon: Wrench,
    title: "Servicios",
    description: "Ofrece servicios ademas de productos fisicos.",
    accent:
      "bg-orange-500/10 text-orange-500 dark:bg-orange-400/10 dark:text-orange-400",
  },
] as const;
