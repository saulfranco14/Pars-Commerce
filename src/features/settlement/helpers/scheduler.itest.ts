import { describe, it, expect, afterEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sql, createTestServiceClient } from "@/test/integration/setup";
import { evaluateCycleDue } from "@/features/settlement/helpers/cycleDue";
import { createSettlement } from "@/features/settlement/services/createSettlement";

/**
 * INTEGRATION (S4): the scheduler flow end-to-end against real Postgres — the
 * exact sequence the /api/settlement-run endpoint runs, minus the HTTP shell:
 * read config → evaluate due → createSettlement → stamp last_settled_at.
 */
describe("settlement scheduler flow (S4, integration)", () => {
  const admin = createTestServiceClient() as unknown as SupabaseClient;
  const slug = "itest-sched-tenant";
  let tenantId: string;

  afterEach(async () => {
    await sql`delete from settlement_items where settlement_id in (select id from settlements where tenant_id = ${tenantId ?? ""})`;
    await sql`delete from settlements where tenant_id = ${tenantId ?? ""}`;
    await sql`delete from payments where order_id in (select id from orders where tenant_id = ${tenantId ?? ""})`;
    await sql`delete from orders where tenant_id = ${tenantId ?? ""}`;
    await sql`delete from tenant_settlement_config where tenant_id = ${tenantId ?? ""}`;
    await sql`delete from tenants where slug = ${slug}`;
  });

  async function seed(cycle: string, lastSettledAt: string | null, mpAmounts: number[]) {
    const [t] = await sql`insert into tenants (name, slug) values ('Sched', ${slug}) returning id`;
    tenantId = t.id;
    await sql`
      insert into tenant_settlement_config (tenant_id, cycle_type, last_settled_at)
      values (${tenantId}, ${cycle}, ${lastSettledAt})`;
    for (let i = 0; i < mpAmounts.length; i++) {
      const [o] = await sql`insert into orders (tenant_id, payment_method, status, total) values (${tenantId}, 'mercadopago', 'paid', ${mpAmounts[i]}) returning id`;
      await sql`insert into payments (order_id, provider, external_id, status, amount, payment_kind) values (${o.id}, 'mercadopago', ${"mp-sch-" + i}, 'approved', ${mpAmounts[i]}, 'single')`;
    }
  }

  it("settles a due tenant and stamps last_settled_at", async () => {
    // never settled → due; weekly cycle; 300 in MP charges
    await seed("weekly", null, [100, 200]);
    // `now` must be AFTER the charges' created_at (they're inserted with now()),
    // so the period [epoch, now] includes them. Use a far-future bound.
    const now = new Date("2100-01-01T00:00:00Z");

    const [cfg] = await sql`select cycle_type, custom_cycle_days, last_settled_at from tenant_settlement_config where tenant_id = ${tenantId}`;
    const due = evaluateCycleDue(cfg.cycle_type, cfg.last_settled_at, now, cfg.custom_cycle_days);
    expect(due.due).toBe(true);

    const res = await createSettlement(admin, {
      tenantId,
      cycle: "weekly",
      periodStart: due.periodStart,
      periodEnd: due.periodEnd,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.amountToTransfer).toBe(291); // 300 - 3%

    // scheduler would then stamp last_settled_at
    await sql`update tenant_settlement_config set last_settled_at = ${due.periodEnd} where tenant_id = ${tenantId}`;
    const [after] = await sql`select last_settled_at from tenant_settlement_config where tenant_id = ${tenantId}`;
    expect(after.last_settled_at).not.toBeNull();
  });

  it("does not settle a tenant whose cycle has not elapsed", async () => {
    const now = new Date("2026-07-18T00:00:00Z");
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    await seed("weekly", twoDaysAgo, [100]); // weekly, only 2 days elapsed

    const [cfg] = await sql`select cycle_type, custom_cycle_days, last_settled_at from tenant_settlement_config where tenant_id = ${tenantId}`;
    const due = evaluateCycleDue(cfg.cycle_type, cfg.last_settled_at, now, cfg.custom_cycle_days);
    expect(due.due).toBe(false);

    // no settlement should exist for this tenant
    const rows = await sql`select count(*)::int as n from settlements where tenant_id = ${tenantId}`;
    expect(rows[0].n).toBe(0);
  });
});
