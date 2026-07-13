import { apiFetch } from "@/services/apiFetch";

/**
 * Rejects normally on abort — including AbortError. Do NOT special-case
 * abort into a promise that never settles: SWR dedupes concurrent requests
 * for the same key (dedupingInterval) and polling hooks (refreshInterval)
 * can share this exact promise with an unrelated, still-mounted component.
 * If hook A unmounts and aborts its controller while hook B is still
 * waiting on the same deduped request, a "never resolves" promise would
 * hang B's `isLoading` forever. Consumers that render an error banner from
 * SWR's `error` should skip it when `isAbortError(error)` is true instead
 * (see @/services/apiFetch) — that's the correct place to swallow this,
 * since it only knows about "did *my* mounted component still want this."
 */
export async function swrFetcher<T = unknown>(
  url: string,
  signal?: AbortSignal,
): Promise<T> {
  const data = await apiFetch(url, { signal });
  return data as T;
}
