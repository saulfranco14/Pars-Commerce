import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

import type { MerchantCheckoutInput, ProviderCapabilities } from "@/features/payment-providers/types";

const MP_API = "https://api.mercadopago.com";
const MP_OAUTH = "https://auth.mercadopago.com.mx/authorization";

interface OAuthTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user_id?: number;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function mercadoPagoOAuthConfig() {
  const clientId = process.env.MP_OAUTH_CLIENT_ID;
  const clientSecret = process.env.MP_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Mercado Pago OAuth no está configurado en Tlaco");
  }
  return { clientId, clientSecret };
}

export function createMercadoPagoAuthorizationUrl(input: {
  redirectUri: string;
  state: string;
  codeChallenge: string;
}) {
  const { clientId } = mercadoPagoOAuthConfig();
  const url = new URL(MP_OAUTH);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("state", input.state);
  url.searchParams.set("code_challenge", input.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export async function exchangeMercadoPagoAuthorizationCode(input: {
  code: string;
  redirectUri: string;
  verifier: string;
}) {
  const { clientId, clientSecret } = mercadoPagoOAuthConfig();
  const form = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code: input.code,
    redirect_uri: input.redirectUri,
    code_verifier: input.verifier,
  });
  const response = await fetch(`${MP_API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as OAuthTokenResponse | null;
  if (!response.ok || !body?.access_token || !body.refresh_token) {
    throw new Error("Mercado Pago no pudo autorizar la cuenta del negocio");
  }
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresInSeconds: numberValue(body.expires_in) ?? 0,
    merchantAccountId: body.user_id ? String(body.user_id) : null,
  };
}

export async function refreshMercadoPagoAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = mercadoPagoOAuthConfig();
  const form = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });
  const response = await fetch(`${MP_API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as OAuthTokenResponse | null;
  if (!response.ok || !body?.access_token || !body.refresh_token) {
    throw new Error("No fue posible renovar la conexión de Mercado Pago");
  }
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresInSeconds: numberValue(body.expires_in) ?? 0,
  };
}

export async function getMercadoPagoMerchant(accessToken: string) {
  const response = await fetch(`${MP_API}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok || !body) {
    throw new Error("No pudimos verificar la cuenta de Mercado Pago conectada");
  }
  const id = numberValue(body.id) ?? numberValue(body.user_id);
  const nickname = stringValue(body.nickname);
  const firstName = stringValue(body.first_name);
  const lastName = stringValue(body.last_name);
  return {
    merchantAccountId: id ? String(id) : null,
    displayName: nickname ?? ([firstName, lastName].filter(Boolean).join(" ") || null),
  };
}

export function defaultMercadoPagoCapabilities(): ProviderCapabilities {
  return { checkout: true, links: true, subscriptions: false, point: false, split_fee: false };
}

export async function createMercadoPagoMerchantCheckout(input: MerchantCheckoutInput) {
  const client = new MercadoPagoConfig({ accessToken: input.accessToken });
  const preference = new Preference(client);
  const marketplaceFee = input.marketplaceFee && input.marketplaceFee > 0
    ? { marketplace_fee: Number(input.marketplaceFee.toFixed(2)) }
    : {};
  const result = await preference.create({
    body: {
      items: input.items,
      external_reference: input.externalReference,
      notification_url: input.notificationUrl,
      back_urls: input.backUrls,
      payer: { email: input.payerEmail },
      ...marketplaceFee,
      ...(input.installments && input.installments > 1
        ? { payment_methods: { installments: input.installments, default_installments: input.installments } }
        : {}),
    },
  });
  const paymentLink = result.init_point ?? result.sandbox_init_point;
  if (!paymentLink || !result.id) {
    throw new Error("Mercado Pago no devolvió un enlace de pago válido");
  }
  return { preferenceId: result.id, paymentLink };
}

export async function getMercadoPagoPayment(accessToken: string, paymentId: string) {
  const client = new MercadoPagoConfig({ accessToken });
  return new Payment(client).get({ id: paymentId });
}

interface PointDevice {
  id: string;
  pos_id: string | null;
  store_id: string | null;
  external_pos_id: string | null;
  status: string | null;
}

export async function listMercadoPagoPointDevices(accessToken: string) {
  const response = await fetch(`${MP_API}/point/integration-api/devices`, {
    headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) throw new Error("No pudimos consultar las terminales Point de esta cuenta");
  const entries = Array.isArray(body)
    ? body
    : body && typeof body === "object" && Array.isArray((body as Record<string, unknown>).results)
      ? (body as Record<string, unknown>).results as unknown[]
      : [];
  return entries.flatMap((entry): PointDevice[] => {
    if (!entry || typeof entry !== "object") return [];
    const value = entry as Record<string, unknown>;
    const id = stringValue(value.id);
    if (!id) return [];
    return [{
      id,
      pos_id: stringValue(value.pos_id),
      store_id: stringValue(value.store_id),
      external_pos_id: stringValue(value.external_pos_id),
      status: stringValue(value.status),
    }];
  });
}

export async function createMercadoPagoPointOrder(input: {
  accessToken: string;
  terminalId: string;
  externalReference: string;
  title: string;
  amount: number;
  notificationUrl: string;
}) {
  const response = await fetch(`${MP_API}/point/integration-api/devices/${encodeURIComponent(input.terminalId)}/order`, {
    method: "POST",
    headers: { Authorization: `Bearer ${input.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      external_reference: input.externalReference,
      title: input.title,
      description: "Cobro generado desde Tlaco",
      notification_url: input.notificationUrl,
      total_amount: Number(input.amount.toFixed(2)),
    }),
  });
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  const id = body ? stringValue(body.id) : null;
  if (!response.ok || !id) throw new Error("Mercado Pago Point no pudo enviar el cobro a la terminal");
  return { providerOrderId: id };
}

export async function cancelMercadoPagoPointOrder(input: { accessToken: string; terminalId: string; providerOrderId: string }) {
  const response = await fetch(`${MP_API}/point/integration-api/devices/${encodeURIComponent(input.terminalId)}/order/${encodeURIComponent(input.providerOrderId)}`, {
    method: "DELETE", headers: { Authorization: `Bearer ${input.accessToken}` },
  });
  if (!response.ok && response.status !== 404) throw new Error("No fue posible cancelar el cobro en Point");
}
