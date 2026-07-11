"use client";

import { Notification } from "@/components/ui/Notification";
import { SplitItemsAssigner } from "@/features/qr/components/SplitItemsAssigner";
import { SplitModePicker } from "@/features/qr/components/SplitModePicker";
import { formatCurrency } from "@/features/qr/helpers/format";

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
  error: string | null;
}

/**
 * Pure presentational section with the split-bill controls (mode picker +
 * per-mode inputs). The "Confirmar división" CTA lives in the page's fixed
 * footer, so it stays visible no matter how many items the bill has. State and
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
  error,
}: BillSplitSectionProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div>
        <h2 className="text-base font-bold text-foreground">Dividir cuenta</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Elijan cómo repartir el total.
        </p>
      </div>

      <SplitModePicker mode={mode} onChange={onModeChange} />

      {mode === "by_device" && (
        <p className="rounded-xl bg-border-soft/40 px-3 py-2.5 text-xs text-muted-foreground">
          Se dividirá según quién pidió cada producto. Hay{" "}
          <strong className="text-foreground">{deviceCount}</strong> persona
          {deviceCount === 1 ? "" : "s"} conectada
          {deviceCount === 1 ? "" : "s"}.
        </p>
      )}

      {mode === "equal" && (
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            ¿Entre cuántas personas?
          </span>
          <input
            type="number"
            min={2}
            max={30}
            value={peopleCount}
            onChange={(e) => onPeopleCountChange(Number(e.target.value))}
            className="block w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-base font-medium text-foreground transition-colors focus:border-accent focus:outline-none"
          />
          <span className="mt-1.5 block text-xs text-muted-foreground">
            Cada uno pagará{" "}
            <strong className="text-foreground">
              {formatCurrency(orderTotal / Math.max(2, peopleCount))}
            </strong>
          </span>
        </label>
      )}

      {mode === "items" && (
        <SplitItemsAssigner items={items} onChange={onItemsAssignmentChange} />
      )}

      {error && <Notification tone="error" message={error} />}
    </section>
  );
}
