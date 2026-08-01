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
    value: "Tarjeta",
    label: "crédito, débito y meses",
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
    label: "comisión de plataforma",
    // Oro, no rosa: DESIGN_SYSTEM.md §3 reserva rojo/rosa a error y
    // destructivo, y este es justo el caso que el oro cubre (momento de valor:
    // el precio). El texto usa el paso --coin-ink porque el oro puro no pasa
    // contraste sobre blanco.
    accent: "bg-coin/10 text-coin-ink dark:bg-coin/10 dark:text-coin",
  },
] as const;
