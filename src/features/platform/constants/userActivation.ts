import type { StatusTone } from "@/components/admin/StatusBadge";
import type { UserActivation, UserFilters } from "@/features/platform/types";

export const USER_ACTIVATION_META: Record<UserActivation, { label: string; tone: StatusTone }> = {
  sin_negocio: { label: "Sin negocio", tone: "warning" },
  registrado: { label: "Registrado", tone: "neutral" },
  tienda_lista: { label: "Tienda lista", tone: "info" },
  cobros: { label: "Cobros conectados", tone: "info" },
  primera_venta: { label: "Primera venta", tone: "success" },
  activo: { label: "Activo", tone: "success" },
};

export const ORIGIN_LABEL: Record<"engine" | "assisted" | "self", string> = {
  engine: "Motor",
  assisted: "Equipo",
  self: "Por su cuenta",
};

/** One-tap views for the questions asked most. */
export const USER_QUICK_VIEWS: Array<{ id: string; label: string; filters: UserFilters; stat?: "without_mp" | "without_business" | "from_engine" }> = [
  { id: "sin_mp", label: "Registrados sin Mercado Pago", filters: { activation: "sin_mp" }, stat: "without_mp" },
  { id: "sin_negocio", label: "Sin negocio", filters: { activation: "sin_negocio" }, stat: "without_business" },
  { id: "inactivos", label: "No entran hace 14 días", filters: { idle_days: 14 } },
  { id: "motor", label: "Vinieron del motor", filters: { origin: "engine" }, stat: "from_engine" },
];

/** What to tell an owner so their business moves to the next stage. */
export const ACTIVATION_NUDGE: Partial<Record<UserActivation, string>> = {
  registrado: "¿Le ayudo a terminar de configurar su tienda en Tlaco? Son unos minutos.",
  tienda_lista: "Su tienda ya está lista. Sólo falta conectar Mercado Pago para que le paguen directo; ¿lo hacemos juntos?",
  cobros: "Su tienda ya puede cobrar. ¿Le ayudo a compartir su enlace con sus clientes?",
};
