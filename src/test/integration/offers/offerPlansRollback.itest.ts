import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { sql } from "@/test/integration/setup";

/** Runs the rollback inside a transaction that is always rolled back. */
const ROLLBACK_PATH = fileURLToPath(
  new URL("../../../../supabase/snippets/offer_plans_rollback.sql", import.meta.url),
);

class RolledBack extends Error {}

describe("offer plans rollback", () => {
  it("restores the previous schema", async () => {
    const script = readFileSync(ROLLBACK_PATH, "utf8").replace(/^\s*(BEGIN|COMMIT);\s*$/gim, "");
    let leftovers: string[] = [];
    let statusCheck = "";

    await expect(
      sql.begin(async (tx) => {
        await tx.unsafe(script);
        const rows = await tx`
          select table_name || coalesce('.' || column_name, '') as name
          from information_schema.columns
          where table_schema = 'public'
            and (table_name in ('offer_plans', 'offer_plan_items', 'public_cart_plans', 'subscription_periods', 'order_plan_charges')
              or (table_name = 'subscriptions' and column_name in ('offer_plan_id', 'public_token', 'current_period_number'))
              or (table_name = 'order_items' and column_name in ('line_kind', 'subscription_id')))`;
        leftovers = rows.map((row) => row.name as string);
        const [check] = await tx`
          select pg_get_constraintdef(oid) as definition from pg_constraint where conname = 'subscriptions_status_check'`;
        statusCheck = String(check?.definition);
        throw new RolledBack();
      }),
    ).rejects.toBeInstanceOf(RolledBack);

    expect(leftovers).toEqual([]);
    expect(statusCheck).not.toContain("past_due");
    expect(statusCheck).toContain("cancelled");
  });
});
