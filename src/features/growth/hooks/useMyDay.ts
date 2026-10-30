import useSWR from "swr";

import { myDayKey } from "@/features/growth/services/growthClient";
import { swrFetcher } from "@/lib/swrFetcher";

import type { MyDay } from "@/features/growth/interfaces/lead";

export function useMyDay() {
  return useSWR<MyDay>(myDayKey, swrFetcher, { revalidateOnFocus: true });
}
