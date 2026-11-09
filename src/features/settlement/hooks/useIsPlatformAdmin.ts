import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";

/** Whether the logged-in user is a platform super admin (for platform-only UI). */
export function useIsPlatformAdmin(): boolean {
  return usePlatformAdminStatus().isPlatformAdmin;
}

export function usePlatformAdminStatus() {
  const { data, isLoading } = useSWR<{ isPlatformAdmin: boolean }>(
    "/api/me/platform-admin",
    swrFetcher,
  );
  return { isPlatformAdmin: data?.isPlatformAdmin ?? false, isLoading };
}
