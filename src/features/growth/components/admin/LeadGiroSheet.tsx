"use client";

import { useState } from "react";
import { Check, Store } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { adminActionButtonPrimary } from "@/components/admin/actionButtonClasses";

import { GIRO_COPY, GIRO_KEYS } from "@/features/growth/constants/giroCopy";

import type { LeadGiroSheetProps } from "@/features/growth/interfaces/lead";

export function LeadGiroSheet({ isOpen, currentGiro, busy, onClose, onSubmit }: LeadGiroSheetProps) {
  const [selected, setSelected] = useState(currentGiro);

  async function save() {
    if (await onSubmit(selected)) onClose();
  }

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Corregir giro"
      description="Cambia los productos de su «Para ti», incluso en los links que ya le mandaste, y los textos que dependen del giro."
      icon={Store}
      footer={
        <button type="button" disabled={busy || selected === currentGiro} onClick={() => void save()} className={`${adminActionButtonPrimary} w-full`}>
          {busy ? "Guardando…" : "Guardar giro"}
        </button>
      }
    >
      <div role="radiogroup" aria-label="Giro del negocio" className="grid grid-cols-2 gap-2">
        {GIRO_KEYS.map((key) => {
          const active = key === selected;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelected(key)}
              className={`flex min-h-11 items-center justify-between gap-2 rounded-xl border px-3 text-left text-sm font-semibold transition-colors ${
                active ? "border-accent bg-accent/10 text-foreground" : "border-border bg-surface text-muted-foreground hover:bg-border-soft/50"
              }`}
            >
              {GIRO_COPY[key].label}
              {active ? <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden /> : null}
            </button>
          );
        })}
      </div>
    </FormSheet>
  );
}
