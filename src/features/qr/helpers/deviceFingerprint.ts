"use client";

const STORAGE_PREFIX = "tlaco_qr_fingerprint_";
const KIOSK_HANDOFF_KEY = "tlaco_qr_kiosk_handoff_v1";
const KIOSK_HANDOFF_TTL_MS = 12 * 60 * 60 * 1000;

export interface KioskHandoff {
  ticketToken: string;
  orderId: string;
  tenantId: string;
  createdAt: number;
}

/**
 * The kiosk ticket is an opaque, unguessable proof the customer already has
 * in their browser. Keep only one short-lived handoff so scanning a table on
 * the same phone can OFFER to attach the order without identifying people
 * across unrelated QR codes.
 */
export function saveKioskHandoff(handoff: Omit<KioskHandoff, "createdAt">): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      KIOSK_HANDOFF_KEY,
      JSON.stringify({ ...handoff, createdAt: Date.now() }),
    );
  } catch {
    // Storage is an enhancement; the ticket itself still works without it.
  }
}

export function getKioskHandoff(tenantId?: string): KioskHandoff | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KIOSK_HANDOFF_KEY);
    if (!raw) return null;
    const handoff = JSON.parse(raw) as KioskHandoff;
    const valid =
      typeof handoff.ticketToken === "string" &&
      typeof handoff.orderId === "string" &&
      typeof handoff.tenantId === "string" &&
      typeof handoff.createdAt === "number" &&
      Date.now() - handoff.createdAt < KIOSK_HANDOFF_TTL_MS &&
      (!tenantId || handoff.tenantId === tenantId);
    if (!valid) {
      window.localStorage.removeItem(KIOSK_HANDOFF_KEY);
      return null;
    }
    return handoff;
  } catch {
    return null;
  }
}

export function clearKioskHandoff(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KIOSK_HANDOFF_KEY);
}

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

const NAME_KEY = "tlaco_qr_device_name_";
const LAST_ORDER_KEY = "tlaco_qr_last_order_";

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

const READY_SEEN_KEY = "tlaco_qr_ready_seen_";

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
