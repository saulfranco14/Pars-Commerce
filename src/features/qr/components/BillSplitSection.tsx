"use client";

import { Users } from "lucide-react";

import { SplitItemsAssigner } from "@/features/qr/components/SplitItemsAssigner";
import { SplitModePicker } from "@/features/qr/components/SplitModePicker";

import type { AssignedGroup } from "@/features/qr/components/SplitItemsAssigner";
import type { SplitMode } from "@/features/qr/interfaces/splitBill";

interface BillItem {
  id: string;
  product_name: string;
  quantity: number;
  subtotal: number;
}

interface BillSplitSectionProps {
  mode: SplitMode;
  onModeChange: (mode: SplitMode) => void;
  peopleCount: number;
  onPeopleCountChange: (value: number) => void;
  onItemsAssignmentChange: (groups: AssignedGroup[]) => void;
  items: BillItem[];
  deviceCount: number;
  orderTotal: number;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
}

/**
 * Pure presentational section that owns the split-bill controls. State and
 * service calls live in `useSplitBill` — the page wires them.
 */
export function BillSplitSection({
  mode,
  onModeChange,
  peopleCount,
  onPeopleCountChange,
  onItemsAssignmentChange,
  items,
  deviceCount,
  orderTotal,
  submitting,
  error,
  onSubmit,
}: BillSplitSectionProps) {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Dividir cuenta</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Elijan cómo repartir el total.
        </p>
      </div>

      <SplitModePicker mode={mode} onChange={onModeChange} />

      {mode === "by_device" && (
        <p className="rounded-lg bg-border-soft/40 px-3 py-2 text-xs text-muted-foreground">
          Se dividirá según quién pidió cada producto. Hay{" "}
          <strong>{deviceCount}</strong> persona
          {deviceCount === 1 ? "" : "s"} conectada
          {deviceCount === 1 ? "" : "s"}.
        </p>
      )}

      {mode === "equal" && (
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">
            ¿Entre cuántas personas?
          </span>
          <input
            type="number"
            min={2}
            max={30}
            value={peopleCount}
            onChange={(e) => onPeopleCountChange(Number(e.target.value))}
            className="w-full rounded-lg border border-border px-3 py-2 text-base"
          />
          <span className="block text-xs text-muted-foreground">
            Cada uno pagará $
            {(orderTotal / Math.max(2, peopleCount)).toFixed(2)}
          </span>
        </label>
      )}

      {mode === "items" && (
        <SplitItemsAssigner
          items={items}
          onChange={onItemsAssignmentChange}
        />
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Users className="h-4 w-4" />
        {submitting ? "Dividiendo..." : "Confirmar división"}
      </button>
    </section>
  );
}
