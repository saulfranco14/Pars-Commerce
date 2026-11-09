"use client";
import { useRef, useState } from "react";
import useSWR from "swr";
import { useSchemaForm } from "@/lib/forms/useSchemaForm";
import {
  loadStudioPlatform,
  adjustCredits,
  reconcileStudioOperations,
  resolveCreditReview,
} from "../services/studioClientService";
import type { FieldSchema } from "@/lib/forms/fieldSchema";
const fields: FieldSchema[] = [
  { name: "tenant_id", label: "ID del negocio", type: "text", required: true },
  {
    name: "amount",
    label: "Tlacos de ajuste",
    type: "number",
    required: true,
    yupNumber: (b) => b.integer().min(1).max(500),
  },
  {
    name: "reason",
    label: "Motivo del ajuste",
    type: "text",
    required: true,
    yupString: (b) => b.min(10).max(300),
  },
];
const resolutionFields = fields.filter((field) => field.name !== "amount");
export function useStudioPlatform() {
  const { data, isLoading, error, mutate } = useSWR(
      "studio-platform",
      loadStudioPlatform,
    ),
    key = useRef<{ signature: string; key: string } | null>(null);
  const form = useSchemaForm<{
    tenant_id: string;
    amount: number;
    reason: string;
  }>(fields, async (values) => {
    const signature = JSON.stringify(values);
    if (key.current?.signature !== signature)
      key.current = { signature, key: crypto.randomUUID() };
    await adjustCredits({ ...values, idempotency_key: key.current.key });
    key.current = null;
    await mutate();
  });
  const resolutionKey = useRef<{ signature: string; key: string } | null>(null),
    [reviewResolved, setReviewResolved] = useState(false);
  const resolutionForm = useSchemaForm<{ tenant_id: string; reason: string }>(
    resolutionFields,
    async (values) => {
      const signature = JSON.stringify(values);
      if (resolutionKey.current?.signature !== signature)
        resolutionKey.current = { signature, key: crypto.randomUUID() };
      await resolveCreditReview({
        ...values,
        idempotency_key: resolutionKey.current.key,
      });
      resolutionKey.current = null;
      setReviewResolved(true);
      await mutate();
    },
  );
  const [reconciling, setReconciling] = useState(false),
    [reconcileError, setReconcileError] = useState<string | null>(null),
    [reconciled, setReconciled] = useState(false);
  async function reconcile() {
    if (reconciling) return;
    setReconciling(true);
    setReconcileError(null);
    setReconciled(false);
    try {
      await reconcileStudioOperations();
      await mutate();
      setReconciled(true);
    } catch (e) {
      setReconcileError(
        e instanceof Error
          ? e.message
          : "La conciliación continuará en su próximo turno.",
      );
    } finally {
      setReconciling(false);
    }
  }
  return {
    data,
    isLoading,
    error,
    mutate,
    form,
    resolutionForm,
    reviewResolved,
    reconciling,
    reconcileError,
    reconciled,
    reconcile,
  };
}
