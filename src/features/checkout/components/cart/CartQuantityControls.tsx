"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

const STEP_BUTTON =
  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300/30 disabled:cursor-not-allowed disabled:opacity-40";

interface CartQuantityControlsProps {
  value: number;
  unitLabel?: string;
  onDecrement: () => void;
  onIncrement: () => void;
  onRemove: () => void;
  removeLabel?: string;
}

export function CartQuantityControls({
  value,
  unitLabel,
  onDecrement,
  onIncrement,
  onRemove,
  removeLabel = "Eliminar",
}: CartQuantityControlsProps) {
  return (
    <div className="flex min-h-11 items-center gap-1">
      <button type="button" onClick={onDecrement} disabled={value <= 1} className={STEP_BUTTON} aria-label="Reducir cantidad">
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-8 px-2 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {value}
        {unitLabel ? <span className="ml-1 font-normal text-gray-500">{unitLabel}</span> : null}
      </span>
      <button type="button" onClick={onIncrement} className={STEP_BUTTON} aria-label="Aumentar cantidad">
        <Plus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="ml-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/20"
        aria-label={removeLabel}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
