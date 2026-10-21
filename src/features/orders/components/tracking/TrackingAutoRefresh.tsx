"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const REFRESH_MS = 15_000;

/** Keeps a live tracking page current while the order is still moving, like the table screen. */
export function TrackingAutoRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [active, router]);
  return null;
}
