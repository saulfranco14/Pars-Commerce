import { apiFetch } from "@/services/apiFetch";

/** Registrar interés en una novedad (idempotente). */
export async function registerInterest(payload: {
  tenant_id: string;
  feature_key: string;
}): Promise<{ ok: boolean; feature_key: string }> {
  return (await apiFetch("/api/feature-interest", {
    method: "POST",
    body: JSON.stringify(payload),
  })) as { ok: boolean; feature_key: string };
}
