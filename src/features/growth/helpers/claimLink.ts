import { STARTER_CATALOGS } from "@/features/catalog/catalogDefinitions";

import type { GrowthLead } from "@/features/growth/interfaces/lead";

type ClaimLead = Pick<GrowthLead, "business_name" | "giro" | "catalog_template_key" | "phone_e164">;

export function leadCatalog(lead: Pick<GrowthLead, "giro" | "catalog_template_key">) {
  return STARTER_CATALOGS.find((entry) => entry.key === (lead.catalog_template_key ?? lead.giro)) ?? null;
}

/** /registro prefilled for this prospect; the token credits the registration to whoever works it. */
export function claimPath(lead: ClaimLead, token: string): string {
  const catalog = leadCatalog(lead);
  const query = new URLSearchParams({ prospecto: token, giro: catalog?.businessType ?? lead.giro, nombre: lead.business_name });
  if (catalog) query.set("catalogo", catalog.key);
  if (lead.phone_e164) query.set("telefono", lead.phone_e164.slice(3));
  return `/registro?${query.toString()}`;
}
