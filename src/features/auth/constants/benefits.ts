import { Zap, Store, TrendingUp, Banknote, Repeat } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Beneficios del registro. Mismo mapeo ícono→color que
 * `loginHighlights.ts` para los conceptos que aparecen en ambas listas
 * (Banknote, Repeat): ese color compartido es lo que amarra login y
 * registro como un mismo sistema, no dos pantallas distintas.
 */
export const BENEFITS: { icon: LucideIcon; text: string; accent: string }[] = [
  {
    icon: Zap,
    text: "Crea tu tienda en 2 minutos",
    accent: "bg-amber-500/10 text-amber-500 dark:text-amber-400",
  },
  {
    icon: Store,
    text: "Tu propia URL para compartir",
    accent: "bg-blue-500/10 text-blue-500 dark:text-blue-400",
  },
  {
    icon: TrendingUp,
    text: "Dashboard de ventas incluido",
    accent: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400",
  },
  {
    // No es crédito nuestro: el negocio le fía a su cliente y aquí lleva el
    // control. "Ofrece créditos" hacía creer que el crédito venía de Tlaco.
    icon: Banknote,
    text: "Lleva el control de lo que te deben",
    accent: "bg-teal-500/10 text-teal-500 dark:text-teal-400",
  },
  {
    icon: Repeat,
    text: "Cobra en cuotas o recurrente",
    accent: "bg-violet-500/10 text-violet-500 dark:text-violet-400",
  },
];
