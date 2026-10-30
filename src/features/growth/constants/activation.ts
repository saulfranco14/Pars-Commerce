import type { ActivationStage } from "@/features/growth/interfaces/activation";

/** After registering: the business finishes its store, connects Mercado Pago, sells once, then sells often. */
export const ACTIVATION_STAGES: Array<{ stage: ActivationStage; label: string; hint: string }> = [
  { stage: "registrado", label: "Registrado", hint: "Tiene cuenta. Falta dejar lista su tienda." },
  { stage: "tienda_lista", label: "Tienda lista", hint: "Terminó la configuración. Falta conectar cobros." },
  { stage: "cobros", label: "Cobros conectados", hint: "Ya puede cobrar. Falta la primera venta." },
  { stage: "primera_venta", label: "Primera venta", hint: "Ya vendió. Ayúdale a compartir su enlace." },
  { stage: "activo", label: "Activo", hint: "5 pedidos o más en 30 días. Listo." },
];

/** Paid orders in 30 days that make a business count as active (same as growth_activation_stage). */
export const ACTIVE_ORDERS_30D = 5;
