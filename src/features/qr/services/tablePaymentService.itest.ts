import { describe, it, expect, afterEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  sql,
  createTestServiceClient,
} from "@/test/integration/setup";
import { areAllSplitGroupsPaid } from "@/features/qr/services/tablePaymentService";

/**
 * INTEGRATION (T1-INT): the same payment logic, but against real Postgres.
 *
 * What the fake CANNOT give us and this DOES:
 *  - proves `areAllSplitGroupsPaid`'s real `.select("id, payment_status")`
 *    hits COLUMNS THAT EXIST (a fake would happily return a renamed column).
 *  - proves the query behaves the same against a real schema + real rows.
 *
 * Fixtures are seeded via direct `sql` (superuser, bypasses RLS/grants).
 * The service itself runs through the supabase-js service client — the same
 * path production uses.
 */
describe("areAllSplitGroupsPaid — against real Postgres (T1-INT)", () => {
  const admin = createTestServiceClient() as unknown as SupabaseClient;
  const tenantSlug = "itest-pay-tenant";
  let tenantId: string;
  let orderId: string;

  afterEach(async () => {
    // Clean children→parents (FK order). Cascade would also work but explicit
    // is clearer about what the test created.
    await sql`delete from order_split_groups where order_id = ${orderId ?? ""}`;
    await sql`delete from orders where id = ${orderId ?? ""}`;
    await sql`delete from tenants where slug = ${tenantSlug}`;
  });

  async function seedOrderWithGroups(
    statuses: string[],
  ): Promise<void> {
    const [tenant] = await sql`
      insert into tenants (name, slug) values ('ITest Pay', ${tenantSlug})
      returning id`;
    tenantId = tenant.id;
    const [order] = await sql`
      insert into orders (tenant_id) values (${tenantId})
      returning id`;
    orderId = order.id;
    for (let i = 0; i < statuses.length; i++) {
      await sql`
        insert into order_split_groups (order_id, label, payment_status)
        values (${orderId}, ${"G" + i}, ${statuses[i]})`;
    }
  }

  it("real query returns true when all groups are paid", async () => {
    await seedOrderWithGroups(["paid", "paid"]);
    expect(await areAllSplitGroupsPaid(admin, orderId)).toBe(true);
  });

  it("real query returns false when one group is pending", async () => {
    await seedOrderWithGroups(["paid", "pending"]);
    expect(await areAllSplitGroupsPaid(admin, orderId)).toBe(false);
  });
});
