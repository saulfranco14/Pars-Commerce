"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "serwist" in window) {
      (window as Window & { serwist?: { register: () => Promise<void> } }).serwist?.register();
    }
  }, []);
  return null;
}
