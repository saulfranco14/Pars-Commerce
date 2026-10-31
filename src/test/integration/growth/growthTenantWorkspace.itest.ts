import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { sql } from "@/test/integration/setup";

import type { TransactionSql } from "postgres";

const ROLLBACK = readFileSync(fileURLToPath(new URL("../../../../supabase/snippets/growth_tenant_workspaces_rollback.sql", import.meta.url)), "utf8")
  .replace(/^\s*(BEGIN|COMMIT);\s*$/gim, "");

const TENANT = "00000000-0000-4000-8000-0000000000e1";
const OWNER = "00000000-0000-4000-8000-0000000000e2";
const STAFF = "00000000-0000-4000-8000-0000000000e3";

class RolledBack extends Error {}

async function inRollback(run: (tx: TransactionSql) => Promise<void>) {
  await expect(
    sql.begin(async (tx) => {
      await run(tx);
      throw new RolledBack();
    }),
  ).rejects.toBeInstanceOf(RolledBack);
}

async function seed(tx: TransactionSql) {
  await tx`insert into auth.users (id, email) values (${OWNER}, 'itest-eventos@tlaco.app'), (${STAFF}, 'itest-staff-eventos@tlaco.app')`;
  await tx`insert into tenants (id, name, slug) values (${TENANT}, 'ITest Eventos', 'itest-eventos')`;
  const [owner] = await tx`select id from tenant_roles where tenant_id = ${TENANT} and name = 'owner'`;
  const [member] = await tx`select id from tenant_roles where tenant_id = ${TENANT} and name = 'member'`;
  await tx`insert into tenant_memberships (tenant_id, user_id, role_id) values (${TENANT}, ${OWNER}, ${owner.id}) on conflict do nothing`;
  await tx`insert into tenant_memberships (tenant_id, user_id, role_id) values (${TENANT}, ${STAFF}, ${member.id}) on conflict do nothing`;
  return member.id as string;
}

describe("growth: a business prospecting with its own workspace", () => {
  it("opens only on a plan with prospecting, for roles that may prospect, with starter copy", async () => {
    await inRollback(async (tx) => {
      const memberRole = await seed(tx);
      const [free] = await tx`select growth_tenant_workspace(${TENANT}, ${OWNER}) as ws`;
      expect(free.ws).toBeNull();

      await tx`update tenant_billing_accounts set plan_code = 'scale' where tenant_id = ${TENANT}`;
      const [{ ws }] = await tx`select growth_tenant_workspace(${TENANT}, ${OWNER}) as ws`;
      expect(ws).not.toBeNull();
      const [again] = await tx`select growth_tenant_workspace(${TENANT}, ${OWNER}) as ws`;
      expect(again.ws).toBe(ws);
      const steps = await tx`select step from growth_templates where workspace_id = ${ws} and status = 'active' order by step`;
      expect(steps.map((row) => row.step)).toEqual(["m1", "seguimiento", "si", "ultimo", "vio_tienda"]);

      const roles = async () => (await tx`select growth_member_role(${ws}, ${OWNER}) as owner, growth_member_role(${ws}, ${STAFF}) as staff`)[0];
      expect(await roles()).toEqual({ owner: "coordinador", staff: null });
      expect((await tx`select growth_tenant_workspace(${TENANT}, ${STAFF}) as ws`)[0].ws).toBeNull();

      await tx`update tenant_roles set permissions = coalesce(permissions, '[]'::jsonb) || '["prospects.work"]'::jsonb where id = ${memberRole}`;
      expect(await roles()).toEqual({ owner: "coordinador", staff: "prospector" });

      // A phone Tlaco already works can still be a prospect of this business.
      await tx`select * from growth_upsert_leads(${tx.json([{ denue_id: "itest-eventos-tlaco", business_name: "ITest Tacos", giro: "taqueria", municipio: "ITest", phone_e164: "+525500000799" }] as never)})`;
      const [added] = await tx`select growth_add_lead(${ws}, ${OWNER}, ${tx.json({ business_name: "ITest Tacos", phone_e164: "+525500000799", giro: "taqueria", municipio: "ITest" } as never)}) as r`;
      expect(added.r.status).toBe("created");
    });
  });

  it("the rollback snippet removes business workspaces and restores the role check", async () => {
    await inRollback(async (tx) => {
      await tx.unsafe(ROLLBACK);
      const [fn] = await tx`select count(*)::int as n from pg_proc where proname = 'growth_tenant_workspace'`;
      expect(fn.n).toBe(0);
      const [plan] = await tx`select entitlements ? 'prospecting' as has from billing_plans where code = 'scale'`;
      expect(plan.has).toBe(false);
    });
  });
});
