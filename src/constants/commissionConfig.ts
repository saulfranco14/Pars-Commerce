// ── Comisiones MP: Link de pago único ────────────────────────────────────────
export const MP_FEE_PERCENT = 0.0405;
export const MP_FEE_FIXED_MXN = 4.64;

// ── Comisiones MP: Suscripción (cobro automático) ───────────────────────────
// Fuente: mercadopago.com.mx/costs — Tarjeta crédito/débito, disponible al instante
export const MP_SUB_FEE_PERCENT = 0.0349;
export const MP_SUB_FEE_FIXED_MXN = 4.0;

// ── Comisiones MP: Meses Sin Intereses (MSI) ────────────────────────────────
// Fuente: mercadopago.com.mx/costs — Plan de cuotas sin intereses (MX)
// Comisión total = (BASE 3.49% + msiRate) × IVA 16% + costo fijo $4 × IVA
export const MP_MSI_BASE_RATE = 0.0349;
export const MP_MSI_FIXED_MXN = 4.0;
export const MP_IVA_PERCENT = 0.16;

export const MP_MSI_RATES: Record<1 | 3 | 6 | 9 | 12, number> = {
  1: 0,
  3: 0.0469,
  6: 0.0769,
  9: 0.1119,
  12: 0.1289,
};

export const MSI_OPTIONS = [1, 3, 6, 9, 12] as const;
export type MsiOption = (typeof MSI_OPTIONS)[number];

export const MP_MSI_MIN_INSTALLMENT_MXN = 30;

export const PARS_SERVICE_FEE_PERCENT = 0;
export const TARIFA_DE_SERVICIO_LABEL = "Tarifa de servicio";
export const RECEIPT_LINK_LABEL = "Link de pago – enviar al cliente";

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
      Math.round(
        (desiredAmount * MP_SUB_FEE_PERCENT + MP_SUB_FEE_FIXED_MXN) * 100,
      ) / 100;
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
    Math.round(
      (chargeAmount * MP_SUB_FEE_PERCENT + MP_SUB_FEE_FIXED_MXN) * 100,
    ) / 100;
  const parsFee =
    Math.round(chargeAmount * PARS_SERVICE_FEE_PERCENT * 100) / 100;
  const netReceived = Math.round((chargeAmount - mpFee - parsFee) * 100) / 100;
  return { chargeAmount, mpFee, parsFee, netReceived };
}

/**
 * Calcula el desglose para un pago con MSI (Meses Sin Intereses).
 *
 * Fórmula del MD (con IVA aplicado):
 *   feePercentEffective = (MP_MSI_BASE_RATE + MP_MSI_RATES[msi]) × (1 + IVA)
 *   precio = (neto + MP_MSI_FIXED × (1 + IVA)) / (1 − feePercentEffective)
 *
 * @param vendorTotal - Monto neto que el negocio quiere recibir.
 * @param msi         - Cantidad de MSI: 1 (contado), 3, 6, 9 o 12.
 * @param absorbedBy  - Quién absorbe la comisión MSI: cliente o negocio.
 *
 * Si `absorbedBy === "customer"`: el cliente paga `vendorTotal + comisión MSI`.
 * Si `absorbedBy === "business"`: el cliente paga `vendorTotal`, el negocio recibe `vendorTotal - comisión MSI`.
 */
export function calcMsiBuyerTotal(
  vendorTotal: number,
  msi: MsiOption,
  absorbedBy: "customer" | "business" = "customer",
): {
  total: number;
  mpFee: number;
  parsFee: number;
  netReceived: number;
  perMonth: number;
  msi: MsiOption;
} {
  // msi=1 significa "Contado" (pago único sin cuotas MSI).
  // Usamos la tarifa estándar de checkout MP (MP_FEE_PERCENT + MP_FEE_FIXED_MXN),
  // distinta a la tarifa MSI (MP_MSI_BASE_RATE). Si el negocio absorbe,
  // el cliente paga el subtotal y el negocio recibe menos; si el cliente
  // absorbe, se cobra la comisión estándar encima del subtotal.
  if (msi === 1) {
    const parsFee = Math.round(vendorTotal * PARS_SERVICE_FEE_PERCENT * 100) / 100;
    if (absorbedBy === "business") {
      const total = Math.round(vendorTotal * 100) / 100;
      const mpFee =
        Math.round((vendorTotal * MP_FEE_PERCENT + MP_FEE_FIXED_MXN) * 100) / 100;
      const netReceived = Math.round((total - mpFee - parsFee) * 100) / 100;
      return { total, mpFee, parsFee, netReceived, perMonth: total, msi };
    }
    // Cliente absorbe: calcBuyerTotal ya usa MP_FEE_PERCENT + MP_FEE_FIXED_MXN
    const { total, mpFee: mpFeeCalc, parsFee: parsFeeCalc } = calcBuyerTotal(vendorTotal);
    const netReceived = Math.round((total - mpFeeCalc - parsFeeCalc) * 100) / 100;
    return { total, mpFee: mpFeeCalc, parsFee: parsFeeCalc, netReceived, perMonth: total, msi };
  }

  const msiRate = MP_MSI_RATES[msi] ?? 0;
  const feePercentEffective =
    (MP_MSI_BASE_RATE + msiRate) * (1 + MP_IVA_PERCENT);
  const fixedFeeWithIva = MP_MSI_FIXED_MXN * (1 + MP_IVA_PERCENT);
  const parsFee =
    Math.round(vendorTotal * PARS_SERVICE_FEE_PERCENT * 100) / 100;

  if (absorbedBy === "business") {
    const total = Math.round(vendorTotal * 100) / 100;
    const mpFee =
      Math.round((vendorTotal * feePercentEffective + fixedFeeWithIva) * 100) /
      100;
    const netReceived = Math.round((total - mpFee - parsFee) * 100) / 100;
    const perMonth = Math.round((total / msi) * 100) / 100;
    return { total, mpFee, parsFee, netReceived, perMonth, msi };
  }

  const total =
    Math.ceil(
      ((vendorTotal + fixedFeeWithIva + parsFee) / (1 - feePercentEffective)) *
        100,
    ) / 100;
  const mpFee = Math.round((total - vendorTotal - parsFee) * 100) / 100;
  const netReceived = Math.round((total - mpFee - parsFee) * 100) / 100;
  const perMonth = Math.round((total / msi) * 100) / 100;
  return { total, mpFee, parsFee, netReceived, perMonth, msi };
}

/**
 * Devuelve las opciones MSI viables para un monto dado, descartando las que
 * generen una cuota mensual menor al mínimo permitido por MP.
 */
export function getViableMsiOptions(
  vendorTotal: number,
  absorbedBy: "customer" | "business" = "customer",
): MsiOption[] {
  return MSI_OPTIONS.filter((n) => {
    if (n === 1) return true;
    const breakdown = calcMsiBuyerTotal(vendorTotal, n, absorbedBy);
    return breakdown.perMonth >= MP_MSI_MIN_INSTALLMENT_MXN;
  });
}
