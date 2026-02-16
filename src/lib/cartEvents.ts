const CART_UPDATED = "cart-updated";

export function dispatchCartUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CART_UPDATED));
  }
}

export function getCartUpdatedEventName(): string {
  return CART_UPDATED;
}
