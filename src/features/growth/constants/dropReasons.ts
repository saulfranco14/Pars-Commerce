import type { DropReason } from "@/features/growth/interfaces/cleanup";

/** Why a prospect leaves the list; every reason is a drop on all channels for the whole team. */
export const DROP_REASONS: Array<{ value: DropReason; label: string; hint: string }> = [
  { value: "rechazo", label: "No le interesa", hint: "Lo dijo por mensaje, llamada o en persona." },
  { value: "cerrado", label: "El negocio cerró o ya no está activo", hint: "Por ejemplo: «Ya no está activo el negocio»." },
  { value: "no_abrio", label: "Nunca abrió su tienda", hint: "Le escribiste y no abrió el enlace ni contestó." },
  { value: "otro", label: "Otro motivo", hint: "Número de otra persona, pidió que no le escriban, etc." },
];

/** Choices for «No abrieron su tienda»: how long since the last message. */
export const COLD_DAY_OPTIONS = [
  { days: 3, label: "3 días o más" },
  { days: 7, label: "7 días o más" },
  { days: 14, label: "14 días o más" },
];
