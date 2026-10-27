"use client";

import { useEffect, useState } from "react";

import type { StoreNavigationBarProps } from "@/features/sitio/interfaces/storeNavigation";

const FINISH_MS = 320;

export function StoreNavigationBar({ active }: StoreNavigationBarProps) {
  const [wasActive, setWasActive] = useState(active);
  const [finishing, setFinishing] = useState(false);
  if (wasActive !== active) {
    setWasActive(active);
    setFinishing(!active);
  }

  useEffect(() => {
    if (!finishing) return;
    const timer = window.setTimeout(() => setFinishing(false), FINISH_MS);
    return () => window.clearTimeout(timer);
  }, [finishing]);

  if (!active && !finishing) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-70 h-0.75">
      <div className={`h-full origin-left bg-accent ${active ? "store-progress-loading" : "store-progress-done"}`} />
    </div>
  );
}
