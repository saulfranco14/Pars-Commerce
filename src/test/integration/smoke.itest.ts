import { describe, it, expect, afterEach } from "vitest";
import { sql } from "@/test/integration/setup";

/**
 * Integration smoke — confirms the local Postgres (all 49 migrations applied)
 * is reachable, a write→read round-trips, and per-test cleanup isolates
 * cases. This is the layer the fake cannot give us: real SQL, real schema.
 */
describe("integration infra smoke", () => {
  const slug = "itest-smoke-tenant";

  afterEach(async () => {
    await sql`delete from tenants where slug = ${slug}`;
  });

  it("inserts a tenant into real Postgres and reads it back", async () => {
    const inserted = await sql`
      insert into tenants (name, slug)
      values ('ITest Smoke', ${slug})
      returning id, name, slug
    `;
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({ name: "ITest Smoke", slug });

    const readBack = await sql`select id, name, slug from tenants where slug = ${slug}`;
    expect(readBack[0]).toMatchObject({ name: "ITest Smoke", slug });
  });

  it("cleanup from the previous test isolated the row", async () => {
    const rows = await sql`select id from tenants where slug = ${slug}`;
    expect(rows).toHaveLength(0);
  });
});
