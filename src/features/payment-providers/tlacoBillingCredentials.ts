/**
 * Tlaco's own account is deliberately isolated from merchant-sale OAuth
 * credentials. The legacy name is accepted temporarily so historic billing
 * flows can be deployed before an environment-variable rotation.
 */
export function getTlacoMercadoPagoAccessToken() {
  const token = process.env.TLACO_MP_ACCESS_TOKEN ?? process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("No está configurado Mercado Pago para cobros propios de Tlaco");
  return token;
}
