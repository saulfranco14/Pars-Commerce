import { Clock, CreditCard, Zap, TrendingUp } from "lucide-react";

export const STATS = [
  {
    icon: Zap,
    value: "5 min",
    label: "para crear tu tienda",
    accent: "bg-amber-500/10 text-amber-500 dark:bg-amber-400/10 dark:text-amber-400",
  },
  {
    icon: CreditCard,
    value: "MercadoPago",
    label: "pagos integrados",
    accent: "bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400",
  },
  {
    icon: Clock,
    value: "24/7",
    label: "tu tienda siempre abierta",
    accent: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-400",
  },
  {
    icon: TrendingUp,
    value: "$0",
    label: "comision de plataforma",
    accent: "bg-rose-500/10 text-rose-500 dark:bg-rose-400/10 dark:text-rose-400",
  },
] as const;
