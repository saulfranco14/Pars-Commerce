"use client";

import { useParams } from "next/navigation";

import { useActiveTenant } from "@/stores/useTenantStore";
import { StationBoardView } from "@/features/operaciones/components/StationBoardView";

import { stationMeta } from "@/features/operaciones/constants/stations";

export default function StationPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const station = stationMeta(params.station as string);
  const activeTenant = useActiveTenant();

  if (!station || !activeTenant) return null;
  return <StationBoardView key={station.key} station={station} tenantId={activeTenant.id} tenantSlug={tenantSlug} />;
}
