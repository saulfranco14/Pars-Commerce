"use client";

import { ChevronRight, ListChecks } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";

import { LEAD_ACTION_HINT, LEAD_ACTION_ICON, LEAD_ACTION_LABEL } from "@/features/growth/constants/leadActions";

import type { LeadActionsSheetProps, LeadSheetAction } from "@/features/growth/interfaces/leadActions";

const rowClass =
  "flex min-h-14 w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/50";

function tone(action: LeadSheetAction): { row: string; icon: string; label: string } {
  if (action === "not_interested") return { row: "hover:bg-red-50 dark:hover:bg-red-950/30", icon: "bg-red-50 text-red-600 dark:bg-red-950/40", label: "text-red-600" };
  if (action === "register") return { row: "hover:bg-accent/5", icon: "bg-accent/10 text-accent", label: "text-foreground" };
  return { row: "hover:bg-border-soft/40", icon: "bg-border-soft/70 text-foreground", label: "text-foreground" };
}

/** Every move on the prospect, grouped, each saying what it does before you tap it. */
export function LeadActionsSheet({ isOpen, busy, groups, onClose, onPick }: LeadActionsSheetProps) {
  return (
    <FormSheet isOpen={isOpen} onClose={onClose} title="Acciones" icon={ListChecks} maxWidth="max-w-md">
      <div className="grid gap-4">
        {groups.filter((group) => group.actions.length).map((group) => (
          <section key={group.title} className="grid gap-1.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{group.title}</h3>
            <ul className="divide-y divide-border-soft overflow-hidden rounded-xl border border-border">
              {group.actions.map((action) => {
                const Icon = LEAD_ACTION_ICON[action];
                const style = tone(action);
                return (
                  <li key={action}>
                    <button type="button" disabled={busy} onClick={() => onPick(action)} className={`${rowClass} ${style.row}`}>
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.icon}`}><Icon className="h-4 w-4" aria-hidden /></span>
                      <span className="grid min-w-0 flex-1 gap-0.5">
                        <span className={`text-sm font-semibold ${style.label}`}>{LEAD_ACTION_LABEL[action]}</span>
                        <span className="text-xs leading-snug text-muted-foreground">{LEAD_ACTION_HINT[action]}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </FormSheet>
  );
}
