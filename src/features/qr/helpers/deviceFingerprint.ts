"use client";

const STORAGE_PREFIX = "pars_qr_fingerprint_";

/**
 * Returns (and persists) a per-QR fingerprint. Each scanned QR token gets its
 * own UUID stored in localStorage so the device is consistently identified
 * across reloads but cannot be linked across different mesas.
 */
export function getOrCreateFingerprint(token: string): string {
  if (typeof window === "undefined") return "";
  const key = STORAGE_PREFIX + token;
  let value = window.localStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    window.localStorage.setItem(key, value);
  }
  return value;
}

const NAME_KEY = "pars_qr_device_name_";
const LAST_ORDER_KEY = "pars_qr_last_order_";

export function getDeviceName(token: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(NAME_KEY + token);
}

export function setDeviceName(token: string, name: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NAME_KEY + token, name.trim());
}

export function clearDeviceName(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(NAME_KEY + token);
}

/**
 * Tracks the last order id this fingerprint joined for a given QR token.
 * Used to detect "session reuse" — when the QR rolls to a fresh order, we
 * must wipe the cached display_name so the new customer is asked again.
 */
export function getLastOrderId(token: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_ORDER_KEY + token);
}

export function setLastOrderId(token: string, orderId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_ORDER_KEY + token, orderId);
}

const READY_SEEN_KEY = "pars_qr_ready_seen_";

/**
 * Whether the "your order is ready" celebration was ALREADY shown for this
 * order on this device. Persisted per order id so it fires exactly once — not
 * every time the customer re-enters the screen (that was noisy).
 */
export function hasSeenReady(orderId: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(READY_SEEN_KEY + orderId) === "1";
}

export function markReadySeen(orderId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(READY_SEEN_KEY + orderId, "1");
}

/**
 * A new batch regressed the state (ready → received): forget the celebration
 * so the NEXT "ready" announces again — once per ready-cycle, never on mere
 * screen re-entry.
 */
export function clearReadySeen(orderId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(READY_SEEN_KEY + orderId);
}
