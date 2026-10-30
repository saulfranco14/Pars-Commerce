"use client";

import { useState } from "react";
import { AlertTriangle, UserPlus, Users } from "lucide-react";

import { useGrowthMe } from "@/features/growth/hooks/useGrowthMe";
import { useGrowthTeam } from "@/features/growth/hooks/useGrowthTeam";
import { EmptyState } from "@/components/admin/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";
import { MemberSheet } from "@/features/growth/components/admin/MemberSheet";
import { TeamMemberCard } from "@/features/growth/components/admin/TeamMemberCard";
import { pageHeaderCta } from "@/components/admin/actionButtonClasses";

import { GROWTH_MUNICIPIOS } from "@/features/growth/constants/growthRoles";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";

import type { GrowthMember } from "@/features/growth/interfaces/member";

/** Coordinator screen: who prospects, in which zones, and how each one is doing. */
export function TeamView() {
  const { actor } = useGrowthMe();
  const team = useGrowthTeam();
  const [sheet, setSheet] = useState<{ open: boolean; member: GrowthMember | null }>({ open: false, member: null });

  if (team.isLoading && !team.team) return <LoadingBlock message="Cargando equipo…" variant="skeleton" />;
  if (team.error && !team.team) return <EmptyState icon={AlertTriangle} title="No pudimos cargar el equipo" description="Intenta de nuevo en un momento." tone="muted" />;
  const members = team.team?.members ?? [];
  const uncovered = (team.team?.uncovered ?? []).map((municipio) => zoneByMunicipio(municipio)?.label ?? municipio);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {members.length === 1 ? "1 persona" : `${members.length} personas`}
          {uncovered.length ? ` · ${uncovered.length === 1 ? "1 zona" : `${uncovered.length} zonas`} sin asignar` : ""}
        </p>
        <button type="button" onClick={() => setSheet({ open: true, member: null })} className={pageHeaderCta}>
          <UserPlus className="h-4 w-4" aria-hidden />
          Invitar persona
        </button>
      </div>

      {team.notice ? <Notification tone={team.notice.tone} message={team.notice.message} onDismiss={team.clearNotice} /> : null}
      {uncovered.length ? (
        <Notification
          tone="info"
          title={`${uncovered.join(", ")} sin nadie asignado`}
          message="Sus prospectos solo los trabaja el coordinador. Asígnalos a alguien para que entren a su barrido."
        />
      ) : null}

      {members.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {members.map((member) => (
            <TeamMemberCard key={member.user_id} member={member} isSelf={member.user_id === actor?.userId} onEdit={(selected) => setSheet({ open: true, member: selected })} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="Todavía no hay nadie en el equipo"
          description="Invita a quien vaya a prospectar. Le asignas zonas y entra directo a sus prospectos."
          tone="muted"
        />
      )}

      <MemberSheet
        isOpen={sheet.open}
        member={sheet.member}
        municipios={GROWTH_MUNICIPIOS}
        busy={team.busy}
        onClose={() => setSheet({ open: false, member: null })}
        onInvite={team.invite}
        onSave={team.update}
      />
    </div>
  );
}
