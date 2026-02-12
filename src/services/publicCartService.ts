export interface PublicCartItem {
  id: string;
  product_id: string;
  quantity: number;
  price_snapshot: number;
  product?: {
    id: string;
    name: string;
    slug: string | null;
    image_url: string | null;
  };
}

export interface PublicCartResponse {
  cart: { id: string; tenant_id: string } | null;
  items: PublicCartItem[];
  subtotal: number;
  items_count: number;
}

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
