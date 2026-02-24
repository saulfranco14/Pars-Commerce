export const MP_FEE_PERCENT = 0.0405;
export const MP_FEE_FIXED_MXN = 4.64;
export const PARS_SERVICE_FEE_PERCENT = 0;
export const TARIFA_DE_SERVICIO_LABEL = "Tarifa de servicio";

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
