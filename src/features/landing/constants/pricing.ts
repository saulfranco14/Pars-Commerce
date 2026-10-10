import type { BillingPlan, BillingPlanCode } from "@/features/billing/entitlements";

export interface PlanPresentation {
  code: BillingPlanCode;
  eyebrow: string;
  promise: string;
  fit: string;
}

export const PLAN_PRESENTATION: Record<BillingPlanCode, PlanPresentation> = {
  free: {
    code: "free",
    eyebrow: "Para comprobarlo",
    promise: "Pon tu negocio en línea y comprueba que Tlaco te funciona.",
    fit: "Te conviene cuando vas a publicar tu primer negocio.",
  },
  operation: {
    code: "operation",
    eyebrow: "Para el día a día",
    promise: "Atiende más sin sumar caos.",
    fit: "Te conviene cuando hay más volumen, mesas o un kiosco.",
  },
  growth: {
    code: "growth",
    eyebrow: "Para decidir mejor",
    promise: "Decide con datos y coordina varias operaciones.",
    fit: "Te conviene cuando necesitas reportes o varias sucursales.",
  },
  scale: {
    code: "scale",
    eyebrow: "Para una red",
    promise: "Controla una red sin perder visibilidad.",
    fit: "Te conviene cuando operas una red de negocios.",
  },
};

export function planCapabilities(plan: BillingPlan): string[] {
  const limits = plan.entitlements;
  if (plan.code === "free") return [
    "Catálogo, sitio, pedidos y equipo",
    `Hasta ${limits.active_table_limit} mesas activas`,
    `${limits.business_limit} negocio con sus datos siempre conservados`,
  ];
  if (plan.code === "operation") return [
    `Hasta ${limits.business_limit} negocios y ${limits.active_table_limit} mesas`,
    `${limits.active_kiosk_limit} kiosco para tomar pedidos`,
    "Recomendaciones antes de prestar",
  ];
  if (plan.code === "growth") return [
    `Hasta ${limits.business_limit} negocios y ${limits.active_table_limit} mesas`,
    `${limits.active_kiosk_limit} kioscos, reportes y exportaciones`,
    "Resumen semanal de operación",
  ];
  return [
    `Hasta ${limits.business_limit} negocios y ${limits.active_table_limit} mesas`,
    `${limits.active_kiosk_limit} kioscos y reglas de crédito`,
    "Reportes diarios o semanales",
  ];
}
