"use client";

import { ListFilter } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";

import { FOLLOW_UP_LISTS } from "@/features/growth/constants/leadPipeline";

import type { StageSheetProps } from "@/features/growth/interfaces/prospects";

/** «¿Qué negocios ver?»: every follow-up list with what it holds, its count and how a prospect moves along. */
export function StageSheet({ isOpen, active, counts, onClose, onPick }: StageSheetProps) {
  return (
    <FormSheet isOpen={isOpen} onClose={onClose} title="¿Qué negocios ver?" icon={ListFilter} maxWidth="max-w-md">
      <div className="grid gap-3">
        <ul className="divide-y divide-border-soft overflow-hidden rounded-xl border border-border">
          {FOLLOW_UP_LISTS.map((option) => {
            const selected = option.value === active;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onPick(option.value)}
                  className={`grid min-h-14 w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/50 ${selected ? "bg-accent/10" : "hover:bg-border-soft/40"}`}
                >
                  <span className="grid min-w-0 gap-0.5">
                    <span className={`text-sm font-semibold ${selected ? "text-accent" : "text-foreground"}`}>{option.label}</span>
                    <span className="text-xs leading-snug text-muted-foreground">{option.hint}</span>
                  </span>
                  <span className="text-sm font-bold tabular-nums text-foreground">{counts[option.value].toLocaleString("es-MX")}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="rounded-xl bg-surface-raised px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          Cómo avanza: <b className="text-foreground">mensaje 1</b> → 3 días → <b className="text-foreground">seguimiento</b> → 7 días → <b className="text-foreground">visita o último mensaje</b> → pausa de 60 días. Si <b className="text-foreground">abre su tienda</b> o <b className="text-foreground">responde</b>, toca ese mismo día.
        </p>
      </div>
    </FormSheet>
  );
}
