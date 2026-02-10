import type { SitePage } from "@/types/tenantSitePages";
import { apiFetch } from "@/services/apiFetch";

export async function list(tenantId: string): Promise<SitePage[]> {
  const data = await apiFetch(
    `/api/tenant-site-pages?tenant_id=${encodeURIComponent(tenantId)}`
  );
  return Array.isArray(data) ? (data as SitePage[]) : [];
}
