export type PaymentProvider = "mercadopago";

export type ProviderConnectionStatus =
  | "pending"
  | "connected"
  | "expired"
  | "revoked"
  | "failed";

export interface ProviderCapabilities {
  checkout: boolean;
  links: boolean;
  subscriptions: boolean;
  point: boolean;
  split_fee: boolean;
}

export const DEFAULT_MERCADOPAGO_CAPABILITIES: ProviderCapabilities = {
  checkout: true,
  links: true,
  subscriptions: false,
  point: false,
  // This must only become true after Mercado Pago has approved Tlaco's
  // Marketplace/Split model. OAuth alone is never proof of Split eligibility.
  split_fee: false,
};

export interface SafeProviderConnection {
  id: string;
  tenant_id: string;
  provider: PaymentProvider;
  merchant_account_id: string | null;
  merchant_display_name: string | null;
  status: ProviderConnectionStatus;
  capabilities: ProviderCapabilities;
  connected_at: string | null;
  revoked_at: string | null;
  last_synced_at: string | null;
  last_error: string | null;
  terms_version_accepted: string | null;
  terms_accepted_at: string | null;
}

export interface MerchantCheckoutInput {
  accessToken: string;
  externalReference: string;
  notificationUrl: string;
  payerEmail: string;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    currency_id: "MXN";
  }>;
  backUrls: { success: string; failure: string; pending: string };
  marketplaceFee?: number;
  installments?: number;
}
