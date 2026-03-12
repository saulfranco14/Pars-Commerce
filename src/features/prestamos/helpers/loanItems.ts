import type { LoanItem } from "@/features/prestamos/interfaces/loanForm";
import type { ProductListItem } from "@/types/products";

export function addProduct(prev: LoanItem[], product: ProductListItem): LoanItem[] {
  const existing = prev.findIndex((i) => i.product.id === product.id);
  if (existing >= 0) {
    return prev.map((item, idx) =>
      idx === existing
        ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
        : item
    );
  }
  const unitPrice = Number(product.price);
  return [...prev, { product, quantity: 1, unitPrice, subtotal: unitPrice }];
}

export function updateQuantity(items: LoanItem[], index: number, qty: number): LoanItem[] {
  return items.map((item, idx) =>
    idx === index ? { ...item, quantity: qty, subtotal: qty * item.unitPrice } : item
  );
}

export function removeItem(items: LoanItem[], index: number): LoanItem[] {
  return items.filter((_, idx) => idx !== index);
}

export function deriveConcept(items: LoanItem[], manualConcept: string): string {
  if (manualConcept.trim()) return manualConcept.trim();
  if (items.length === 0) return "";
  return items
    .map((i) => `${i.product.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}`)
    .join(", ");
}
