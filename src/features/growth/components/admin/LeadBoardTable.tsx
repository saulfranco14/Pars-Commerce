"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { StatusBadge } from "@/components/admin/StatusBadge";

import { formatBusinessName } from "@/features/growth/helpers/formatBusinessName";
import { nextStepDue } from "@/features/growth/helpers/leadPipeline";
import { boardCardReason } from "@/features/growth/helpers/boardCardReason";
import { giroCopy } from "@/features/growth/constants/giroCopy";
import { LEAD_STAGE_META } from "@/features/growth/constants/leadStages";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";
import { leadPath } from "@/features/growth/constants/routes";
import { markOpenedFromList } from "@/features/growth/services/leadsReturn";

import type { LeadBoardTableProps } from "@/features/growth/interfaces/pipeline";

/** The follow-up as one table: what to do with each business and how urgent it is; a row opens its card. */
export function LeadBoardTable({ leads, now, showOwner }: LeadBoardTableProps) {
  const router = useRouter();

  function open(id: string) {
    markOpenedFromList();
    router.push(leadPath(id));
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <table className="w-full table-fixed text-left text-sm">
        <thead className="border-b border-border-soft bg-surface-raised text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className={`${showOwner ? "w-[28%]" : "w-[32%]"} px-4 py-3`}>Negocio</th>
            <th className="w-[14%] px-3 py-3">Etapa</th>
            <th className="px-3 py-3">Qué sigue y por qué</th>
            <th className="w-[13%] px-3 py-3">Cuándo</th>
            {showOwner ? <th className="w-[13%] px-3 py-3">Lo trabaja</th> : null}
            <th className="w-10 px-2 py-3"><span className="sr-only">Abrir</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-soft">
          {leads.map((lead) => {
            const due = nextStepDue(lead, now);
            const reason = boardCardReason(lead, now);
            const stage = LEAD_STAGE_META[lead.stage];
            const place = [lead.colonia ? formatBusinessName(lead.colonia) : null, zoneByMunicipio(lead.municipio)?.label ?? lead.municipio].filter(Boolean).join(", ");
            return (
              <tr key={lead.id} onClick={() => open(lead.id)} className="cursor-pointer transition-colors hover:bg-surface-raised/70">
                <td className="px-4 py-3">
                  <Link href={leadPath(lead.id)} onClick={(event) => { event.stopPropagation(); markOpenedFromList(); }} className="block truncate font-semibold text-foreground hover:text-accent">
                    {formatBusinessName(lead.business_name)}
                  </Link>
                  <span className="block truncate text-xs text-muted-foreground">{giroCopy(lead.giro).label} · {place}</span>
                </td>
                <td className="px-3 py-3"><StatusBadge tone={stage.tone} label={stage.label} compact /></td>
                <td className="px-3 py-3">
                  <span className="block truncate font-medium text-foreground">{due?.label ?? "Sin pendiente"}</span>
                  {reason ? <span className="block truncate text-xs text-muted-foreground">{reason}</span> : null}
                </td>
                <td className="px-3 py-3">{due ? <StatusBadge tone={due.tone} label={due.when} compact dot={false} /> : <span className="text-xs text-muted-foreground">—</span>}</td>
                {showOwner ? <td className="truncate px-3 py-3 text-xs text-muted-foreground">{lead.owner_name ?? "Sin asignar"}</td> : null}
                <td className="px-2 py-3 text-muted-foreground"><ChevronRight className="h-4 w-4" aria-hidden /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
