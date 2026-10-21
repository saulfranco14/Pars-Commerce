"use client";

import Image from "next/image";
import { CalendarClock, Check, Minus, Package, Plus, Sparkles } from "lucide-react";

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

const MAX_QUANTITY = 99;
const STEP_BUTTON =
  "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-foreground transition-colors hover:bg-border-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40";

/** Every card has the same height: photo, two-line name, price and (in quantity mode) a fixed footer. */
export function ProductPickerGrid({ entries, mode, selected, onChange }: ProductPickerGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {entries.map(({ item, suggested }) => {
        const quantity = selected.get(item.id) ?? 0;
        const isSelected = quantity > 0;
        const FallbackIcon = item.type === "service" ? CalendarClock : Package;
        return (
          <li key={item.id} className="min-w-0">
            <div
              className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-surface transition-colors ${
                isSelected ? "border-accent ring-2 ring-accent" : "border-border hover:border-accent/40"
              }`}
            >
              <button
                type="button"
                role={mode === "single" ? "radio" : "checkbox"}
                aria-checked={isSelected}
                aria-label={`${item.name}, ${formatCurrency(item.price)}`}
                onClick={() => onChange(item.id, isSelected ? 0 : 1)}
                className="group flex flex-1 cursor-pointer flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
              >
                <span className="relative block aspect-4/3 w-full bg-border-soft/50">
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
                    <Check className="h-4 w-4" />
                  </span>
                </span>
                <span className="flex flex-1 flex-col justify-between gap-1 p-3">
                  <span className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-foreground">{item.name}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">{formatCurrency(item.price)}</span>
                </span>
              </button>

              {mode === "quantity" ? (
                <div className="flex h-12 shrink-0 items-center justify-between gap-1 border-t border-border px-1.5">
                  {isSelected ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onChange(item.id, quantity - 1)}
                        className={STEP_BUTTON}
                        aria-label={quantity === 1 ? `Quitar ${item.name}` : `Una pieza menos de ${item.name}`}
                      >
                        <Minus className="h-4 w-4" aria-hidden />
                      </button>
                      <span className="min-w-8 text-center text-sm font-bold tabular-nums text-foreground" aria-live="polite">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onChange(item.id, Math.min(MAX_QUANTITY, quantity + 1))}
                        disabled={quantity >= MAX_QUANTITY}
                        className={STEP_BUTTON}
                        aria-label={`Una pieza más de ${item.name}`}
                      >
                        <Plus className="h-4 w-4" aria-hidden />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onChange(item.id, 1)}
                      className="flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-accent hover:bg-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                      Agregar
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
