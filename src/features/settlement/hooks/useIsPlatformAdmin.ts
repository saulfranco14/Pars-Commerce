import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";

/** Whether the logged-in user is a platform super admin (for platform-only UI). */
export function useIsPlatformAdmin(): boolean {
  const { data } = useSWR<{ isPlatformAdmin: boolean }>(
    "/api/me/platform-admin",
    swrFetcher,
  );
  return data?.isPlatformAdmin ?? false;
}
