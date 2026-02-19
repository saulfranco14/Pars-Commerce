"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "pars_cart_fingerprint";

function getOrCreateFingerprint(): string {
  if (typeof window === "undefined") return "";
  try {
    let stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      stored =
        crypto.randomUUID?.() ??
        `fp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(STORAGE_KEY, stored);
    }
    return stored;
  } catch {
    return `fp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export function useFingerprint(): string {
  const [fp, setFp] = useState("");
  useEffect(() => {
    setFp(getOrCreateFingerprint());
  }, []);
  return fp;
}
