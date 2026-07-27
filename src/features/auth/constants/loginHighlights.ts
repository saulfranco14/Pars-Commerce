import {
  ShoppingBag,
  BarChart3,
  CreditCard,
  Shield,
  Banknote,
  Repeat,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const HIGHLIGHTS: {
  icon: LucideIcon;
  text: string;
  accent: string;
}[] = [
  {
    icon: ShoppingBag,
    text: "Gestiona productos y órdenes",
    accent: "bg-blue-500/10 text-blue-500 dark:text-blue-400",
  },
  {
    icon: BarChart3,
    text: "Dashboard de ventas en tiempo real",
    accent: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400",
  },
  {
    icon: CreditCard,
    text: "Cobra con tarjeta, sin terminal",
    accent: "bg-amber-500/10 text-amber-500 dark:text-amber-400",
  },
  {
    // No prestamos dinero: el negocio le fía a su cliente y aquí lleva el
    // control. Decir "crédito" hacía creer que el crédito venía de nosotros.
    icon: Banknote,
    text: "Lleva el control de lo que te deben",
    accent: "bg-teal-500/10 text-teal-500 dark:text-teal-400",
  },
  {
    icon: Repeat,
    text: "Suscripciones y cobros recurrentes",
    accent: "bg-violet-500/10 text-violet-500 dark:text-violet-400",
  },
  {
    icon: Shield,
    text: "Seguro y confiable, 24/7",
    accent: "bg-rose-500/10 text-rose-500 dark:text-rose-400",
  },
];
