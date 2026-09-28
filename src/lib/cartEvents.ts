const CART_UPDATED = "cart-updated";

export type CartUpdatedDetail = { label?: string };

export function dispatchCartUpdated(detail?: CartUpdatedDetail): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<CartUpdatedDetail>(CART_UPDATED, { detail }));
  }
}

export function getCartUpdatedEventName(): string {
  return CART_UPDATED;
}
