import { describe, expect, it } from "vitest";

import { sql } from "@/test/integration/setup";

import type { TransactionSql } from "postgres";

class RolledBack extends Error {}

const WITH_SHOP = "00000000-0000-4000-8000-0000000000a7";
const NO_SHOP = "00000000-0000-4000-8000-0000000000b7";
const TENANT = "00000000-0000-4000-8000-0000000000c7";

async function inRollback(run: (tx: TransactionSql) => Promise<void>) {
  await expect(
    sql.begin(async (tx) => {
      await run(tx);
      throw new RolledBack();
    }),
  ).rejects.toBeInstanceOf(RolledBack);
}

async function seed(tx: TransactionSql) {
  await tx`insert into auth.users (id, email, last_sign_in_at) values (${WITH_SHOP}, 'itest-con-tienda@tlaco.app', now()), (${NO_SHOP}, 'itest-sin-tienda@tlaco.app', now() - interval '20 days')`;
  await tx`insert into tenants (id, name, slug) values (${TENANT}, 'ITest Usuarios', 'itest-usuarios')`;
  const [role] = await tx`select id from tenant_roles where tenant_id = ${TENANT} and name = 'owner'`;
  await tx`insert into tenant_memberships (tenant_id, user_id, role_id) values (${TENANT}, ${WITH_SHOP}, ${role.id}) on conflict do nothing`;
}

async function list(tx: TransactionSql, filters: Record<string, unknown>) {
  const [{ r }] = await tx`select platform_users_overview(${tx.json({ q: "itest-", ...filters } as never)}, 'email', false, 1, 50) as r`;
  return r as { total: number; rows: Array<{ id: string; activation: string; mp_connected: boolean; tenant: { name: string } | null }> };
}

describe("platform: users as a filtered table", () => {
  it("filters by activation, Mercado Pago and idle days in SQL", async () => {
    await inRollback(async (tx) => {
      await seed(tx);
      const all = await list(tx, {});
      expect(all.rows.map((row) => row.id)).toEqual([WITH_SHOP, NO_SHOP]);
      expect(all.rows[0]).toMatchObject({ activation: "registrado", mp_connected: false, tenant: { name: "ITest Usuarios" } });

      expect((await list(tx, { activation: "sin_negocio" })).rows.map((row) => row.id)).toEqual([NO_SHOP]);
      expect((await list(tx, { activation: "sin_mp" })).rows.map((row) => row.id)).toEqual([WITH_SHOP]);
      expect((await list(tx, { idle_days: 14 })).rows.map((row) => row.id)).toEqual([NO_SHOP]);

      await tx`insert into payment_provider_connections (tenant_id, provider, status) values (${TENANT}, 'mercadopago', 'connected')`;
      expect((await list(tx, { mp: "connected" })).rows.map((row) => row.id)).toEqual([WITH_SHOP]);
      expect((await list(tx, { activation: "cobros" })).total).toBe(1);
    });
  });
});
