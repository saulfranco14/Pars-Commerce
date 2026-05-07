import { MSI_OPTIONS } from "@/constants/commissionConfig";
import type { MsiOption } from "@/constants/commissionConfig";

import type {
  CheckoutMode,
  PublicCheckoutPayload,
} from "@/features/checkout/interfaces/publicCheckout";

const FINGERPRINT_HEADER = "x-fingerprint-id";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://commerce.pars.com.mx";

export function getFingerprint(request: Request): string | null {
  return request.headers.get(FINGERPRINT_HEADER)?.trim() || null;
}

export function getOrigin(request: Request): string {
  const rawOrigin =
    request.headers.get("origin") ??
    request.headers.get("referer")?.replace(/\/[^/]*$/, "") ??
    "http://localhost:3000";
  const isLocalhost =
    rawOrigin.includes("localhost") || rawOrigin.includes("127.0.0.1");
  return isLocalhost ? APP_URL : rawOrigin;
}

export function normalizeMsiOption(value: unknown): MsiOption {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 1;
  return (MSI_OPTIONS as readonly number[]).includes(n) ? (n as MsiOption) : 1;
}

export function toMode(
  mode: string | undefined,
  modeOverride?: CheckoutMode,
): CheckoutMode {
  if (modeOverride) return modeOverride;
  if (mode === "subscription" || mode === "partial" || mode === "single")
    return mode;
  return "single";
}

export function parseBody(raw: unknown): PublicCheckoutPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Partial<PublicCheckoutPayload>;
  if (
    !body.tenant_id ||
    !body.cart_id ||
    !body.customer_name ||
    !body.customer_email
  ) {
    return null;
  }
  return {
    tenant_id: body.tenant_id,
    cart_id: body.cart_id,
    customer_name: body.customer_name,
    customer_email: body.customer_email,
    customer_phone: body.customer_phone,
    mode: body.mode ?? "single",
    installments: body.installments,
    frequency: body.frequency,
    frequency_type: body.frequency_type,
    msi_option: normalizeMsiOption(body.msi_option),
  };
}
