import { apiFetch } from "@/services/apiFetch";

import type { TenantDevice } from "@/features/dispositivos/interfaces/device";

export async function list(tenantId: string): Promise<TenantDevice[]> {
  const data = await apiFetch(
    `/api/devices?tenant_id=${encodeURIComponent(tenantId)}`,
  );
  return Array.isArray(data) ? (data as TenantDevice[]) : [];
}

/** Sin `name` el servidor le pone `Pantalla N`; se renombra después. */
export async function approve(
  deviceId: string,
  name?: string,
): Promise<TenantDevice> {
  return (await apiFetch(`/api/devices/${deviceId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "approve", name: name ?? "" }),
  })) as TenantDevice;
}

export async function rename(
  deviceId: string,
  name: string,
): Promise<TenantDevice> {
  return (await apiFetch(`/api/devices/${deviceId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "rename", name }),
  })) as TenantDevice;
}

/** Rechaza una solicitud o revoca una pantalla ya activa. */
export async function reject(deviceId: string): Promise<TenantDevice> {
  return (await apiFetch(`/api/devices/${deviceId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "reject" }),
  })) as TenantDevice;
}

export interface EnrollKeyResponse {
  key: string;
  slug: string;
}

export async function getEnrollUrlKey(
  tenantId: string,
): Promise<EnrollKeyResponse> {
  return (await apiFetch(
    `/api/devices/enroll-key?tenant_id=${encodeURIComponent(tenantId)}`,
  )) as EnrollKeyResponse;
}

export async function rotateEnrollUrlKey(
  tenantId: string,
): Promise<EnrollKeyResponse> {
  return (await apiFetch("/api/devices/enroll-key", {
    method: "POST",
    body: JSON.stringify({ tenant_id: tenantId }),
  })) as EnrollKeyResponse;
}

export async function remove(deviceId: string): Promise<void> {
  await apiFetch(`/api/devices/${deviceId}`, { method: "DELETE" });
}
