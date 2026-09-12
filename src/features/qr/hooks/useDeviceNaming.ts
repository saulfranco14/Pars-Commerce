"use client";

import { useState } from "react";

import { setDeviceName } from "@/features/qr/helpers/deviceFingerprint";

interface UseDeviceNamingParams {
  qrToken: string;
  initialName: string | null;
}

interface UseDeviceNamingResult {
  deviceName: string | null;
  submitting: boolean;
  error: string | null;
  confirm: (name: string) => Promise<void>;
}

/**
 * Manages the customer's display_name lifecycle:
 *  - holds the active name in state
 *  - persists it locally while the customer explores the menu
 *  - the name reaches the server only with their first submitted product
 */
export function useDeviceNaming({
  qrToken,
  initialName,
}: UseDeviceNamingParams): UseDeviceNamingResult {
  const [deviceName, setDeviceNameState] = useState<string | null>(initialName);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm(name: string) {
    setSubmitting(true);
    setError(null);
    try {
      setDeviceName(qrToken, name);
      setDeviceNameState(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el nombre");
    } finally {
      setSubmitting(false);
    }
  }

  return { deviceName, submitting, error, confirm };
}
