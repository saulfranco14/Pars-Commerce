"use client";

import { useState } from "react";
import { addProduct, updateQuantity, removeItem } from "@/features/prestamos/helpers/loanItems";
import type { LoanItem } from "@/features/prestamos/interfaces/loanForm";
import type { ProductListItem } from "@/types/products";

export function useLoanItems() {
  const [items, setItems] = useState<LoanItem[]>([]);

  const total = items.reduce((s, i) => s + i.subtotal, 0);

  function handleAddProduct(product: ProductListItem) {
    setItems((prev) => addProduct(prev, product));
  }

  function handleQuantityChange(index: number, qty: number) {
    setItems((prev) => updateQuantity(prev, index, qty));
  }

  function handleRemove(index: number) {
    setItems((prev) => removeItem(prev, index));
  }

  return { items, total, handleAddProduct, handleQuantityChange, handleRemove };
}
