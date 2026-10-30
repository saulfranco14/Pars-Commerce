import useSWR from "swr";

import { growthMeKey } from "@/features/growth/services/growthClient";
import { swrFetcher } from "@/lib/swrFetcher";

import type { GrowthActor, GrowthMe } from "@/features/growth/interfaces/member";

/** The signed-in user's place in the prospecting team; `actor` stays null for everyone else. */
export function useGrowthMe(): { actor: GrowthActor | null; loaded: boolean; isCoordinator: boolean } {
  const { data, error } = useSWR<GrowthMe>(growthMeKey, swrFetcher, { revalidateOnFocus: false });
  const actor = data?.actor ?? null;
  return { actor, loaded: Boolean(data || error), isCoordinator: actor?.role === "coordinador" };
}
