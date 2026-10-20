import { CreditCard, Smartphone, Wallet, Zap } from "lucide-react";

/** Cada valor es una promesa verificable que el resto del landing sostiene (precios, FAQs). */
export const STATS = [
  {
    icon: Zap,
    value: "2 minutos",
    label: "para tener tu tienda lista",
    accent: "bg-amber-500/10 text-amber-500 dark:bg-amber-400/10 dark:text-amber-400",
  },
  {
    icon: Wallet,
    value: "$0 al mes",
    label: "para empezar, sin tarjeta",
    // Oro: DESIGN_SYSTEM.md §3 lo reserva al momento de valor (el precio). El
    // texto usa --coin-ink porque el oro puro no pasa contraste sobre blanco.
    accent: "bg-coin/10 text-coin-ink dark:bg-coin/10 dark:text-coin",
  },
  {
    icon: Smartphone,
    value: "Sin terminal",
    label: "tu cliente paga con su celular",
    accent: "bg-blue-500/10 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400",
  },
  {
    icon: CreditCard,
    value: "Meses sin intereses",
    label: "con tarjeta de crédito",
    accent: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-400",
  },
] as const;
