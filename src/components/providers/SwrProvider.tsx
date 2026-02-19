"use client";

import { SWRConfig } from "swr";
import { swrFetcher } from "@/lib/swrFetcher";

const swrOptions = {
  fetcher: swrFetcher,
  dedupingInterval: 5000,
  revalidateOnFocus: false,
  revalidateIfStale: true,
};

export function SwrProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={swrOptions}>{children}</SWRConfig>;
}
