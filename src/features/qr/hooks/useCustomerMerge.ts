"use client";

import { useState } from "react";

import {
  fetchMergeableTables,
  requestTableMerge,
  respondToMergeRequest,
  type MergeableTable,
} from "@/features/qr/services/tableClientService";

interface UseCustomerMergeParams {
  orderId: string;
  fingerprint: string;
  onMerged?: () => void | Promise<void>;
}

/**
 * Customer-side "combine tables" flow: load the other active tables of the
 * business and merge one into the current bill. Components stay presentational.
 */
export function useCustomerMerge({
  orderId,
  fingerprint,
  onMerged,
}: UseCustomerMergeParams) {
  const [candidates, setCandidates] = useState<MergeableTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCandidates() {
    if (!orderId || !fingerprint) return;
    setLoading(true);
    setError(null);
    try {
      setCandidates(await fetchMergeableTables({ orderId, fingerprint }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pudimos cargar las mesas.",
      );
    } finally {
      setLoading(false);
    }
  }

  // Sends the request (does NOT merge yet — the other table must approve).
  async function requestMerge(secondaryOrderId: string) {
    if (!orderId || !fingerprint) return false;
    setMerging(true);
    setError(null);
    try {
      await requestTableMerge({ orderId, secondaryOrderId, fingerprint });
      if (onMerged) await onMerged();
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo enviar la solicitud.",
      );
      return false;
    } finally {
      setMerging(false);
    }
  }

  // Owner approves/declines, or requester cancels their own request.
  async function respond(
    requestId: string,
    decision: "approved" | "declined" | "cancelled",
  ) {
    if (!fingerprint) return false;
    setMerging(true);
    setError(null);
    try {
      await respondToMergeRequest({ requestId, decision, fingerprint });
      if (onMerged) await onMerged();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo procesar la respuesta.",
      );
      return false;
    } finally {
      setMerging(false);
    }
  }

  return {
    candidates,
    loading,
    merging,
    error,
    resetError: () => setError(null),
    loadCandidates,
    requestMerge,
    respond,
  };
}
