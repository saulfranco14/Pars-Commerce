/* eslint-disable @typescript-eslint/no-explicit-any -- growth tables are not in the generated Supabase types yet. */
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

export type GrowthDb = {
  from: (table: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => any;
};

export function growthDb(admin: unknown): GrowthDb {
  return admin as GrowthDb;
}

/** Master switch: without it no message leaves and the bot and cron answer 503. */
export function isGrowthEnabled(): boolean {
  return process.env.GROWTH_ENABLED === "true";
}

export function internalError(message: string): ServiceResult<never> {
  return { ok: false, error: { code: "internal", message } };
}

export function rpcError(message: string): ServiceResult<never> {
  if (message.includes("LEAD_NOT_FOUND")) return { ok: false, error: { code: "not_found", message: "El prospecto ya no existe." } };
  if (message.includes("UNKNOWN_")) return { ok: false, error: { code: "validation", message: "Acción no válida." } };
  if (message.includes("PHONE_TAKEN")) return { ok: false, error: { code: "validation", message: "Ese teléfono ya es de otro prospecto." } };
  if (message.includes("PHONE_SUPPRESSED")) return { ok: false, error: { code: "validation", message: "Ese teléfono pidió no recibir mensajes o estaba equivocado." } };
  if (message.includes("INVALID_PHONE")) return { ok: false, error: { code: "validation", message: "Escribe los 10 dígitos del teléfono." } };
  if (message.includes("INVALID_TRANSITION")) return { ok: false, error: { code: "validation", message: "Ese paso no aplica en la etapa en que está este negocio." } };
  if (message.includes("DATE_REQUIRED")) return { ok: false, error: { code: "validation", message: "Elige la fecha." } };
  if (message.includes("NOTE_REQUIRED")) return { ok: false, error: { code: "validation", message: "Escribe la nota." } };
  if (message.includes("ALREADY_REGISTERED")) return { ok: false, error: { code: "validation", message: "Este negocio ya se registró." } };
  if (message.includes("NOT_YOUR_LEAD")) return { ok: false, error: { code: "forbidden", message: "Este prospecto lo trabaja otra persona del equipo." } };
  if (message.includes("NOT_A_MEMBER")) return { ok: false, error: { code: "forbidden", message: "No eres parte del equipo de prospección." } };
  if (message.includes("EMAIL_SUPPRESSED")) return { ok: false, error: { code: "validation", message: "Ese correo pidió no recibir mensajes o rebotó." } };
  if (message.includes("INVALID_EMAIL")) return { ok: false, error: { code: "validation", message: "Escribe un correo válido." } };
  if (message.includes("CONTACT_REQUIRED")) return { ok: false, error: { code: "validation", message: "Escribe al menos el teléfono o el correo." } };
  if (message.includes("INVALID_NAME")) return { ok: false, error: { code: "validation", message: "Escribe el nombre del negocio." } };
  if (message.includes("GIRO_AND_MUNICIPIO_REQUIRED")) return { ok: false, error: { code: "validation", message: "Elige el giro y el municipio." } };
  return internalError(message);
}
