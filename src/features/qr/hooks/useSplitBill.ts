"use client";

import { useState } from "react";

import { submitSplit } from "@/features/qr/services/tableClientService";

import type { SplitMode } from "@/features/qr/interfaces/splitBill";
import type { AssignedGroup } from "@/features/qr/components/SplitItemsAssigner";

interface UseSplitBillOptions {
  orderId: string;
  onSubmitted?: () => void | Promise<void>;
}

/**
 * Owns the split-bill form state (mode, people, assigned items) and the
 * submission flow. The bill page just renders the controls and calls
 * `submit()`; this hook handles the service call, loading and error state.
 */
export function useSplitBill({ orderId, onSubmitted }: UseSplitBillOptions) {
  const [mode, setMode] = useState<SplitMode>("by_device");
  const [peopleCount, setPeopleCount] = useState(2);
  const [assignedGroups, setAssignedGroups] = useState<AssignedGroup[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "items") {
        const nonEmpty = assignedGroups.filter((g) => g.item_ids.length > 0);
        if (nonEmpty.length < 2) {
          throw new Error("Asigna productos a al menos 2 personas.");
        }
        await submitSplit({ orderId, mode, groups: nonEmpty });
      } else if (mode === "equal") {
        await submitSplit({ orderId, mode, peopleCount });
      } else {
        await submitSplit({ orderId, mode });
      }
      if (onSubmitted) await onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    /* form state */
    mode,
    setMode,
    peopleCount,
    setPeopleCount,
    assignedGroups,
    setAssignedGroups,
    /* submission */
    submit,
    submitting,
    error,
  };
}
