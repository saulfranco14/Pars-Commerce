import { apiFetch } from "@/services/apiFetch";

export async function get(): Promise<unknown> {
  const data = await apiFetch("/api/profile");
  return data;
}

export async function update(payload: {
  display_name?: string;
  phone?: string;
  avatar_url?: string;
}): Promise<unknown> {
  const data = await apiFetch("/api/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data;
}
