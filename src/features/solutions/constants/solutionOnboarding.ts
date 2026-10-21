import { ClipboardCheck, Link2, PackageCheck, WalletCards } from "lucide-react";

import type {
  CatalogModeOption,
  OnboardingGoal,
  ThemeChoice,
} from "@/features/solutions/interfaces/solutionExperience";

/** La misma paleta pinta la vista previa del recorrido y la del asistente. */
export const THEME_CHOICES: ThemeChoice[] = [
  { key: "tlaco", label: "Tlaco", color: "#3483fa" },
  { key: "ink", label: "Tinta", color: "#18243a" },
  { key: "terracotta", label: "Terracota", color: "#b45309" },
];

export const ONBOARDING_GOALS: OnboardingGoal[] = [
  { id: "sell", title: "Vender por enlace", text: "Comparte tienda y promociones por WhatsApp o QR.", icon: Link2 },
  { id: "orders", title: "Organizar pedidos", text: "Recibe, prepara y entrega desde una sola cola.", icon: ClipboardCheck },
  { id: "cash", title: "Cobrar con claridad", text: "Conecta pedido, pago, ticket y cierre.", icon: WalletCards },
  { id: "stock", title: "Controlar productos", text: "Conoce qué vendiste y qué queda disponible.", icon: PackageCheck },
];

export const CATALOG_MODES: CatalogModeOption[] = [
  { id: "starter", title: "Usar catálogo inicial", text: "Tlaco carga una base de tu giro; tú ocultas o corriges únicamente las diferencias.", recommended: true },
  { id: "own", title: "Agregar mis productos", text: "Empieza con una lista limpia y captura primero lo que más vendes." },
  { id: "assisted", title: "Quiero ayuda de Tlaco", text: "Comparte la información que ya tienes y te ayudamos a prepararla." },
];

export const ONBOARDING_STEP_COUNT = 3;

export const ONBOARDING_TITLE_ID = "solution-onboarding-title";

export const MAX_ONBOARDING_GOALS = 2;
