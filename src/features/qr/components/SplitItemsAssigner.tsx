"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { formatCurrency } from "@/features/qr/helpers/format";

interface AssignableItem {
  id: string;
  product_name: string;
  quantity: number;
  subtotal: number;
}

export interface AssignedGroup {
  label: string;
  item_ids: string[];
}

interface SplitItemsAssignerProps {
  items: AssignableItem[];
  initialGroups?: number;
  onChange: (groups: AssignedGroup[]) => void;
}

export function SplitItemsAssigner({
  items,
  initialGroups = 2,
  onChange,
}: SplitItemsAssignerProps) {
  const [groupCount, setGroupCount] = useState(
    Math.max(2, Math.min(initialGroups, 6)),
  );
  // assignment: itemId -> groupIndex (0-based). Unassigned = -1.
  const [assignment, setAssignment] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    items.forEach((i) => (initial[i.id] = -1));
    return initial;
  });

  function emit(nextAssignment: Record<string, number>, count: number) {
    const groups: AssignedGroup[] = Array.from({ length: count }, (_, idx) => ({
      label: `Persona ${idx + 1}`,
      item_ids: Object.entries(nextAssignment)
        .filter(([, g]) => g === idx)
        .map(([id]) => id),
    }));
    onChange(groups);
  }

  function assign(itemId: string, group: number) {
    const next = { ...assignment, [itemId]: group };
    setAssignment(next);
    emit(next, groupCount);
  }

  function addGroup() {
    if (groupCount >= 6) return;
    const next = groupCount + 1;
    setGroupCount(next);
    emit(assignment, next);
  }

  function removeGroup() {
    if (groupCount <= 2) return;
    const next = groupCount - 1;
    // Unassign items that were in the removed group.
    const cleaned = { ...assignment };
    for (const key of Object.keys(cleaned)) {
      if (cleaned[key] >= next) cleaned[key] = -1;
    }
    setGroupCount(next);
    setAssignment(cleaned);
    emit(cleaned, next);
  }

  const groupTotals = Array.from({ length: groupCount }, (_, idx) =>
    items.reduce(
      (acc, item) => acc + (assignment[item.id] === idx ? item.subtotal : 0),
      0,
    ),
  );

  const unassignedCount = items.filter((i) => assignment[i.id] === -1).length;

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Asignar items a cada persona
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Selecciona a quién pertenece cada producto.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-background px-1.5 py-0.5">
          <button
            type="button"
            onClick={removeGroup}
            disabled={groupCount <= 2}
            aria-label="Quitar persona"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full hover:bg-border-soft/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-12 text-center text-xs font-semibold text-foreground">
            {groupCount} pers.
          </span>
          <button
            type="button"
            onClick={addGroup}
            disabled={groupCount >= 6}
            aria-label="Agregar persona"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full hover:bg-border-soft/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {groupTotals.map((total, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-border bg-border-soft/30 px-2 py-1.5 text-center"
          >
            <p className="text-[10px] font-medium text-muted-foreground">
              Persona {idx + 1}
            </p>
            <p className="text-sm font-bold text-foreground">
              {formatCurrency(total)}
            </p>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Aún no hay productos en la cuenta.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => {
            const current = assignment[item.id];
            return (
              <li
                key={item.id}
                className="rounded-lg border border-border bg-surface p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {item.quantity}× {item.product_name}
                  </p>
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Array.from({ length: groupCount }).map((_, idx) => {
                    const isSelected = current === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => assign(item.id, idx)}
                        className={`min-h-[32px] cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors
                          ${isSelected
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border bg-surface text-foreground hover:bg-border-soft/40"}
                        `}
                      >
                        P{idx + 1}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {unassignedCount > 0 && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Faltan asignar {unassignedCount} producto{unassignedCount === 1 ? "" : "s"}.
        </p>
      )}
    </section>
  );
}
