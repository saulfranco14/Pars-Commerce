import "server-only";
import { roleHasPermission } from "@/lib/auth/permissions";
import { getStudioCatalog } from "./studioCatalogService";
import { requireStudioAccess } from "./studioAccessService";
import { requireStudioData } from "./studioErrors";
import { studioFlags } from "./studioFlags";
import { isStudioMembershipActive } from "../helpers/access";
import type {
  StudioDesign,
  StudioPermission,
  StudioSummary,
} from "../interfaces/studio";

export async function getStudioSummary(
  tenantId: string,
): Promise<StudioSummary> {
  const access = await requireStudioAccess(tenantId);
  const { db, membership, owner, permissions } = access;
  const flags = studioFlags();
  if (flags.enabled) {
    // Idempotent in SQL; a failure only delays the gift until the next visit.
    const starter = await db.rpc("studio_grant_starter_credits", {
      p_tenant_id: tenantId,
    });
    if (starter.error)
      console.error("[studio] starter credits failed", {
        code: starter.error.code,
      });
  }
  const [catalog, grants, recent, designs, ready, placements] =
    await Promise.all([
      getStudioCatalog(),
      db
        .from("studio_credit_grants")
        .select("kind,remaining,reserved,expires_at")
        .eq("tenant_id", tenantId),
      db
        .from("studio_designs")
        .select("*")
        .eq("tenant_id", tenantId)
        .neq("status", "archived")
        .order("updated_at", { ascending: false })
        .limit(6),
      db
        .from("studio_designs")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId),
      db
        .from("studio_designs")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "ready"),
      db
        .from("studio_placements")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("is_active", true),
    ]);
  const balance = {
    monthly: 0,
    purchased: 0,
    reserved: 0,
    available: 0,
    expiresAt: null as string | null,
  };
  for (const grant of requireStudioData(grants)) {
    balance.reserved += grant.reserved;
    if (grant.expires_at && new Date(grant.expires_at) <= new Date()) continue;
    const available = grant.remaining - grant.reserved;
    if (grant.kind === "subscription") {
      balance.monthly += available;
      if (
        available > 0 &&
        (!balance.expiresAt || grant.expires_at! < balance.expiresAt)
      )
        balance.expiresAt = grant.expires_at;
    } else balance.purchased += available;
    balance.available += available;
  }
  const allowed: StudioPermission[] = [
    "studio.read",
    "studio.create",
    "studio.publish",
    "studio.manage",
  ];
  return {
    membership,
    active: isStudioMembershipActive(membership),
    enabled: flags.enabled,
    checkoutEnabled: flags.checkout,
    aiEnabled: flags.ai && !membership?.ai_blocked,
    publishEnabled: flags.publish,
    owner,
    permissions: allowed.filter((p) =>
      roleHasPermission(owner ? "owner" : "", permissions, p),
    ),
    balance,
    ...catalog,
    recent: requireStudioData(recent) as unknown as StudioDesign[],
    counts: {
      designs: designs.count ?? 0,
      ready: ready.count ?? 0,
      placements: placements.count ?? 0,
    },
  };
}
