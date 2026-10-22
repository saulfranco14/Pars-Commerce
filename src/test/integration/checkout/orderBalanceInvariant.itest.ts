import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { sql } from "@/test/integration/setup";

import type { TransactionSql } from "postgres";

/**
 * #D0A41396: an order created empty by "Nueva orden" got its products through
 * add_order_items_batch, which recomputes `total` but never `balance_due`. The
 * counter then offered "Recibí $0.00". The migration keeps
 * balance_due = total - paid_total on every open order.
 * Everything runs in a transaction that is always rolled back.
 */
const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
const MIGRATION = read("../../../../supabase/migrations/20261025000001_order_balance_invariant.sql");
const ROLLBACK = read("../../../../supabase/snippets/order_balance_invariant_rollback.sql");

class RolledBack extends Error {}

const TENANT = "00000000-0000-0000-0000-0000000ba1a1";
const USER = "00000000-0000-0000-0000-0000000ba1a2";
const PRODUCT = "00000000-0000-0000-0000-0000000ba1a3";

type Tx = TransactionSql;

async function seed(tx: Tx) {
  await tx`insert into auth.users (id, email) values (${USER}, 'balance-itest@tlaco.app')`;
  await tx`insert into tenants (id, name, slug) values (${TENANT}, 'Saldo', 'itest-order-balance')`;
  const [role] = await tx`select id from tenant_roles where tenant_id = ${TENANT} and name = 'owner'`;
  await tx`insert into tenant_memberships (tenant_id, user_id, role_id, status) values (${TENANT}, ${USER}, ${role.id}, 'active')`;
  await tx`insert into products (id, tenant_id, name, slug, price, type) values (${PRODUCT}, ${TENANT}, 'Lavado', 'lavado', 750, 'service')`;
  await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: USER, role: "authenticated" })}, true)`;
}

/** What "Nueva orden" does: an empty order, then its products in one batch. */
async function newOrderWithTwoWashes(tx: Tx) {
  const [order] = await tx`
    insert into orders (tenant_id, status, subtotal, discount, total, source, created_by, assigned_to)
    values (${TENANT}, 'assigned', 0, 0, 0, 'dashboard', ${USER}, ${USER})
    returning id`;
  await tx`select * from add_order_items_batch(${order.id}, ${tx.json([{ product_id: PRODUCT, quantity: 2 }])})`;
  const [row] = await tx`select total::float, paid_total::float, balance_due::float from orders where id = ${order.id}`;
  return { id: order.id as string, ...row };
}

describe("order balance invariant", () => {
  it("adding products keeps the balance owed; without the rule it stayed at 0", async () => {
    const outcome: Record<string, unknown> = {};
    await expect(
      sql.begin(async (tx) => {
        await seed(tx);

        await tx.unsafe(ROLLBACK);
        outcome.withoutRule = await newOrderWithTwoWashes(tx);

        await tx.unsafe(MIGRATION);
        outcome.repaired = (
          await tx`select balance_due::float from orders where id = ${(outcome.withoutRule as { id: string }).id}`
        )[0].balance_due;
        const fresh = await newOrderWithTwoWashes(tx);
        outcome.withRule = fresh;

        await tx`update orders set paid_total = 500 where id = ${fresh.id}`;
        outcome.afterPartial = (await tx`select balance_due::float from orders where id = ${fresh.id}`)[0].balance_due;

        await tx`update orders set status = 'paid', paid_total = 1500, balance_due = 0 where id = ${fresh.id}`;
        outcome.afterPaid = (await tx`select balance_due::float from orders where id = ${fresh.id}`)[0].balance_due;

        // A legacy paid row (no paid_total) is never rewritten.
        await tx`update orders set paid_total = 0 where id = ${fresh.id}`;
        outcome.legacyPaid = (await tx`select balance_due::float from orders where id = ${fresh.id}`)[0].balance_due;
        throw new RolledBack();
      }),
    ).rejects.toBeInstanceOf(RolledBack);

    expect(outcome.withoutRule).toMatchObject({ total: 1500, paid_total: 0, balance_due: 0 });
    expect(outcome.repaired).toBe(1500);
    expect(outcome.withRule).toMatchObject({ total: 1500, balance_due: 1500 });
    expect(outcome.afterPartial).toBe(1000);
    expect(outcome.afterPaid).toBe(0);
    expect(outcome.legacyPaid).toBe(0);
  });
});
