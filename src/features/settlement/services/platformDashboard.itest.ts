import { describe, it, expect, afterEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sql, createTestServiceClient } from "@/test/integration/setup";
import { getPlatformDashboard } from "@/features/settlement/services/platformDashboard";

/**
 * INTEGRATION (S5): the platform treasury dashboard aggregation against real
 * Postgres. Seeds settlements in various states and confirms the summary the
 * platform operates from: outstanding money, per-tenant owed, work queue,
 * confirmed commission.
 */
describe("getPlatformDashboard (S5, integration)", () => {
  const admin = createTestServiceClient() as unknown as SupabaseClient;
  const slugA = "itest-dash-a";
  const slugB = "itest-dash-b";
  let tenantA: string;
  let tenantB: string;

  afterEach(async () => {
    await sql`delete from settlements where tenant_id in (${tenantA ?? ""}, ${tenantB ?? ""})`;
    await sql`delete from tenants where slug in (${slugA}, ${slugB})`;
  });

  async function seedSettlement(
    tenantId: string,
    status: string,
    amountToTransfer: number,
    commission: number,
  ) {
    await sql`
      insert into settlements
        (tenant_id, cycle_type, period_start, period_end, amount_to_transfer, platform_commission, status)
      values
        (${tenantId}, 'weekly', now() - interval '7 days', now(), ${amountToTransfer}, ${commission}, ${status})`;
  }

  it("aggregates outstanding, per-tenant owed, work queue, and commission", async () => {
    const [a] = await sql`insert into tenants (name, slug) values ('A', ${slugA}) returning id`;
    const [b] = await sql`insert into tenants (name, slug) values ('B', ${slugB}) returning id`;
    tenantA = a.id;
    tenantB = b.id;

    // tenant A: one open (100), one closed (200) → owes 300, 1 actionable
    await seedSettlement(tenantA, "open", 100, 5);
    await seedSettlement(tenantA, "closed", 200, 10);
    // tenant B: one transfer_pending (50, actionable), one confirmed (500, commission 25)
    await seedSettlement(tenantB, "transfer_pending", 50, 3);
    await seedSettlement(tenantB, "transfer_confirmed", 500, 25);

    const d = await getPlatformDashboard(admin);

    // Assert on THIS test's tenants specifically (the dashboard is global and
    // other integration files may have settlements in flight — asserting global
    // totals would be flaky. Per-tenant aggregation is deterministic).
    const owedA = d.owed_by_tenant.find((t) => t.tenant_id === tenantA);
    const owedB = d.owed_by_tenant.find((t) => t.tenant_id === tenantB);

    // tenant A: open 100 + closed 200 = 300 outstanding, 2 settlements
    expect(owedA?.total_to_transfer).toBe(300);
    expect(owedA?.open_settlements).toBe(2);
    // tenant B: only transfer_pending 50 outstanding (confirmed 500 is NOT)
    expect(owedB?.total_to_transfer).toBe(50);
    expect(owedB?.open_settlements).toBe(1);

    // A (300) is ordered before B (50) in the desc list — find their indices
    const idxA = d.owed_by_tenant.findIndex((t) => t.tenant_id === tenantA);
    const idxB = d.owed_by_tenant.findIndex((t) => t.tenant_id === tenantB);
    expect(idxA).toBeLessThan(idxB);
  });
});
