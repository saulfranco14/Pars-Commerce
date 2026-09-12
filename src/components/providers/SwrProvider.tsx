"use client";

import { SWRConfig } from "swr";
import { swrFetcher } from "@/lib/swrFetcher";
import { swrAbortMiddleware } from "@/lib/swrAbortMiddleware";
import { isAbortError } from "@/services/apiFetch";

const swrOptions = {
  fetcher: swrFetcher,
  dedupingInterval: 10000,
  revalidateOnFocus: false,
  revalidateIfStale: true,
  use: [swrAbortMiddleware],
  shouldRetryOnError: (error: unknown) => !isAbortError(error),
};

export function SwrProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={swrOptions}>{children}</SWRConfig>;
}
