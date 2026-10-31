import useSWR from "swr";

import { GROWTH_WORKSPACE_COOKIE } from "@/features/growth/constants/workspace";
import { growthMeKey } from "@/features/growth/services/growthClient";
import { swrFetcher } from "@/lib/swrFetcher";

import type { GrowthActor, GrowthMe } from "@/features/growth/interfaces/member";

/** The workspace the browser chose: "tlaco", a tenant id, or null when never chosen. */
export function readGrowthChoice(): string | null {
  if (typeof document === "undefined") return null;
  const value = document.cookie.split("; ").find((part) => part.startsWith(`${GROWTH_WORKSPACE_COOKIE}=`))?.split("=")[1];
  return value ? decodeURIComponent(value) : null;
}

/** The signed-in user's place in prospecting; `actor` stays null for everyone else. GrowthWorkspaceSync sets the choice. */
export function useGrowthMe(): { actor: GrowthActor | null; loaded: boolean; isCoordinator: boolean; choice: string | null } {
  const { data, error } = useSWR<GrowthMe>(growthMeKey, swrFetcher, { revalidateOnFocus: false });
  const actor = data?.actor ?? null;
  return { actor, loaded: Boolean(data || error), isCoordinator: actor?.role === "coordinador", choice: readGrowthChoice() };
}
