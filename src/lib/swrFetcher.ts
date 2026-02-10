import { apiFetch } from "@/services/apiFetch";

export async function swrFetcher<T = unknown>(url: string): Promise<T> {
  const data = await apiFetch(url);
  return data as T;
}
