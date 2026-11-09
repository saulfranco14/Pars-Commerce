import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { getTlacoMercadoPagoAccessToken } from "@/features/payment-providers/tlacoBillingCredentials";
import { StudioError } from "./studioErrors";

const paymentDeadline = new AsyncLocalStorage<number>();
export function withStudioPaymentDeadline<T>(
  deadline: number,
  action: () => Promise<T>,
): Promise<T> {
  return paymentDeadline.run(deadline, action);
}

export interface StudioMpPayment {
  id: string | number;
  status: string;
  external_reference?: string | null;
  transaction_amount?: number;
  currency_id?: string;
  collector_id?: number;
  date_approved?: string | null;
  date_created?: string;
  transaction_amount_refunded?: number;
}
export interface StudioMpSubscription {
  id: string;
  init_point?: string;
  status: string;
  external_reference?: string;
  next_payment_date?: string;
  auto_recurring?: {
    start_date?: string;
    transaction_amount?: number;
    frequency?: number;
    frequency_type?: string;
    currency_id?: string;
  };
}
export interface StudioMpInvoice {
  id: string | number;
  preapproval_id?: string;
  payment?: { id?: string | number; status?: string };
  payment_id?: string | number;
  debit_date?: string;
  transaction_amount?: number;
}

export async function studioMpRequest<T>(
  path: string,
  method = "GET",
  body?: unknown,
  key?: string,
): Promise<T> {
  const timeout = Math.min(
    20_000,
    (paymentDeadline.getStore() ?? Date.now() + 20_000) - Date.now(),
  );
  if (timeout <= 0) throw new StudioError("RECONCILIATION_PENDING");
  const response = await fetch(`https://api.mercadopago.com/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getTlacoMercadoPagoAccessToken()}`,
      "Content-Type": "application/json",
      ...(key ? { "X-Idempotency-Key": key } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(timeout),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("[studio] Mercado Pago request failed", {
      path: path.split("/")[0],
      status: response.status,
      code: payload?.error,
    });
    const inaccessible = response.status === 404 || response.status === 403;
    throw new StudioError(
      inaccessible ? "PROVIDER_NOT_FOUND" : "PAYMENT_PROVIDER_ERROR",
      inaccessible
        ? "No encontramos el recurso del pago."
        : "Mercado Pago no pudo completar la operación. Tu saldo no cambió.",
      inaccessible ? 404 : 502,
    );
  }
  return payload as T;
}

export async function verifyStudioPayment(payment: StudioMpPayment) {
  const owner = await studioMpRequest<{ id: number }>("users/me");
  if (
    payment.currency_id !== "MXN" ||
    Number(payment.collector_id) !== Number(owner.id)
  )
    throw new StudioError(
      "PAYMENT_MISMATCH",
      "El pago necesita conciliación antes de activar Studio.",
      409,
    );
}
