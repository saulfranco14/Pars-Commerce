import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { sql } from "@/test/integration/setup";

/**
 * The offers rollout ships in two steps so production never breaks:
 *  1. expand (offers_foundation + offer_plans) — the cart code already live
 *     upserts ON CONFLICT (cart_id, product_id, product_variant_id) and must
 *     keep working;
 *  2. contract (cart_group_key) — applied after the new cart code ships.
 * Everything runs in a transaction that is always rolled back.
 */
const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8").replace(/^\s*(BEGIN|COMMIT);\s*$/gim, "");
const CONTRACT = read("../../../../supabase/migrations/20261023000001_cart_group_key.sql");
const CONTRACT_ROLLBACK = read("../../../../supabase/snippets/cart_group_key_rollback.sql");

class RolledBack extends Error {}

const TENANT = "00000000-0000-0000-0000-00000000c0a1";
const PRODUCT = "00000000-0000-0000-0000-00000000c0a2";
const CART = "00000000-0000-0000-0000-00000000c0a3";

describe("cart group key rollout", () => {
  it("keeps the live upsert working after step 1 and allows packs after step 2", async () => {
    const outcome: Record<string, unknown> = {};

    await expect(
      sql.begin(async (tx) => {
        await tx.unsafe(CONTRACT_ROLLBACK);
        await tx`insert into tenants (id, name, slug) values (${TENANT}, 'Rollout', 'itest-cart-key-rollout')`;
        await tx`insert into products (id, tenant_id, name, slug, price) values (${PRODUCT}, ${TENANT}, 'Jabón', 'jabon', 45)`;
        await tx`insert into public_carts (id, tenant_id, fingerprint_id) values (${CART}, ${TENANT}, 'rollout')`;

        const legacyUpsert = (quantity: number) => tx`
          insert into public_cart_items (cart_id, product_id, quantity, price_snapshot)
          values (${CART}, ${PRODUCT}, ${quantity}, 45)
          on conflict (cart_id, product_id, product_variant_id) do update set quantity = excluded.quantity`;
        await legacyUpsert(1);
        await legacyUpsert(4);
        outcome.afterExpand = (await tx`select quantity from public_cart_items where cart_id = ${CART}`).map((row) => row.quantity);

        await tx.unsafe(CONTRACT);
        await tx`
          insert into public_cart_items (cart_id, product_id, quantity, price_snapshot, group_id, group_unit_quantity)
          values (${CART}, ${PRODUCT}, 2, 30, gen_random_uuid(), 2)`;
        outcome.afterContract = (await tx`select count(*)::int as lines from public_cart_items where cart_id = ${CART}`)[0].lines;
        outcome.legacyAfterContract = await tx
          .savepoint((sp) => sp`
            insert into public_cart_items (cart_id, product_id, quantity, price_snapshot)
            values (${CART}, ${PRODUCT}, 1, 45)
            on conflict (cart_id, product_id, product_variant_id) do update set quantity = excluded.quantity`)
          .then(() => "ok", (error: Error) => error.message);
        throw new RolledBack();
      }),
    ).rejects.toBeInstanceOf(RolledBack);

    expect(outcome.afterExpand).toEqual([4]);
    expect(outcome.afterContract).toBe(2);
    expect(outcome.legacyAfterContract).toMatch(/no unique or exclusion constraint/);
  });
});
