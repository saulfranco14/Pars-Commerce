import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";

import { ensureCatalogTemplates } from "@/features/catalog/catalogBootstrap";
import { GROCERY_CATEGORIES } from "@/features/catalog/groceryStarterCatalog";
import { createTestServiceClient, sql } from "@/test/integration/setup";

import type { TransactionSql } from "postgres";

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
const ROLLBACK = read("../../../../supabase/snippets/catalog_template_visibility_rollback.sql").replace(
  /^\s*(BEGIN|COMMIT);\s*$/gim,
  "",
);

class RolledBack extends Error {}

const USER = "00000000-0000-0000-0000-0000000ca7a1";
const GROCERY_SLUG = "itest-grocery-template";

async function seedTemplate(tx: TransactionSql) {
  await tx`insert into auth.users (id, email) values (${USER}, 'catalog-itest@tlaco.app')`;
  const [template] = await tx`
    insert into catalog_templates (key, business_type, name) values ('itest-visibility', 'tienda', 'ITest')
    returning id`;
  const [category] = await tx`
    insert into catalog_template_categories (template_id, name, slug) values (${template.id}, 'Mostrador', 'mostrador')
    returning id`;
  await tx`
    insert into catalog_template_items (template_id, category_id, type, name, slug, price, initial_stock, is_public)
    values (${template.id}, ${category.id}, 'product', 'Refresco', 'refresco', 20, 5, true),
           (${template.id}, ${category.id}, 'product', 'Cigarro suelto', 'cigarro-suelto', 6, 5, false)`;
}

async function createTenant(tx: TransactionSql, slug: string) {
  const [tenant] = await tx`
    select id from create_tenant_with_catalog(${USER}, 'ITest Tienda', ${slug}, 'tienda', 'itest-visibility')`;
  const rows = await tx`select slug, is_public from products where tenant_id = ${tenant.id} order by slug`;
  return Object.fromEntries(rows.map((row) => [row.slug, row.is_public]));
}

describe("catalog template visibility", () => {
  it("copies is_public from the template; without the migration every item went public", async () => {
    const outcome: Record<string, unknown> = {};
    await expect(
      sql.begin(async (tx) => {
        await seedTemplate(tx);
        outcome.withRule = await createTenant(tx, "itest-visibility-a");

        await tx.unsafe(ROLLBACK);
        outcome.withoutRule = await createTenant(tx, "itest-visibility-b");
        throw new RolledBack();
      }),
    ).rejects.toBeInstanceOf(RolledBack);

    expect(outcome.withRule).toEqual({ "cigarro-suelto": false, refresco: true });
    expect(outcome.withoutRule).toEqual({ "cigarro-suelto": true, refresco: true });
  });
});

describe("grocery starter template", () => {
  afterAll(async () => {
    const tenants = sql`select id from tenants where slug = ${GROCERY_SLUG}`;
    const products = sql`select id from products where tenant_id in (${tenants})`;
    await sql`delete from inventory_movements where product_id in (${products})`;
    await sql`delete from product_images where product_id in (${products})`;
    await sql`delete from product_inventory where product_id in (${products})`;
    await sql`delete from products where tenant_id in (${tenants})`;
    await sql`delete from product_subcatalogs where tenant_id in (${tenants})`;
    await sql`delete from tenant_memberships where tenant_id in (${tenants})`;
    await sql`delete from tenants where slug = ${GROCERY_SLUG}`;
    await sql`delete from auth.users where id = ${USER}`;
  });

  it("signs up a tienda with the full catalog and cigarettes kept off the public site", async () => {
    const admin = createTestServiceClient();
    await ensureCatalogTemplates(admin);
    await sql`insert into auth.users (id, email) values (${USER}, 'catalog-itest@tlaco.app') on conflict do nothing`;

    const { data, error } = await admin.rpc("create_tenant_with_catalog", {
      p_owner_user_id: USER,
      p_name: "ITest Abarrotes",
      p_slug: GROCERY_SLUG,
      p_business_type: "tienda",
      p_catalog_template_key: "tienda",
    });
    expect(error).toBeNull();

    const expectedProducts = GROCERY_CATEGORIES.reduce((total, category) => total + category.items.length, 0);
    const hidden = GROCERY_CATEGORIES.filter((category) => category.isPublic === false).flatMap((c) => c.items);
    expect(data?.[0]).toMatchObject({ products_created: expectedProducts, services_created: 4 });

    const [counts] = await sql`
      select count(*) filter (where p.type = 'product')::int as products,
             count(*) filter (where p.type = 'product' and not p.is_public)::int as hidden,
             count(*) filter (where p.unit = 'kg')::int as by_kilo,
             count(i.product_id)::int as stocked
      from products p
      join tenants t on t.id = p.tenant_id
      left join product_inventory i on i.product_id = p.id
      where t.slug = ${GROCERY_SLUG}`;
    expect(counts).toEqual({ products: expectedProducts, hidden: hidden.length, by_kilo: 2, stocked: expectedProducts });
  });
});
