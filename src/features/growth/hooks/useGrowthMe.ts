import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";

import { GROWTH_WORKSPACE_COOKIE } from "@/features/growth/constants/workspace";
import { growthMeKey } from "@/features/growth/services/growthClient";
import { swrFetcher } from "@/lib/swrFetcher";

import type { GrowthActor, GrowthMe } from "@/features/growth/interfaces/member";

function readChoice(): string | null {
  if (typeof document === "undefined") return null;
  return document.cookie.split("; ").find((part) => part.startsWith(`${GROWTH_WORKSPACE_COOKIE}=`))?.split("=")[1] ?? null;
}

/**
 * The signed-in user's place in prospecting; `actor` stays null for everyone else.
 * `?ws=tlaco` or `?ws=<tenant id>` picks the workspace (kept in a cookie; the server checks access).
 */
export function useGrowthMe(): { actor: GrowthActor | null; loaded: boolean; isCoordinator: boolean; choice: string | null } {
  const requested = useSearchParams().get("ws");
  const { mutate } = useSWRConfig();
  const { data, error } = useSWR<GrowthMe>(growthMeKey, swrFetcher, { revalidateOnFocus: false });

  useEffect(() => {
    if (!requested || requested === readChoice()) return;
    document.cookie = `${GROWTH_WORKSPACE_COOKIE}=${encodeURIComponent(requested)}; path=/; max-age=31536000; samesite=lax`;
    // Every prospecting list belongs to the previous workspace: reload them all.
    void mutate((key) => typeof key === "string" && key.startsWith("/api/growth"), undefined, { revalidate: true });
  }, [requested, mutate]);

  const actor = data?.actor ?? null;
  return { actor, loaded: Boolean(data || error), isCoordinator: actor?.role === "coordinador", choice: requested ?? readChoice() };
}
