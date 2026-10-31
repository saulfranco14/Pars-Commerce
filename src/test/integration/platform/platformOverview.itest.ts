import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { sql } from "@/test/integration/setup";

import type { TransactionSql } from "postgres";

const ROLLBACK = readFileSync(fileURLToPath(new URL("../../../../supabase/snippets/platform_overview_rollback.sql", import.meta.url)), "utf8")
  .replace(/^\s*(BEGIN|COMMIT);\s*$/gim, "");
const TENANT = "00000000-0000-4000-8000-0000000000f7";

class RolledBack extends Error {}

async function inRollback(run: (tx: TransactionSql) => Promise<void>) {
  await expect(
    sql.begin(async (tx) => {
      await run(tx);
      throw new RolledBack();
    }),
  ).rejects.toBeInstanceOf(RolledBack);
}

describe("platform: overview without settlements", () => {
  it("counts store views per anonymous visitor and day, and reports them with the stores", async () => {
    await inRollback(async (tx) => {
      await tx`insert into tenants (id, name, slug, public_store_enabled) values (${TENANT}, 'ITest Vista', 'itest-vista', true)`;
      await tx`select track_storefront_view(${TENANT}, 'visitor-hash-one-000')`;
      await tx`select track_storefront_view(${TENANT}, 'visitor-hash-one-000')`;
      await tx`select track_storefront_view(${TENANT}, 'visitor-hash-two-000')`;
      const [row] = await tx`select sum(views)::int as views, count(*)::int as visitors from storefront_daily_views where tenant_id = ${TENANT}`;
      expect(row).toEqual({ views: 3, visitors: 2 });

      const [{ o }] = await tx`select platform_overview(now() - interval '1 day', now() + interval '1 minute') as o`;
      expect(o.registrations).toBeGreaterThanOrEqual(1);
      expect(o.visits).toBeGreaterThanOrEqual(3);
      expect(o.top_stores).toEqual(expect.arrayContaining([expect.objectContaining({ tenant_id: TENANT, visits: 3, mp_connected: false })]));
      expect(o.alerts.published_without_products).toBeGreaterThanOrEqual(1);
    });
  });

  it("the rollback snippet removes the visit table and the functions", async () => {
    await inRollback(async (tx) => {
      await tx.unsafe(ROLLBACK);
      const [left] = await tx`select count(*)::int as n from pg_tables where schemaname = 'public' and tablename = 'storefront_daily_views'`;
      expect(left.n).toBe(0);
    });
  });
});
