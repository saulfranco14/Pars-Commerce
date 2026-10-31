"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSWRConfig } from "swr";

import { GROWTH_WORKSPACE_COOKIE } from "@/features/growth/constants/workspace";
import { readGrowthChoice } from "@/features/growth/hooks/useGrowthMe";

/**
 * `?ws=tlaco` or `?ws=<tenant id>` picks the prospecting workspace (kept in a cookie; the server checks access).
 * Render it inside <Suspense>: it reads the search params.
 */
export function GrowthWorkspaceSync() {
  const requested = useSearchParams().get("ws");
  const { mutate } = useSWRConfig();

  useEffect(() => {
    if (!requested || requested === readGrowthChoice()) return;
    document.cookie = `${GROWTH_WORKSPACE_COOKIE}=${encodeURIComponent(requested)}; path=/; max-age=31536000; samesite=lax`;
    // Every prospecting list belongs to the previous workspace: reload them all.
    void mutate((key) => typeof key === "string" && key.startsWith("/api/growth"), undefined, { revalidate: true });
  }, [requested, mutate]);

  return null;
}
