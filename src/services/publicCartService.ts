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
  fingerprintId: string
): Promise<{ success: boolean; cart_id: string }> {
  const res = await fetch("/api/public-cart", {
    method: "POST",
    headers: getHeaders(fingerprintId),
    body: JSON.stringify({
      tenant_id: tenantId,
      product_id: productId,
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

export async function updateItemQuantity(
  cartId: string,
  productId: string,
  quantity: number,
  fingerprintId: string
): Promise<void> {
  const res = await fetch("/api/public-cart", {
    method: "PATCH",
    headers: getHeaders(fingerprintId),
    body: JSON.stringify({
      cart_id: cartId,
      product_id: productId,
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
  productId: string,
  fingerprintId: string
): Promise<void> {
  const url = `/api/public-cart?cart_id=${encodeURIComponent(cartId)}&product_id=${encodeURIComponent(productId)}`;
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
