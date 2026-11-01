"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

import { adminActionButtonText } from "@/components/admin/actionButtonClasses";
import { FollowUpRow } from "@/features/growth/components/admin/FollowUpRow";

import { LIST_GROUP_PREVIEW } from "@/features/growth/constants/leadPipeline";

import type { FollowUpGroupProps } from "@/features/growth/interfaces/prospects";

const DOT: Record<FollowUpGroupProps["tone"], string> = {
  danger: "bg-red-600",
  warning: "bg-amber-500",
  neutral: "bg-muted-foreground",
};

/** An accordion block of the list (Vencidos, Para hoy…): the header opens it, inside a few rows and the rest on demand. */
export function FollowUpGroup({ tone, title, total, hint, leads, now, showOwner, viewerId, open, onToggle, onOpen }: FollowUpGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const bodyId = useId();
  if (!leads.length) return null;
  const shown = expanded ? leads : leads.slice(0, LIST_GROUP_PREVIEW);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface" aria-label={title}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={bodyId}
        className="grid min-h-14 w-full cursor-pointer grid-cols-[0.5rem_minmax(0,1fr)_auto_1rem] items-center gap-2.5 px-3.5 text-left transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
      >
        <span className={`h-2 w-2 rounded-full ${DOT[tone]}`} aria-hidden />
        <span className="truncate text-xs font-bold uppercase tracking-wider text-foreground">{title} · {total.toLocaleString("es-MX")}</span>
        <span className="truncate text-xs text-muted-foreground">{hint}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      <div id={bodyId} className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="min-h-0 overflow-hidden" inert={!open}>
          <div className="divide-y divide-border-soft border-t border-border-soft">
            {shown.map((lead) => <FollowUpRow key={lead.id} lead={lead} now={now} showOwner={showOwner} viewerId={viewerId} onOpen={onOpen} />)}
          </div>
          {leads.length > shown.length ? (
            <div className="flex justify-center border-t border-border-soft">
              <button type="button" onClick={() => setExpanded(true)} className={adminActionButtonText}>
                Ver {total > leads.length ? `${leads.length} de ${total.toLocaleString("es-MX")}` : `los ${leads.length}`}<ChevronDown className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
