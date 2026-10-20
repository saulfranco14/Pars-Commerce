"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { useCanOpenSection } from "@/stores/useTenantStore";
import { LoadingBlock } from "@/components/ui/LoadingBlock";

import { STATIONS, stationSection } from "@/features/operaciones/constants/stations";

export default function OperacionPage() {
  const params = useParams();
  const router = useRouter();
  const canOpen = useCanOpenSection();
  const first = STATIONS.find((s) => canOpen(stationSection(s.key)));

  useEffect(() => {
    if (first) router.replace(`/dashboard/${params.tenantSlug as string}/operacion/${first.key}`);
  }, [first, params.tenantSlug, router]);

  return <LoadingBlock message="Abriendo tu estación…" />;
}
