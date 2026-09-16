import type { SupabaseClient } from "@supabase/supabase-js";

import { decryptMerchantSecret, encryptMerchantSecret, sha256 } from "@/features/payment-providers/merchantTokenCipher";
import {
  defaultMercadoPagoCapabilities,
  getMercadoPagoMerchant,
  refreshMercadoPagoAccessToken,
  listMercadoPagoPointDevices,
} from "@/features/payment-providers/mercadoPagoProvider";
import type {
  PaymentProvider,
  ProviderCapabilities,
  ProviderConnectionStatus,
  SafeProviderConnection,
} from "@/features/payment-providers/types";

// This temporary untyped boundary exists only because the migration and the
// generated Supabase file are deployed independently. It keeps provider token
// fields out of the app-wide Database type until `supabase gen types` runs.
export type ProviderDb = SupabaseClient;

export function asPaymentProviderAdmin(client: unknown): ProviderDb {
  return client as ProviderDb;
}

interface ConnectionRow {
  id: string;
  tenant_id: string;
  provider: PaymentProvider;
  merchant_account_id: string | null;
  merchant_display_name: string | null;
  access_token_ciphertext: string | null;
  refresh_token_ciphertext: string | null;
  token_expires_at: string | null;
  status: ProviderConnectionStatus;
  capabilities: unknown;
  connected_at: string | null;
  revoked_at: string | null;
  last_synced_at: string | null;
  last_error: string | null;
  terms_version_accepted: string | null;
  terms_accepted_at: string | null;
  oauth_state_hash: string | null;
  oauth_state_expires_at: string | null;
  pkce_verifier_ciphertext: string | null;
}

function asConnectionRow(row: unknown): ConnectionRow | null {
  if (!row || typeof row !== "object") return null;
  const value = row as Record<string, unknown>;
  if (typeof value.id !== "string" || typeof value.tenant_id !== "string") return null;
  return value as unknown as ConnectionRow;
}

function asCapabilities(value: unknown): ProviderCapabilities {
  const defaults = defaultMercadoPagoCapabilities();
  if (!value || typeof value !== "object") return defaults;
  const record = value as Record<string, unknown>;
  return {
    checkout: record.checkout === true,
    links: record.links === true,
    subscriptions: record.subscriptions === true,
    point: record.point === true,
    split_fee: record.split_fee === true,
  };
}

export function toSafeConnection(row: ConnectionRow): SafeProviderConnection {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    provider: row.provider,
    merchant_account_id: row.merchant_account_id,
    merchant_display_name: row.merchant_display_name,
    status: row.status,
    capabilities: asCapabilities(row.capabilities),
    connected_at: row.connected_at,
    revoked_at: row.revoked_at,
    last_synced_at: row.last_synced_at,
    last_error: row.last_error,
    terms_version_accepted: row.terms_version_accepted,
    terms_accepted_at: row.terms_accepted_at,
  };
}

export async function beginMercadoPagoConnection(input: {
  admin: ProviderDb;
  tenantId: string;
  userId: string;
  state: string;
  verifier: string;
  termsVersion: string;
}) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
  const { data, error } = await input.admin
    .from("payment_provider_connections")
    .upsert(
      {
        tenant_id: input.tenantId,
        provider: "mercadopago",
        status: "pending",
        connected_by: input.userId,
        terms_version_accepted: input.termsVersion,
        terms_accepted_at: now.toISOString(),
        oauth_state_hash: sha256(input.state),
        oauth_state_expires_at: expiresAt,
        pkce_verifier_ciphertext: encryptMerchantSecret(input.verifier),
        revoked_at: null,
        last_error: null,
        updated_at: now.toISOString(),
      },
      { onConflict: "tenant_id,provider" },
    )
    .select("*")
    .single();
  const row = asConnectionRow(data);
  if (error || !row) throw new Error(error?.message ?? "No se pudo iniciar la conexión");
  return row;
}

export async function findOAuthConnection(admin: ProviderDb, state: string) {
  const { data, error } = await admin
    .from("payment_provider_connections")
    .select("*")
    .eq("provider", "mercadopago")
    .eq("oauth_state_hash", sha256(state))
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = asConnectionRow(data);
  if (!row || !row.oauth_state_expires_at || new Date(row.oauth_state_expires_at) < new Date()) {
    throw new Error("La autorización expiró. Regresa a Tlaco e inténtalo de nuevo.");
  }
  if (!row.pkce_verifier_ciphertext) throw new Error("La autorización no tiene un verificador válido");
  return row;
}

export async function completeMercadoPagoConnection(input: {
  admin: ProviderDb;
  connection: ConnectionRow;
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  merchantAccountId: string | null;
}) {
  const merchant = await getMercadoPagoMerchant(input.accessToken);
  const expiresAt = new Date(Date.now() + Math.max(input.expiresInSeconds, 60) * 1000).toISOString();
  const now = new Date().toISOString();
  const { data, error } = await input.admin
    .from("payment_provider_connections")
    .update({
      access_token_ciphertext: encryptMerchantSecret(input.accessToken),
      refresh_token_ciphertext: encryptMerchantSecret(input.refreshToken),
      token_expires_at: expiresAt,
      merchant_account_id: merchant.merchantAccountId ?? input.merchantAccountId,
      merchant_display_name: merchant.displayName,
      status: "connected",
      capabilities: defaultMercadoPagoCapabilities(),
      connected_at: now,
      revoked_at: null,
      oauth_state_hash: null,
      oauth_state_expires_at: null,
      pkce_verifier_ciphertext: null,
      last_synced_at: now,
      last_error: null,
      updated_at: now,
    })
    .eq("id", input.connection.id)
    .select("*")
    .single();
  const row = asConnectionRow(data);
  if (error || !row) throw new Error(error?.message ?? "No se pudo guardar la conexión");
  return row;
}

export async function listSafeConnections(admin: ProviderDb, tenantId: string) {
  const { data, error } = await admin
    .from("payment_provider_connections")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? [])
    .map(asConnectionRow)
    .filter((row): row is ConnectionRow => row !== null)
    .map(toSafeConnection);
}

export async function revokeMercadoPagoConnection(admin: ProviderDb, tenantId: string) {
  const now = new Date().toISOString();
  const { error } = await admin
    .from("payment_provider_connections")
    .update({
      status: "revoked",
      revoked_at: now,
      access_token_ciphertext: null,
      refresh_token_ciphertext: null,
      token_expires_at: null,
      pkce_verifier_ciphertext: null,
      oauth_state_hash: null,
      oauth_state_expires_at: null,
      updated_at: now,
    })
    .eq("tenant_id", tenantId)
    .eq("provider", "mercadopago");
  if (error) throw new Error(error.message);
  await admin.from("tenants").update({ merchant_payments_v2_enabled: false }).eq("id", tenantId);
}

export async function getConnectedMercadoPagoConnection(admin: ProviderDb, tenantId: string) {
  const { data, error } = await admin
    .from("payment_provider_connections")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("provider", "mercadopago")
    .eq("status", "connected")
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = asConnectionRow(data);
  if (!row || !row.access_token_ciphertext || !row.refresh_token_ciphertext) {
    throw new Error("Este negocio aún no conectó Mercado Pago");
  }
  return refreshConnectionIfNeeded(admin, row);
}

export async function getConnectedMercadoPagoConnectionByMerchantAccount(
  admin: ProviderDb,
  merchantAccountId: string,
) {
  const { data, error } = await admin
    .from("payment_provider_connections")
    .select("*")
    .eq("provider", "mercadopago")
    .eq("merchant_account_id", merchantAccountId)
    .eq("status", "connected")
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = asConnectionRow(data);
  if (!row || !row.access_token_ciphertext || !row.refresh_token_ciphertext) {
    throw new Error("No existe una conexión activa para la cuenta de Mercado Pago notificada");
  }
  return refreshConnectionIfNeeded(admin, row);
}

export async function refreshConnectionIfNeeded(admin: ProviderDb, row: ConnectionRow) {
  const expiresAt = row.token_expires_at ? new Date(row.token_expires_at).getTime() : 0;
  const needsRefresh = expiresAt <= Date.now() + 5 * 60 * 1000;
  if (!needsRefresh) {
    return { connection: row, accessToken: decryptMerchantSecret(row.access_token_ciphertext ?? "") };
  }
  try {
    const refreshed = await refreshMercadoPagoAccessToken(
      decryptMerchantSecret(row.refresh_token_ciphertext ?? ""),
    );
    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("payment_provider_connections")
      .update({
        access_token_ciphertext: encryptMerchantSecret(refreshed.accessToken),
        refresh_token_ciphertext: encryptMerchantSecret(refreshed.refreshToken),
        token_expires_at: new Date(Date.now() + Math.max(refreshed.expiresInSeconds, 60) * 1000).toISOString(),
        status: "connected",
        last_error: null,
        last_synced_at: now,
        updated_at: now,
      })
      .eq("id", row.id)
      .select("*")
      .single();
    const connection = asConnectionRow(data);
    if (error || !connection) throw new Error(error?.message ?? "No se pudo renovar la conexión");
    return { connection, accessToken: refreshed.accessToken };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo renovar la conexión";
    await admin.from("payment_provider_connections").update({
      status: "expired",
      last_error: message,
      updated_at: new Date().toISOString(),
    }).eq("id", row.id);
    throw new Error("La conexión de Mercado Pago venció. El propietario debe reconectarla.");
  }
}

export async function enableMerchantPayments(admin: ProviderDb, tenantId: string) {
  await admin.from("tenants").update({ merchant_payments_v2_enabled: true }).eq("id", tenantId);
}

export function decryptOauthVerifier(connection: ConnectionRow) {
  if (!connection.pkce_verifier_ciphertext) throw new Error("No existe verificador OAuth");
  return decryptMerchantSecret(connection.pkce_verifier_ciphertext);
}

interface FeePolicyRow {
  id: string;
  rate_type: "fixed" | "percentage";
  rate_value: number | string;
  collection_mode: "marketplace_split" | "tlaco_invoice" | "none";
  accepted_at: string | null;
}

export async function getActiveSaleFeePolicy(admin: ProviderDb, tenantId: string) {
  const { data, error } = await admin
    .from("tenant_fee_policies")
    .select("id, rate_type, rate_value, collection_mode, accepted_at")
    .eq("tenant_id", tenantId)
    .eq("scope", "sale")
    .or("provider.is.null,provider.eq.mercadopago")
    .is("effective_to", null)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as FeePolicyRow | null;
}

export function calculatePlatformFee(input: {
  policy: FeePolicyRow | null;
  amount: number;
  splitEnabled: boolean;
  forceInvoice?: boolean;
}) {
  const policy = input.policy;
  if (!policy || !policy.accepted_at || policy.collection_mode === "none") {
    return { marketplaceFee: 0, invoiceFee: 0, policyId: null };
  }
  const value = Number(policy.rate_value);
  const amount = policy.rate_type === "percentage" ? input.amount * (value / 100) : value;
  const rounded = Math.max(0, Math.round(amount * 100) / 100);
  if (policy.collection_mode === "marketplace_split" && input.splitEnabled && !input.forceInvoice) {
    return { marketplaceFee: rounded, invoiceFee: 0, policyId: policy.id };
  }
  const invoiceFee = policy.collection_mode === "tlaco_invoice" || input.forceInvoice ? rounded : 0;
  return { marketplaceFee: 0, invoiceFee, policyId: policy.id };
}

export async function attachConnectionToAttempt(input: {
  admin: ProviderDb;
  attemptId: string;
  connectionId: string;
}) {
  const { error } = await input.admin.from("order_payment_attempts").update({
    provider_connection_id: input.connectionId,
    provider: "mercadopago",
    updated_at: new Date().toISOString(),
  }).eq("id", input.attemptId);
  if (error) throw new Error(error.message);
}

export async function createMerchantPendingPayment(input: {
  admin: ProviderDb;
  orderId: string;
  attemptId: string;
  checkoutSessionId: string | null;
  amount: number;
  preferenceId: string;
  paymentLink: string;
  connection: { id: string; merchant_account_id: string | null };
  platformFeeAmount: number;
  invoiceFeeAmount: number;
  idempotencyKey: string;
}) {
  const { error } = await input.admin.from("payments").insert({
    order_id: input.orderId,
    provider: "mercadopago",
    external_id: input.preferenceId,
    provider_order_id: input.preferenceId,
    status: "pending",
    amount: input.amount,
    payment_kind: "single",
    checkout_session_id: input.checkoutSessionId,
    attempt_id: input.attemptId,
    idempotency_key: input.idempotencyKey,
    provider_connection_id: input.connection.id,
    merchant_account_id: input.connection.merchant_account_id,
    funds_owner: "tenant",
    platform_fee_amount: input.platformFeeAmount,
    provider_fee_amount: 0,
    reconciliation_status: "pending",
    metadata: {
      preference_id: input.preferenceId,
      init_point: input.paymentLink,
      invoice_fee_amount: input.invoiceFeeAmount,
    },
  });
  if (error && error.code !== "23505") throw new Error(error.message);
}

export async function syncMercadoPagoPointTerminals(admin: ProviderDb, tenantId: string) {
  const { connection, accessToken } = await getConnectedMercadoPagoConnection(admin, tenantId);
  const devices = await listMercadoPagoPointDevices(accessToken);
  const now = new Date().toISOString();
  for (const device of devices) {
    const { error } = await admin.from("payment_provider_terminals").upsert({
      connection_id: connection.id,
      provider_terminal_id: device.id,
      branch: device.store_id,
      pos: device.pos_id,
      display_name: device.external_pos_id ?? `Point ${device.id.slice(-6)}`,
      operating_mode: "PDV",
      status: device.status ?? "active",
      last_synced_at: now,
      updated_at: now,
    }, { onConflict: "provider_terminal_id" });
    if (error) throw new Error(error.message);
  }
  await admin.from("payment_provider_connections").update({
    capabilities: { ...asCapabilities(connection.capabilities), point: devices.length > 0 },
    last_synced_at: now,
    updated_at: now,
  }).eq("id", connection.id);
  return devices.length;
}
