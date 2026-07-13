import { apiFetch } from "@/services/apiFetch";

export async function swrFetcher<T = unknown>(
  url: string,
  signal?: AbortSignal,
): Promise<T> {
  const data = await apiFetch(url, { signal });
  return data as T;
}
