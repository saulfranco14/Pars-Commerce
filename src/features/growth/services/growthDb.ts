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
  return internalError(message);
}
