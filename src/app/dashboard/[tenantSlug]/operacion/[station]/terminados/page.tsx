"use client";

import { useParams } from "next/navigation";

import { useActiveTenant } from "@/stores/useTenantStore";
import { StationBoardView } from "@/features/operaciones/components/StationBoardView";

import { stationMeta } from "@/features/operaciones/constants/stations";

export default function StationHistoryPage() {
  const params = useParams();
  const station = stationMeta(params.station as string);
  const activeTenant = useActiveTenant();

  if (!station?.historyLabel || !activeTenant) return null;
  return (
    <StationBoardView
      key={`${station.key}-done`}
      station={station}
      tenantId={activeTenant.id}
      tenantSlug={params.tenantSlug as string}
      view="done"
    />
  );
}
