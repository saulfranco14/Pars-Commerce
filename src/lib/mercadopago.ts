import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");
}

const client = new MercadoPagoConfig({ accessToken });

export const preferenceClient = new Preference(client);
export const paymentClient = new Payment(client);
export { client as mpClient };
