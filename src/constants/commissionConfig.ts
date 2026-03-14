// ── Comisiones MP: Link de pago único ────────────────────────────────────────
export const MP_FEE_PERCENT = 0.0405;
export const MP_FEE_FIXED_MXN = 4.64;

// ── Comisiones MP: Suscripción (cobro automático) ───────────────────────────
// Fuente: mercadopago.com.mx/costs — Tarjeta crédito/débito, disponible al instante
export const MP_SUB_FEE_PERCENT = 0.0349;
export const MP_SUB_FEE_FIXED_MXN = 4.0;

// ── Tarifa de servicio Pars ─────────────────────────────────────────────────
export const PARS_SERVICE_FEE_PERCENT = 0;
export const TARIFA_DE_SERVICIO_LABEL = "Tarifa de servicio";
export const RECEIPT_LINK_LABEL = "Link de pago – enviar al cliente";

/**
 * Calcula el total que paga el comprador (link de pago único).
 * Usado cuando mp_fee_absorbed_by = "customer" (el cliente paga la comisión).
 */
export function calcBuyerTotal(vendorTotal: number): {
  total: number;
  mpFee: number;
  parsFee: number;
} {
  const parsFee =
    Math.round(vendorTotal * PARS_SERVICE_FEE_PERCENT * 100) / 100;
  const total =
    Math.ceil(
      ((vendorTotal + MP_FEE_FIXED_MXN + parsFee) / (1 - MP_FEE_PERCENT)) * 100,
    ) / 100;
  const mpFee = Math.round((total - vendorTotal - parsFee) * 100) / 100;
  return { total, mpFee, parsFee };
}

/**
 * Calcula el desglose de comisiones para un cobro de suscripción.
 *
 * @param desiredAmount - Monto que el negocio quiere recibir por cada cobro
 * @param absorbedBy    - Quién absorbe la comisión: "customer" o "business"
 *
 * Si absorbedBy = "business":
 *   Se cobra desiredAmount al cliente, negocio recibe desiredAmount - comisiones
 *
 * Si absorbedBy = "customer":
 *   Se calcula un monto mayor para que después de comisiones el negocio reciba desiredAmount
 */
export function calcSubscriptionFees(
  desiredAmount: number,
  absorbedBy: "customer" | "business" = "business",
): {
  chargeAmount: number; // Lo que se cobra al cliente
  mpFee: number;
  parsFee: number;
  netReceived: number; // Lo que recibe el negocio
} {
  if (absorbedBy === "business") {
    // El negocio absorbe: se cobra desiredAmount, negocio recibe menos
    const mpFee =
      Math.round((desiredAmount * MP_SUB_FEE_PERCENT + MP_SUB_FEE_FIXED_MXN) * 100) / 100;
    const parsFee =
      Math.round(desiredAmount * PARS_SERVICE_FEE_PERCENT * 100) / 100;
    const netReceived =
      Math.round((desiredAmount - mpFee - parsFee) * 100) / 100;
    return { chargeAmount: desiredAmount, mpFee, parsFee, netReceived };
  }

  // El cliente paga: calculamos el monto mayor para que el negocio reciba desiredAmount
  const totalFeePercent = MP_SUB_FEE_PERCENT + PARS_SERVICE_FEE_PERCENT;
  const chargeAmount =
    Math.ceil(
      ((desiredAmount + MP_SUB_FEE_FIXED_MXN) / (1 - totalFeePercent)) * 100,
    ) / 100;
  const mpFee =
    Math.round((chargeAmount * MP_SUB_FEE_PERCENT + MP_SUB_FEE_FIXED_MXN) * 100) / 100;
  const parsFee =
    Math.round(chargeAmount * PARS_SERVICE_FEE_PERCENT * 100) / 100;
  const netReceived =
    Math.round((chargeAmount - mpFee - parsFee) * 100) / 100;
  return { chargeAmount, mpFee, parsFee, netReceived };
}
