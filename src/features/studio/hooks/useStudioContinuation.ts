"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStudioContext } from "../components/StudioProvider";

export function useStudioContinuation(): void {
  const { tenantSlug, summary } = useStudioContext(),
    query = useSearchParams(),
    router = useRouter();
  const creating = query.get("studio_action") === "create";
  useEffect(() => {
    if (
      creating &&
      summary?.active &&
      summary.enabled &&
      summary.permissions.includes("studio.create")
    )
      router.replace(
        `/dashboard/${encodeURIComponent(tenantSlug)}/studio/nuevo`,
      );
  }, [
    creating,
    summary?.active,
    summary?.enabled,
    summary?.permissions,
    tenantSlug,
    router,
  ]);
}
