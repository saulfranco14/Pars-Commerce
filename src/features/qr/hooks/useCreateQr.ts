"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";

import { createQrCode } from "@/features/qr/services/qrCodesService";
import { buildQrCodesKey } from "@/features/qr/helpers/buildQrKey";

import type { QrCode } from "@/features/qr/interfaces/qrCode";

interface CreateQrInput {
  tenant_id: string;
  kind: "payment" | "table";
  label: string;
  table_capacity?: number | null;
  preset_amount?: number | null;
}

export function useCreateQr(tenantId: string | null) {
  const { mutate } = useSWRConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(input: CreateQrInput): Promise<QrCode | null> {
    setLoading(true);
    setError(null);
    try {
      const qr = await createQrCode(input);
      if (tenantId) {
        // Revalidate both the global list and the kind-filtered list.
        await mutate(buildQrCodesKey(tenantId));
        await mutate(buildQrCodesKey(tenantId, input.kind));
      }
      return qr;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo crear el QR";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { create, loading, error, resetError: () => setError(null) };
}
