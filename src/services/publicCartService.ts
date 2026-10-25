import type {
  PublicCartResponse,
  CheckoutPickupPayload,
  CheckoutPickupResponse,
  CheckoutSubscriptionPayload,
  CheckoutSubscriptionResponse,
} from "@/types/cart";

export type {
  PublicCartItem,
  PublicCartResponse,
  CheckoutPickupPayload,
  CheckoutPickupResponse,
  CheckoutSubscriptionPayload,
  CheckoutSubscriptionResponse,
} from "@/types/cart";

function getHeaders(fingerprintId: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-fingerprint-id": fingerprintId,
  };
}

export async function getCart(
  tenantId: string,
  fingerprintId: string
): Promise<PublicCartResponse> {
  const res = await fetch(
    `/api/public-cart?tenant_id=${encodeURIComponent(tenantId)}`,
    { headers: getHeaders(fingerprintId) }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof (data as { error?: string }).error === "string"
        ? (data as { error: string }).error
        : res.statusText
    );
  }
  return data as PublicCartResponse;
}

export async function addItem(
  tenantId: string,
  productId: string,
  quantity: number,
  fingerprintId: string,
  productVariantId?: string,
): Promise<{ success: boolean; cart_id: string }> {
  const res = await fetch("/api/public-cart", {
    method: "POST",
    headers: getHeaders(fingerprintId),
    body: JSON.stringify({
      tenant_id: tenantId,
      product_id: productId,
      quantity,
      product_variant_id: productVariantId,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof (data as { error?: string }).error === "string"
        ? (data as { error: string }).error
        : res.statusText
    );
  }
  return data as { success: boolean; cart_id: string };
}

export async function addPromotion(
  tenantId: string,
  promotionId: string,
  fingerprintId: string
): Promise<{ success: boolean; cart_id: string }> {
  const res = await fetch("/api/public-cart", {
    method: "POST",
    headers: getHeaders(fingerprintId),
    body: JSON.stringify({
      tenant_id: tenantId,
      promotion_id: promotionId,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof (data as { error?: string }).error === "string"
        ? (data as { error: string }).error
        : res.statusText
    );
  }
  return data as { success: boolean; cart_id: string };
}

async function readError(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return typeof (data as { error?: string }).error === "string" ? (data as { error: string }).error : res.statusText;
}

export async function addPlan(tenantId: string, planId: string, fingerprintId: string): Promise<void> {
  const res = await fetch("/api/public-cart", {
    method: "POST",
    headers: getHeaders(fingerprintId),
    body: JSON.stringify({ tenant_id: tenantId, plan_id: planId }),
  });
  if (!res.ok) throw new Error(await readError(res));
}

export async function removePlan(cartId: string, planLineId: string, fingerprintId: string): Promise<void> {
  const url = `/api/public-cart?cart_id=${encodeURIComponent(cartId)}&plan_line_id=${encodeURIComponent(planLineId)}`;
  const res = await fetch(url, { method: "DELETE", headers: getHeaders(fingerprintId) });
  if (!res.ok) throw new Error(await readError(res));
}

export async function updateItemQuantity(
  cartId: string,
  itemId: string,
  quantity: number,
  fingerprintId: string
): Promise<void> {
  const res = await fetch("/api/public-cart", {
    method: "PATCH",
    headers: getHeaders(fingerprintId),
    body: JSON.stringify({
      cart_id: cartId,
      item_id: itemId,
      quantity,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof (data as { error?: string }).error === "string"
        ? (data as { error: string }).error
        : res.statusText
    );
  }
}

export async function removeItem(
  cartId: string,
  itemId: string,
  fingerprintId: string
): Promise<void> {
  const url = `/api/public-cart?cart_id=${encodeURIComponent(cartId)}&item_id=${encodeURIComponent(itemId)}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: getHeaders(fingerprintId),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof (data as { error?: string }).error === "string"
        ? (data as { error: string }).error
        : res.statusText
    );
  }
}

export async function checkoutPickup(
  payload: CheckoutPickupPayload,
  fingerprintId: string
): Promise<CheckoutPickupResponse> {
  const res = await fetch("/api/public-checkout", {
    method: "POST",
    headers: getHeaders(fingerprintId),
    body: JSON.stringify({
      ...payload,
      mode: "single",
      msi_option: payload.msi_option ?? 1,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof (data as { error?: string }).error === "string"
        ? (data as { error: string }).error
        : res.statusText,
    );
  }
  return {
    success: true,
    order_id: (data as { order_id: string }).order_id,
    redirect_url:
      (data as { redirect_url?: string; payment_link?: string }).redirect_url ??
      (data as { payment_link: string }).payment_link,
  };
}

export async function checkoutWhatsApp(
  payload: Omit<CheckoutPickupPayload, "msi_option">,
  fingerprintId: string,
  idempotencyKey: string,
): Promise<{ success: boolean; order_id: string; whatsapp_url: string }> {
  const res = await fetch("/api/public-whatsapp-order", {
    method: "POST",
    headers: { ...getHeaders(fingerprintId), "x-idempotency-key": idempotencyKey },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof (data as { error?: string }).error === "string" ? (data as { error: string }).error : res.statusText);
  }
  return data as { success: boolean; order_id: string; whatsapp_url: string };
}

export async function requestOrder(
  payload: {
    tenant_id: string;
    cart_id: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    scheduled_for?: string | null;
    accept_terms: boolean;
    marketing_opt_in?: boolean;
  },
  fingerprintId: string,
  idempotencyKey: string,
): Promise<{ order_id: string; tracking_url: string }> {
  const res = await fetch("/api/public-order-requests", {
    method: "POST",
    headers: { ...getHeaders(fingerprintId), "x-idempotency-key": idempotencyKey },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof (data as { error?: string }).error === "string" ? (data as { error: string }).error : res.statusText);
  }
  return data as { order_id: string; tracking_url: string };
}

export async function checkoutSubscription(
  payload: CheckoutSubscriptionPayload,
  fingerprintId: string
): Promise<CheckoutSubscriptionResponse> {
  const mode = payload.payment_mode === "recurring" ? "subscription" : "partial";
  const res = await fetch("/api/public-checkout", {
    method: "POST",
    headers: getHeaders(fingerprintId),
    body: JSON.stringify({
      tenant_id: payload.tenant_id,
      cart_id: payload.cart_id,
      customer_name: payload.customer_name,
      customer_email: payload.customer_email,
      customer_phone: payload.customer_phone,
      mode,
      installments: payload.installments,
      frequency: payload.frequency,
      frequency_type: payload.frequency_type,
      msi_option: mode === "partial" ? (payload.msi_option ?? 1) : undefined,
      scheduled_for: payload.scheduled_for ?? null,
      fulfillment_method: payload.fulfillment_method,
      payment_method: payload.payment_method,
      pickup_point_id: payload.pickup_point_id,
      delivery: payload.delivery,
      accept_terms: payload.accept_terms,
      accept_recurring_mandate: payload.accept_recurring_mandate,
      marketing_opt_in: payload.marketing_opt_in,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof (data as { error?: string }).error === "string"
        ? (data as { error: string }).error
        : res.statusText,
    );
  }
  return {
    subscription_id: (data as { subscription_id?: string }).subscription_id ?? "",
    order_id: (data as { order_id: string }).order_id,
    init_point:
      (data as { payment_link?: string; redirect_url?: string }).payment_link ??
      (data as { redirect_url: string }).redirect_url,
    redirect_url:
      (data as { redirect_url?: string; payment_link?: string }).redirect_url ??
      (data as { payment_link: string }).payment_link,
  };
}
