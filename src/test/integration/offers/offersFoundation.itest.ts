import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestAnonClient, createTestServiceClient, sql } from "@/test/integration/setup";

import { addProductLine, addPromotionGroup, removeLine } from "@/features/checkout/services/cartLineService";
import { repriceCart } from "@/features/checkout/services/cartPricingService";

/**
 * 20261021000001_offers_foundation against real Postgres: defaults keep the
 * old meaning, the new cart key allows "standalone + in a pack" but nothing
 * else, RLS hides paused promotions, and save_promotion is atomic.
 */
const SLUG = "itest-offers-foundation";

interface Seed {
  tenantId: string;
  cartId: string;
  beerId: string;
  chipsId: string;
}

async function seed(): Promise<Seed> {
  const [tenant] = await sql`
    insert into tenants (name, slug, public_store_enabled)
    values ('ITest Offers', ${SLUG}, true)
    returning id`;
  const [beer] = await sql`
    insert into products (tenant_id, name, slug, price, is_public)
    values (${tenant.id}, 'Cerveza', 'cerveza', 40, true) returning id`;
  const [chips] = await sql`
    insert into products (tenant_id, name, slug, price, is_public)
    values (${tenant.id}, 'Papas', 'papas', 30, true) returning id`;
  const [cart] = await sql`
    insert into public_carts (tenant_id, fingerprint_id)
    values (${tenant.id}, 'itest-fingerprint') returning id`;
  return { tenantId: tenant.id, cartId: cart.id, beerId: beer.id, chipsId: chips.id };
}

describe("offers foundation migration", () => {
  let data: Seed;

  beforeEach(async () => {
    data = await seed();
  });

  afterEach(async () => {
    await sql`delete from tenants where slug = ${SLUG}`;
  });

  it("gives promotions written the old way the defaults that keep today's behavior", async () => {
    const [row] = await sql`
      insert into promotions (tenant_id, name, type, value, product_ids)
      values (${data.tenantId}, 'Legacy', 'percentage', 10, ${[data.beerId]}::uuid[])
      returning status, applies_to, archived_at`;
    expect(row).toMatchObject({ status: "active", applies_to: "products", archived_at: null });
  });

  it("rejects unknown promotion types and invalid 2x1 quantities", async () => {
    await expect(
      sql`insert into promotions (tenant_id, name, type, value) values (${data.tenantId}, 'X', 'mystery', 1)`,
    ).rejects.toThrow(/promotions_type_check/);
    await expect(
      sql`insert into promotions (tenant_id, name, type, value, buy_quantity, pay_quantity)
          values (${data.tenantId}, 'X', 'nxm', 0, 2, 2)`,
    ).rejects.toThrow(/promotions_nxm_check/);
  });

  it("shows active promotions to visitors and hides paused ones", async () => {
    await sql`
      insert into promotions (tenant_id, name, type, value, status)
      values (${data.tenantId}, 'Visible', 'percentage', 10, 'active'),
             (${data.tenantId}, 'Pausada', 'percentage', 10, 'paused')`;
    const { data: rows } = await createTestAnonClient()
      .from("promotions")
      .select("name")
      .eq("tenant_id", data.tenantId);
    expect((rows ?? []).map((row) => row.name)).toEqual(["Visible"]);
  });

  it("keeps one standalone line per product but allows the same product inside a pack", async () => {
    await sql`insert into public_cart_items (cart_id, product_id, quantity, price_snapshot)
              values (${data.cartId}, ${data.beerId}, 1, 40)`;
    await expect(
      sql`insert into public_cart_items (cart_id, product_id, quantity, price_snapshot)
          values (${data.cartId}, ${data.beerId}, 1, 40)`,
    ).rejects.toThrow(/public_cart_items_cart_product_variant_key/);
    await sql`insert into public_cart_items (cart_id, product_id, quantity, price_snapshot, group_id, group_unit_quantity)
              values (${data.cartId}, ${data.beerId}, 2, 36, gen_random_uuid(), 2)`;
    const [{ count }] = await sql`select count(*)::int as count from public_cart_items where cart_id = ${data.cartId}`;
    expect(count).toBe(2);
  });

  it("still lets PostgREST upsert a standalone line with the new four-column key", async () => {
    const client = createTestServiceClient();
    const row = { cart_id: data.cartId, product_id: data.beerId, product_variant_id: null, group_id: null, quantity: 1, price_snapshot: 40 };
    await client.from("public_cart_items").upsert(row, { onConflict: "cart_id,product_id,product_variant_id,group_id" });
    const { error } = await client
      .from("public_cart_items")
      .upsert({ ...row, quantity: 3 }, { onConflict: "cart_id,product_id,product_variant_id,group_id" });
    expect(error).toBeNull();
    const lines = await sql`select quantity from public_cart_items where cart_id = ${data.cartId}`;
    expect(lines.map((line) => line.quantity)).toEqual([3]);
  });

  it("saves a promotion and its pack items atomically", async () => {
    const client = createTestServiceClient();
    const { data: id, error } = await client.rpc("save_promotion", {
      p_promotion: { tenant_id: data.tenantId, name: "Combo", slug: "combo", type: "bundle_price", value: 99 },
      p_items: [
        { product_id: data.beerId, quantity: 2 },
        { product_id: data.chipsId, quantity: 1 },
      ],
    });
    expect(error).toBeNull();
    const items = await sql`select product_id, quantity from promotion_items where promotion_id = ${id} order by position`;
    expect(items).toHaveLength(2);

    const { error: badItem } = await client.rpc("save_promotion", {
      p_promotion: { tenant_id: data.tenantId, name: "Roto", slug: "roto", type: "bundle_price", value: 50 },
      p_items: [{ product_id: "00000000-0000-0000-0000-000000000000", quantity: 1 }],
    });
    expect(badItem).not.toBeNull();
    const [{ count }] = await sql`select count(*)::int as count from promotions where tenant_id = ${data.tenantId} and slug = 'roto'`;
    expect(count).toBe(0);
  });

  it("does not let visitors call save_promotion", async () => {
    const { error } = await createTestAnonClient().rpc("save_promotion", {
      p_promotion: { tenant_id: data.tenantId, name: "Hack", type: "percentage", value: 50 },
    });
    expect(error).not.toBeNull();
  });

  it("runs the cart services end to end against the real schema", async () => {
    const client = createTestServiceClient();
    const { data: promotionId } = await client.rpc("save_promotion", {
      p_promotion: { tenant_id: data.tenantId, name: "Combo", slug: "combo-e2e", type: "bundle_price", value: 99 },
      p_items: [
        { product_id: data.beerId, quantity: 2 },
        { product_id: data.chipsId, quantity: 1 },
      ],
    });

    await addProductLine(client, { cartId: data.cartId, tenantId: data.tenantId, productId: data.beerId, quantity: 1 });
    await addPromotionGroup(client, { cartId: data.cartId, tenantId: data.tenantId, promotionId: promotionId as string });
    const lines = await sql`select product_id, quantity, price_snapshot, group_id from public_cart_items where cart_id = ${data.cartId}`;
    expect(lines).toHaveLength(3);
    const packTotal = lines.filter((line) => line.group_id).reduce((sum, line) => sum + Number(line.price_snapshot) * line.quantity, 0);
    expect(packTotal).toBeLessThanOrEqual(99);

    await sql`update promotions set status = 'paused' where id = ${promotionId as string}`;
    const repriced = await repriceCart(client, { tenantId: data.tenantId, cartId: data.cartId });
    expect(repriced).toEqual({ ok: true, data: { changed: true } });
    const after = await sql`select product_id, quantity, price_snapshot, group_id from public_cart_items where cart_id = ${data.cartId}`;
    expect(after.every((line) => line.group_id === null)).toBe(true);
    expect(after.find((line) => line.product_id === data.beerId)).toMatchObject({ quantity: 3 });

    const beerLine = await sql`select id from public_cart_items where cart_id = ${data.cartId} and product_id = ${data.beerId}`;
    await removeLine(client, { cartId: data.cartId, itemId: beerLine[0].id });
    const [{ count }] = await sql`select count(*)::int as count from public_cart_items where cart_id = ${data.cartId}`;
    expect(count).toBe(1);
  });
});
