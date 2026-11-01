import Link from "next/link";
import { CalendarClock, ChevronRight, Clock, Eye, MessageSquareReply, Rocket } from "lucide-react";

import { formatBusinessName } from "@/features/growth/helpers/formatBusinessName";
import { calendarDaysBetween, nextStepDue } from "@/features/growth/helpers/leadPipeline";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";
import { leadPath } from "@/features/growth/constants/routes";
import { markOpenedFromList } from "@/features/growth/services/leadsReturn";

import type { StatusTone } from "@/components/admin/StatusBadge";
import type { LeadStage } from "@/features/growth/interfaces/lead";
import type { FollowUpRowProps } from "@/features/growth/interfaces/prospects";

const STAGE_ICON: Partial<Record<LeadStage, { icon: typeof Clock; className: string }>> = {
  conversando: { icon: MessageSquareReply, className: "bg-accent/10 text-accent" },
  caliente: { icon: Eye, className: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  cita: { icon: CalendarClock, className: "bg-accent/10 text-accent" },
  registrado: { icon: Rocket, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
};

const WHEN_CLASS: Partial<Record<StatusTone, string>> = {
  danger: "text-red-600 dark:text-red-400",
  warning: "text-amber-700 dark:text-amber-300",
};

/** «hace 2 d», «ayer», «hoy»: short enough to leave the name room on a phone. */
function shortWhen(lead: FollowUpRowProps["lead"], now: Date, fallback: string): string {
  if (lead.stage === "cita" || !lead.next_step_at) return fallback;
  const days = calendarDaysBetween(now, new Date(lead.next_step_at));
  if (days === 0) return "hoy";
  if (days === -1) return "ayer";
  if (days === 1) return "mañana";
  return days < 0 ? `hace ${-days} d` : `en ${days} d`;
}

/** One prospect in two lines: what to do and where, and on the right when it was due. */
export function FollowUpRow({ lead, now, showOwner, viewerId, onOpen }: FollowUpRowProps) {
  const due = nextStepDue(lead, now);
  const late = due?.tone === "danger";
  const mark = STAGE_ICON[lead.stage] ?? { icon: Clock, className: late ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400" : "bg-border-soft text-muted-foreground" };
  const Icon = mark.icon;
  const place = [lead.colonia ? formatBusinessName(lead.colonia) : null, zoneByMunicipio(lead.municipio)?.label ?? lead.municipio].filter(Boolean).join(", ");
  const owner = showOwner && lead.owner_user_id !== viewerId ? (lead.owner_name ? `Lo trabaja ${lead.owner_name}` : "Sin asignar") : null;

  return (
    <Link
      href={leadPath(lead.id)}
      onClick={() => {
        markOpenedFromList();
        onOpen();
      }}
      className="grid min-h-16 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${mark.className}`}><Icon className="h-4.5 w-4.5" aria-hidden /></span>
      <span className="grid min-w-0">
        <span className="truncate text-sm font-bold text-foreground sm:text-base">{formatBusinessName(lead.business_name)}</span>
        <span className="truncate text-xs text-muted-foreground sm:text-sm">
          {due ? <b className="font-semibold text-foreground">{due.label}</b> : null}
          {due && place ? " · " : null}{place}{owner ? ` · ${owner}` : null}
        </span>
      </span>
      <span className={`inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold ${due ? WHEN_CLASS[due.tone] ?? "text-muted-foreground" : "text-muted-foreground"}`}>
        {due ? <span title={due.when}>{shortWhen(lead, now, due.when)}</span> : null}<ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
      </span>
    </Link>
  );
}
