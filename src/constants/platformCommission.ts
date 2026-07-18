/**
 * Comisión de PLATAFORMA por liquidación (S2 del settlement).
 *
 * Distinta de las comisiones de Mercado Pago (`commissionConfig.ts`): aquélla
 * es lo que MP cobra por procesar; ésta es lo que la plataforma cobra por
 * custodiar y liquidar el dinero de MP al negocio.
 *
 * Modelo (decidido con negocio): comisión ESCALONADA POR FRECUENCIA. Mientras
 * menos frecuente el ciclo de liquidación, menor la comisión — porque la
 * plataforma retiene el dinero más tiempo (float). Se cobra sobre el NETO de MP
 * (lo que queda tras el fee de MP), que es lo que efectivamente se liquida.
 *
 * Los porcentajes son configurables; viven aquí versionados. Un negocio puede
 * además tener un override por contrato (ver S4) — esta función acepta un
 * `overridePercent` para ese caso.
 */

export const SETTLEMENT_CYCLES = [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "custom",
] as const;
export type SettlementCycle = (typeof SETTLEMENT_CYCLES)[number];

/**
 * Comisión de plataforma por ciclo. Menos frecuente → menor %.
 * `custom` no tiene default: un ciclo personalizado se negocia por contrato y
 * DEBE pasar un `overridePercent` explícito (si no, se trata como error).
 */
export const PLATFORM_COMMISSION_BY_CYCLE: Record<
  Exclude<SettlementCycle, "custom">,
  number
> = {
  daily: 0.035, // 3.5%
  weekly: 0.03, // 3.0%
  biweekly: 0.025, // 2.5%
  monthly: 0.02, // 2.0%
};

export interface PlatformCommissionResult {
  /** Neto de MP sobre el que se calcula (entrada). */
  netMp: number;
  /** % aplicado (del ciclo o el override). */
  commissionPercent: number;
  /** Comisión que cobra la plataforma. */
  commissionAmount: number;
  /** Lo que se transfiere al negocio (neto − comisión). */
  amountToTransfer: number;
}

/**
 * Calcula la comisión de plataforma sobre el neto de MP a liquidar.
 *
 * @param netMpAmount    Neto de MP del periodo (ya descontado el fee de MP).
 * @param cycle          Ciclo de liquidación del negocio.
 * @param overridePercent  Comisión negociada por contrato (0–1). Obligatoria
 *                         si cycle === "custom"; opcional (gana si se pasa) en
 *                         los demás.
 */
export function calcPlatformCommission(
  netMpAmount: number,
  cycle: SettlementCycle,
  overridePercent?: number,
): PlatformCommissionResult {
  if (netMpAmount < 0) {
    throw new Error("netMpAmount no puede ser negativo");
  }

  let percent: number;
  if (overridePercent != null) {
    if (overridePercent < 0 || overridePercent > 1) {
      throw new Error("overridePercent debe estar entre 0 y 1");
    }
    percent = overridePercent;
  } else if (cycle === "custom") {
    throw new Error(
      "El ciclo 'custom' requiere un overridePercent (comisión por contrato)",
    );
  } else {
    percent = PLATFORM_COMMISSION_BY_CYCLE[cycle];
  }

  const commissionAmount = Math.round(netMpAmount * percent * 100) / 100;
  const amountToTransfer = Math.round((netMpAmount - commissionAmount) * 100) / 100;

  return {
    netMp: netMpAmount,
    commissionPercent: percent,
    commissionAmount,
    amountToTransfer,
  };
}
