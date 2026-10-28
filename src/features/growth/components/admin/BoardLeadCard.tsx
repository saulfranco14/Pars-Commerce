import Link from "next/link";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { PipelineDots } from "@/features/growth/components/admin/PipelineDots";

import { formatBusinessName } from "@/features/growth/helpers/formatBusinessName";
import { nextStepDue } from "@/features/growth/helpers/leadPipeline";
import { giroCopy } from "@/features/growth/constants/giroCopy";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";
import { markOpenedFromList } from "@/features/growth/services/leadsReturn";

import type { BoardLeadCardProps } from "@/features/growth/interfaces/pipeline";

export function BoardLeadCard({ lead, now }: BoardLeadCardProps) {
  const due = nextStepDue(lead, now);
  const place = [lead.colonia ? formatBusinessName(lead.colonia) : null, zoneByMunicipio(lead.municipio)?.label ?? lead.municipio].filter(Boolean).join(", ");
  return (
    <Link
      href={`/dashboard/plataforma/prospectos/${lead.id}`}
      onClick={markOpenedFromList}
      className={`grid gap-1.5 rounded-xl border bg-surface p-3 transition-colors hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        due?.tone === "danger" ? "border-red-200" : "border-border"
      }`}
    >
      <span className="truncate text-sm font-bold text-foreground" title={formatBusinessName(lead.business_name)}>{formatBusinessName(lead.business_name)}</span>
      <span className="truncate text-xs text-muted-foreground">{giroCopy(lead.giro).label} · {place}</span>
      <PipelineDots stage={lead.stage} />
      {due ? (
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <span className="text-xs font-semibold text-foreground">{due.label}</span>
          <StatusBadge tone={due.tone} label={due.when} compact dot={false} />
        </span>
      ) : null}
      {lead.next_step_note ? <span className="line-clamp-2 text-xs text-muted-foreground">“{lead.next_step_note}”</span> : null}
    </Link>
  );
}
