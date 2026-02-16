"use client";

import { useEffect } from "react";
import { useCartContext } from "../CartProvider";

export function ClearCartOnConfirm() {
  const { mutate } = useCartContext();
  useEffect(() => {
    mutate();
  }, [mutate]);
  return null;
}
