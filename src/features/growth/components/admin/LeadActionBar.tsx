"use client";

import { MoreHorizontal } from "lucide-react";

import { adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";

import type { LeadActionBarProps } from "@/features/growth/interfaces/leadActions";

/** Phones: the main move and every other action stay under the thumb while scrolling. */
export function LeadActionBar({ onOpenActions, children }: LeadActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-[auto_minmax(0,1fr)] gap-2 border-t border-border-soft bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
      <button type="button" onClick={onOpenActions} className={adminActionButtonSecondary} aria-label="Acciones">
        <MoreHorizontal className="h-4 w-4" aria-hidden />Acciones
      </button>
      {children}
    </div>
  );
}
