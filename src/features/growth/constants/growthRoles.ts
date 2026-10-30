import { ZONES } from "@/features/growth/constants/zoneCopy";

import type { StatusTone } from "@/components/admin/StatusBadge";
import type { GrowthMemberStatus, GrowthRole } from "@/features/growth/interfaces/member";

export const GROWTH_ROLE_LABEL: Record<GrowthRole, string> = {
  coordinador: "Coordinador",
  prospector: "Prospector",
};

export const GROWTH_ROLE_HINT: Record<GrowthRole, string> = {
  coordinador: "Ve a todo el equipo, asigna zonas y prospectos, y edita los mensajes.",
  prospector: "Trabaja sus prospectos y los de sus zonas que nadie tiene.",
};

export const MEMBER_STATUS_META: Record<GrowthMemberStatus, { label: string; tone: StatusTone }> = {
  invited: { label: "Invitado", tone: "warning" },
  active: { label: "Activo", tone: "success" },
  suspended: { label: "Suspendido", tone: "neutral" },
};

/** Municipios loaded from the DENUE so far; the zone picker offers these. */
export const GROWTH_MUNICIPIOS = ZONES.map((zone) => zone.municipio);
