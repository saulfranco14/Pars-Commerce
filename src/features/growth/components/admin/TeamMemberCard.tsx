import { MapPin, MessageCircle } from "lucide-react";

import { AdminListCard } from "@/components/admin/AdminListCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";

import { GROWTH_ROLE_LABEL, MEMBER_STATUS_META } from "@/features/growth/constants/growthRoles";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";
import { formatMexicanPhoneInput } from "@/lib/phone";

import type { GrowthZone, TeamMemberCardProps } from "@/features/growth/interfaces/member";

function zoneLabel(zone: GrowthZone): string {
  const municipio = zoneByMunicipio(zone.municipio)?.label ?? zone.municipio;
  return zone.colonias?.length ? `${municipio} (${zone.colonias.join(", ")})` : municipio;
}

export function TeamMemberCard({ member, isSelf, onEdit }: TeamMemberCardProps) {
  const status = MEMBER_STATUS_META[member.status];
  const zones = member.zones.length ? member.zones.map(zoneLabel).join(" · ") : member.role === "coordinador" ? "Todas las zonas" : "Sin zonas";
  return (
    <AdminListCard
      title={`${member.display_name}${isSelf ? " (tú)" : ""}`}
      thumbnail={
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent" aria-hidden>
          {member.display_name.slice(0, 2).toUpperCase()}
        </span>
      }
      meta={member.email}
      badge={
        <span className="flex flex-wrap justify-end gap-1">
          <StatusBadge tone="info" label={GROWTH_ROLE_LABEL[member.role]} dot={false} compact />
          {member.status !== "active" ? <StatusBadge tone={status.tone} label={status.label} compact /> : null}
        </span>
      }
      body={
        <div className="grid gap-1.5">
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{zones}</p>
          {member.whatsapp_e164 ? (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><MessageCircle className="h-4 w-4 shrink-0" aria-hidden />{formatMexicanPhoneInput(member.whatsapp_e164)}</p>
          ) : null}
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground tabular-nums">
            <span><b className="text-foreground">{member.stats.active}</b> en curso</span>
            <span><b className="text-foreground">{member.stats.replied}</b> respondieron</span>
            <span><b className="text-foreground">{member.stats.registered}</b> registrados</span>
          </p>
        </div>
      }
      actions={<button type="button" onClick={() => onEdit(member)} className={adminActionButtonSecondary}>Editar</button>}
    />
  );
}
