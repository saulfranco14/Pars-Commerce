import type { SitePagePurchaseStep } from "@/types/tenantSitePages";

/** Manual billing as the customer lives it; no cron or email promised. */
export const PLAN_HOW_IT_WORKS: SitePagePurchaseStep[] = [
  { title: "Hoy pagas el primer periodo", description: "Junto con lo demás de tu carrito, en un solo pago." },
  { title: "Antes de cada periodo, tu pedido", description: "Unos días antes aparece tu pedido para pagarlo por transferencia o en el negocio." },
  { title: "Cancela cuando quieras", description: "Desde el enlace de tu suscripción; lo ya pagado se respeta." },
];
