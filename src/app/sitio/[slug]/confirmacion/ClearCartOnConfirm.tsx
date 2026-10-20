"use client";

import { useEffect } from "react";
import { useCartContext } from "@/features/sitio/components/cart/CartProvider";

export function ClearCartOnConfirm() {
  const { mutate } = useCartContext();
  useEffect(() => {
    mutate();
  }, [mutate]);
  return null;
}
