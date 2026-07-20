/**
 * Pure helpers for the bill summary. Grouping and label resolution live here
 * (not inside the component's render/map) so they run once per data change, keep
 * a single responsibility, and stay unit-testable. No React, no side effects.
 */

import type {
  BillDevice,
  BillItem,
  PersonItemsGroup,
} from "@/features/qr/interfaces/billSummary";

const SHARED_KEY = "__shared__";
const SHARED_COLOR = "#94a3b8";

/** Resolve a person's display label, color and "is it me" for a device id. */
export function resolveDeviceLabel(
  deviceId: string | null,
  devices: BillDevice[],
  currentDeviceId: string | null,
): { label: string; color: string; isMine: boolean } {
  if (!deviceId) {
    return { label: "Compartido", color: SHARED_COLOR, isMine: false };
  }
  const index = devices.findIndex((d) => d.id === deviceId);
  const device = index >= 0 ? devices[index] : undefined;
  const fallback = `Cliente ${index >= 0 ? index + 1 : ""}`.trim();
  return {
    label: device?.display_name?.trim() || fallback,
    color: device?.color_hex ?? SHARED_COLOR,
    isMine: currentDeviceId === deviceId,
  };
}

/**
 * Group items by the person who ordered them, preserving first-seen order, each
 * with a per-person subtotal. Keeps a long multi-person bill scannable instead
 * of one flat list (the Uber/Rappi split view).
 */
export function groupItemsByPerson(
  items: BillItem[],
  devices: BillDevice[],
  currentDeviceId: string | null,
): PersonItemsGroup[] {
  const order: string[] = [];
  const byKey = new Map<string, BillItem[]>();

  for (const item of items) {
    const key = item.added_by_device_id ?? SHARED_KEY;
    const bucket = byKey.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      byKey.set(key, [item]);
      order.push(key);
    }
  }

  return order.map((key) => {
    const groupItems = byKey.get(key)!;
    const { label, color, isMine } = resolveDeviceLabel(
      key === SHARED_KEY ? null : key,
      devices,
      currentDeviceId,
    );
    const subtotal = groupItems.reduce((sum, i) => sum + Number(i.subtotal), 0);
    return { key, items: groupItems, label, color, isMine, subtotal };
  });
}

/** True when the bill spans more than one origin table (i.e. after a merge). */
export function isMergedBill(items: BillItem[]): boolean {
  const labels = new Set(
    items.map((i) => i.origin_table_label).filter(Boolean),
  );
  return labels.size > 1;
}
