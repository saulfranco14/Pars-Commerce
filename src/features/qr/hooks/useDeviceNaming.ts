"use client";

import { useState } from "react";

import { setDeviceName } from "@/features/qr/helpers/deviceFingerprint";
import { setMyDeviceName } from "@/features/qr/services/tableClientService";

interface UseDeviceNamingParams {
  qrToken: string;
  fingerprint: string;
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
 *  - persists it to localStorage (so refresh inside the same order keeps it)
 *  - calls `/api/qr/table/device` to write it server-side
 */
export function useDeviceNaming({
  qrToken,
  fingerprint,
  initialName,
}: UseDeviceNamingParams): UseDeviceNamingResult {
  const [deviceName, setDeviceNameState] = useState<string | null>(initialName);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm(name: string) {
    setSubmitting(true);
    setError(null);
    try {
      await setMyDeviceName({ qrToken, fingerprint, displayName: name });
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
