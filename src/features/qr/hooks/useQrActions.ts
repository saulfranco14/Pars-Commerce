"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";

import {
  updateQrCode,
  archiveQrCode,
} from "@/features/qr/services/qrCodesService";
import { buildQrCodesKey } from "@/features/qr/helpers/buildQrKey";

import type { QrCode } from "@/features/qr/interfaces/qrCode";
import type { QrKind } from "@/features/qr/constants/qrKinds";

interface UpdateQrInput {
  label?: string;
  table_capacity?: number | null;
  preset_amount?: number | null;
  preset_concept?: string | null;
}

export function useQrActions(tenantId: string | null) {
  const { mutate } = useSWRConfig();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function revalidateAll(kind?: QrKind) {
    if (!tenantId) return;
    await mutate(buildQrCodesKey(tenantId));
    if (kind) await mutate(buildQrCodesKey(tenantId, kind));
    else {
      await mutate(buildQrCodesKey(tenantId, "table"));
      await mutate(buildQrCodesKey(tenantId, "payment"));
    }
  }

  async function toggleActive(qr: QrCode): Promise<QrCode | null> {
    if (!tenantId) return null;
    setBusyId(qr.id);
    setError(null);
    try {
      const updated = await updateQrCode({
        id: qr.id,
        tenant_id: tenantId,
        is_active: !qr.is_active,
      });
      await revalidateAll(qr.kind);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el QR");
      return null;
    } finally {
      setBusyId(null);
    }
  }

  async function archive(qr: QrCode): Promise<boolean> {
    if (!tenantId) return false;
    setBusyId(qr.id);
    setError(null);
    try {
      await archiveQrCode(tenantId, qr.id);
      await revalidateAll(qr.kind);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo archivar el QR");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function update(qr: QrCode, patch: UpdateQrInput): Promise<QrCode | null> {
    if (!tenantId) return null;
    setBusyId(qr.id);
    setError(null);
    try {
      const updated = await updateQrCode({
        id: qr.id,
        tenant_id: tenantId,
        ...patch,
      });
      await revalidateAll(qr.kind);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el QR");
      return null;
    } finally {
      setBusyId(null);
    }
  }

  return {
    toggleActive,
    archive,
    update,
    busyId,
    error,
    resetError: () => setError(null),
  };
}
