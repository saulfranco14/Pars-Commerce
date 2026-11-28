import { apiFetch } from "@/services/apiFetch";

import type { AdBackground, AdBackgroundKind, AdEdit, AdKind } from "@/features/growth/interfaces/prospectAds";

const BASE = "/api/growth";

export const adBackgroundsKey = (giro: string) => `${BASE}/ad-backgrounds?giro=${encodeURIComponent(giro)}`;

export async function generateAdBackgrounds(giro: string, kind: AdBackgroundKind): Promise<{ created: number; failed: number }> {
  return (await apiFetch(`${BASE}/ad-backgrounds`, { method: "POST", body: JSON.stringify({ giro, kind }) })) as { created: number; failed: number };
}

export async function reviewAdBackground(id: string, status: "approved" | "rejected"): Promise<Pick<AdBackground, "id" | "status">> {
  return (await apiFetch(`${BASE}/ad-backgrounds/${id}`, { method: "PATCH", body: JSON.stringify({ status }) })) as Pick<AdBackground, "id" | "status">;
}

const paraBase = (token: string) => `${BASE}/para/${encodeURIComponent(token)}`;

export async function saveParaAdEdit(token: string, kind: AdKind, edit: AdEdit): Promise<void> {
  await apiFetch(`${paraBase(token)}/ads`, { method: "PATCH", body: JSON.stringify({ kind, edit }) });
}

export async function removeParaData(token: string): Promise<void> {
  await apiFetch(`${paraBase(token)}/remove`, { method: "POST", body: "{}" });
}

export function paraAdImageUrl(token: string, kind: AdKind): string {
  return `/para/${encodeURIComponent(token)}/anuncio/${kind}`;
}

export function leadAdImageUrl(leadId: string, kind: AdKind, version = 0): string {
  return `${BASE}/leads/${leadId}/ads/${kind}?v=${version}`;
}

export async function nextLeadAdBackground(leadId: string): Promise<{ seed: number }> {
  return (await apiFetch(`${BASE}/leads/${leadId}/ads/next`, { method: "POST", body: "{}" })) as { seed: number };
}

export const prospectWelcomeKey =(tenantId: string) => `/api/tenants/${tenantId}/prospect-ads`;

export function prospectAdImageUrl(tenantId: string, kind: AdKind): string {
  return `/api/tenants/${tenantId}/prospect-ads/${kind}`;
}
