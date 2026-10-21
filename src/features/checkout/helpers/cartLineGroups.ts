import { roundMoney } from "@/lib/offers/pricing";

import type { PublicCartItem } from "@/types/cart";

export interface CartPackEntry {
  kind: "pack";
  groupId: string;
  lines: PublicCartItem[];
  packs: number;
  name: string;
  total: number;
  listTotal: number;
}

export type CartEntry = { kind: "line"; item: PublicCartItem } | CartPackEntry;

function lineTotal(item: PublicCartItem): number {
  return Number(item.price_snapshot) * item.quantity;
}

function lineListTotal(item: PublicCartItem): number {
  const list = item.list_unit_price == null ? Number(item.price_snapshot) : Number(item.list_unit_price);
  return list * item.quantity;
}

export function packCount(line: PublicCartItem): number {
  return Math.max(1, Math.round(line.quantity / (line.group_unit_quantity ?? 1)));
}

/** Keeps cart order; a pack shows up where its first line was. */
export function groupCartLines(items: PublicCartItem[]): CartEntry[] {
  const entries: CartEntry[] = [];
  const packs = new Map<string, CartPackEntry>();
  for (const item of items) {
    if (!item.group_id) {
      entries.push({ kind: "line", item });
      continue;
    }
    let pack = packs.get(item.group_id);
    if (!pack) {
      pack = { kind: "pack", groupId: item.group_id, lines: [], packs: packCount(item), name: item.promotion?.name ?? "Paquete", total: 0, listTotal: 0 };
      packs.set(item.group_id, pack);
      entries.push(pack);
    }
    pack.lines.push(item);
    pack.total = roundMoney(pack.total + lineTotal(item));
    pack.listTotal = roundMoney(pack.listTotal + lineListTotal(item));
  }
  return entries;
}

/** Mirrors `setLineQuantity`: a grouped line moves its whole group one pack at a time. */
export function applyLineQuantity(items: PublicCartItem[], itemId: string, quantity: number): PublicCartItem[] {
  const target = items.find((item) => item.id === itemId);
  if (!target) return items;
  if (!target.group_id) return items.map((item) => (item.id === itemId ? { ...item, quantity } : item));

  const packs = packCount(target);
  const nextPacks = quantity > target.quantity ? packs + 1 : quantity < target.quantity ? packs - 1 : packs;
  if (nextPacks < 1) return removeCartLine(items, itemId);
  return items.map((item) =>
    item.group_id === target.group_id ? { ...item, quantity: (item.group_unit_quantity ?? 1) * nextPacks } : item,
  );
}

export function removeCartLine(items: PublicCartItem[], itemId: string): PublicCartItem[] {
  const target = items.find((item) => item.id === itemId);
  if (!target) return items;
  return items.filter((item) => (target.group_id ? item.group_id !== target.group_id : item.id !== itemId));
}

export function cartTotals(items: PublicCartItem[]) {
  return {
    subtotal: roundMoney(items.reduce((sum, item) => sum + lineTotal(item), 0)),
    savings: roundMoney(items.reduce((sum, item) => sum + Math.max(0, lineListTotal(item) - lineTotal(item)), 0)),
    itemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}
