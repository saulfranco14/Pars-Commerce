"use client";

import { Plus } from "lucide-react";

import { adminActionButtonIcon } from "@/components/admin/actionButtonClasses";

import type { ProspectsActionBarProps } from "@/features/growth/interfaces/prospects";

/** Phones: the section's main move stays under the thumb, with «Nuevo prospecto» beside it. */
export function ProspectsActionBar({ onAdd, children }: ProspectsActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-[auto_minmax(0,1fr)] gap-2 border-t border-border-soft bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
      <button type="button" onClick={onAdd} aria-label="Nuevo prospecto" className={adminActionButtonIcon}>
        <Plus className="h-4 w-4" aria-hidden />
      </button>
      {children}
    </div>
  );
}
