"use client";

import Image from "next/image";
import { CalendarClock, Check, Package, Sparkles } from "lucide-react";

import { TouchStepper } from "@/components/ui/TouchStepper";

import { formatCurrency } from "@/features/qr/helpers/format";

import type { PickerItem } from "@/features/promociones/interfaces/offerWizard";

export type PickerMode = "multi" | "single" | "quantity";

interface ProductPickerGridProps {
  entries: { item: PickerItem; suggested: boolean }[];
  mode: PickerMode;
  /** Selected item id → quantity (1 for multi/single). */
  selected: Map<string, number>;
  onChange: (itemId: string, quantity: number) => void;
}

export function ProductPickerGrid({ entries, mode, selected, onChange }: ProductPickerGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {entries.map(({ item, suggested }) => {
        const quantity = selected.get(item.id) ?? 0;
        const isSelected = quantity > 0;
        const FallbackIcon = item.type === "service" ? CalendarClock : Package;
        return (
          <li key={item.id} className="flex flex-col gap-2">
            <button
              type="button"
              role={mode === "single" ? "radio" : "checkbox"}
              aria-checked={isSelected}
              onClick={() => onChange(item.id, isSelected && mode !== "quantity" ? 0 : Math.max(1, quantity + (isSelected ? 1 : 0)))}
              className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-surface text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isSelected ? "border-accent ring-2 ring-accent" : "border-border hover:border-accent/40"
              }`}
            >
              <span className="relative block aspect-square bg-border-soft/50">
                {item.image_url ? (
                  <Image src={item.image_url} alt="" fill sizes="(max-width: 640px) 45vw, 200px" className="object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center">
                    <FallbackIcon className="h-8 w-8 text-muted-foreground/50" aria-hidden />
                  </span>
                )}
                {suggested ? (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-surface/95 px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-sm">
                    <Sparkles className="h-3 w-3 text-accent" aria-hidden />
                    Sugerido
                  </span>
                ) : null}
                <span
                  aria-hidden
                  className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
                    isSelected ? "border-accent bg-accent text-accent-foreground" : "border-white/90 bg-black/20 text-transparent"
                  }`}
                >
                  {mode === "quantity" && quantity > 1 ? (
                    <span className="text-xs font-bold">{quantity}</span>
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </span>
              </span>
              <span className="flex flex-1 flex-col gap-0.5 p-3">
                <span className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{item.name}</span>
                <span className="text-sm tabular-nums text-muted-foreground">{formatCurrency(item.price)}</span>
              </span>
            </button>
            {mode === "quantity" && isSelected ? (
              <TouchStepper value={quantity} min={0} max={99} onChange={(next) => onChange(item.id, next)} compact />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
