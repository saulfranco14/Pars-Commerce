import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { sql } from "@/test/integration/setup";

/**
 * The rollback script must run cleanly on a migrated database and leave the
 * schema the deployed code expects. It runs inside a transaction that is
 * always rolled back, so the test database keeps the migration.
 */
const ROLLBACK_PATH = fileURLToPath(
  new URL("../../../../supabase/snippets/offers_foundation_rollback.sql", import.meta.url),
);

class RolledBack extends Error {}

describe("offers foundation rollback", () => {
  it("restores the previous schema", async () => {
    const script = readFileSync(ROLLBACK_PATH, "utf8").replace(/^\s*(BEGIN|COMMIT);\s*$/gim, "");
    let columns: string[] = [];
    let constraint: unknown[] = [];

    await expect(
      sql.begin(async (tx) => {
        await tx.unsafe(script);
        const rows = await tx`
          select table_name || '.' || column_name as name
          from information_schema.columns
          where table_schema = 'public'
            and column_name in ('status', 'applies_to', 'group_id', 'list_unit_price', 'offer_group_id')
            and table_name in ('promotions', 'public_cart_items', 'order_items')`;
        columns = rows.map((row) => row.name as string);
        constraint = [
          ...(await tx`
            select pg_get_constraintdef(oid) as definition
            from pg_constraint
            where conname = 'public_cart_items_cart_product_variant_key'`),
        ];
        throw new RolledBack();
      }),
    ).rejects.toBeInstanceOf(RolledBack);

    expect(columns).toEqual([]);
    expect(String((constraint[0] as { definition?: string })?.definition)).toContain("(cart_id, product_id, product_variant_id)");
  });
});
