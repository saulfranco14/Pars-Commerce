import type { SitePage, SitePageContent } from "@/types/tenantSitePages";
import { apiFetch } from "@/services/apiFetch";

export async function list(tenantId: string): Promise<SitePage[]> {
  const data = await apiFetch(
    `/api/tenant-site-pages?tenant_id=${encodeURIComponent(tenantId)}`
  );
  return Array.isArray(data) ? (data as SitePage[]) : [];
}

export async function updateContent(
  tenantId: string,
  pageSlug: string,
  content: SitePageContent
): Promise<{ id: string; slug: string; content: SitePageContent }> {
  const data = await apiFetch("/api/tenant-site-pages", {
    method: "PATCH",
    body: JSON.stringify({
      tenant_id: tenantId,
      slug: pageSlug,
      content,
    }),
  });
  return data as { id: string; slug: string; content: SitePageContent };
}
