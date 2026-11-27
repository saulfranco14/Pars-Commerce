"use client";
import { useEffect, useState } from "react";

/**
 * Whether Crear also asks the AI for a new image. On by default when the
 * business has Tlacos; the choice is remembered on this device only.
 */
export function useStudioAiPreference(
  tenantId: string,
  available: boolean,
): [boolean, (on: boolean) => void] {
  const key = `tlaco:studio:ai:${tenantId}`,
    [stored, setStored] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setStored(raw === "1");
    } catch {
      /* Without browser storage the default applies. */
    }
  }, [key]);
  function set(on: boolean) {
    setStored(on);
    try {
      localStorage.setItem(key, on ? "1" : "0");
    } catch {
      /* The choice still applies on this visit. */
    }
  }
  return [available && (stored ?? true), set];
}
