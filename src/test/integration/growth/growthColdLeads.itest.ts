import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { sql } from "@/test/integration/setup";

import type { TransactionSql } from "postgres";

const ROLLBACK = readFileSync(fileURLToPath(new URL("../../../../supabase/snippets/growth_cold_leads_and_variants_rollback.sql", import.meta.url)), "utf8")
  .replace(/^\s*(BEGIN|COMMIT);\s*$/gim, "");

class RolledBack extends Error {}

const TLACO = "00000000-0000-4000-8000-000000000001";
const ANA = "00000000-0000-4000-8000-0000000000a7";
const MUNI = "ITest Frio";

async function inRollback(run: (tx: TransactionSql) => Promise<void>) {
  await expect(
    sql.begin(async (tx) => {
      await run(tx);
      throw new RolledBack();
    }),
  ).rejects.toBeInstanceOf(RolledBack);
}

/** Three contacted leads four days ago: one never opened, one opened, one replied. */
async function seed(tx: TransactionSql) {
  await tx`insert into auth.users (id, email) values (${ANA}, 'ana-frio-itest@tlaco.app')`;
  await tx`insert into growth_members (workspace_id, user_id, role, status, display_name, zones) values (${TLACO}, ${ANA}, 'prospector', 'active', 'Ana', ${tx.json([{ municipio: MUNI }] as never)})`;
  const rows = ["frio", "abrio", "contesto"].map((name, index) => ({ denue_id: `itest-frio-${name}`, business_name: `ITest ${name}`, giro: "cafeteria", municipio: MUNI, phone_e164: `+52550000088${index}` }));
  await tx`select * from growth_upsert_leads(${tx.json(rows as never)})`;
  const leads = await tx`select id, denue_id from growth_leads where denue_id like 'itest-frio-%'`;
  const ids = Object.fromEntries(leads.map((row) => [String(row.denue_id).replace("itest-frio-", ""), row.id as string]));
  for (const [name, id] of Object.entries(ids)) {
    await tx`select growth_record_outcome(${id}, 'whatsapp_sent', 'operator', ${tx.json({ step: "m1", variant: name === "frio" ? "B" : "A" } as never)}, null, null, ${ANA})`;
  }
  await tx`update growth_leads set last_whatsapp_at = now() - interval '4 days' where id = any(${Object.values(ids)})`;
  await tx`update growth_lead_events set created_at = now() - interval '4 days' where lead_id = any(${Object.values(ids)})`;
  await tx`insert into growth_lead_events (lead_id, type, actor, payload) values (${ids.abrio}, 'para_viewed', 'prospect', '{}'::jsonb)`;
  await tx`insert into growth_lead_events (lead_id, type, actor, payload) values (${ids.contesto}, 'whatsapp_replied', 'operator', '{}'::jsonb)`;
  return ids;
}

describe("growth: cold leads, bulk drop and variant stats", () => {
  it("lists only who never opened nor replied, and drops them in one call", async () => {
    await inRollback(async (tx) => {
      const ids = await seed(tx);
      const cold = await tx`select id from growth_cold_leads(${TLACO}, ${ANA}, 3, 'me')`;
      expect(cold.map((row) => row.id)).toEqual([ids.frio]);
      expect(await tx`select id from growth_cold_leads(${TLACO}, ${ANA}, 7, 'me')`).toHaveLength(0);

      const [done] = await tx`select growth_bulk_drop(${TLACO}, ${ANA}, ${[ids.frio, ids.abrio]}, 'no_abrio') as n`;
      expect(done.n).toBe(2);
      const [lead] = await tx`select stage, drop_reason from growth_leads where id = ${ids.frio}`;
      expect(lead).toMatchObject({ stage: "descartado", drop_reason: "no_abrio" });
      const [blocked] = await tx`select count(*)::int as n from growth_suppressions where lead_id = ${ids.frio}`;
      expect(blocked.n).toBe(1);
    });
  });

  it("counts opens and replies per variant of the first message", async () => {
    await inRollback(async (tx) => {
      await seed(tx);
      const stats = await tx`select * from growth_variant_stats(${TLACO}, 'm1', 90) where variant in ('A', 'B')`;
      const byVariant = Object.fromEntries(stats.map((row) => [row.variant, row]));
      expect(byVariant.A).toMatchObject({ sent: expect.any(Number), opened: expect.any(Number) });
      expect(Number(byVariant.B.sent)).toBeGreaterThanOrEqual(1);
    });
  });

  it("leaves every active first message with the store link", async () => {
    const rows = await sql`select variant, body from growth_templates where workspace_id = ${TLACO} and channel = 'whatsapp' and step = 'm1' and giro is null and status = 'active' and created_by is null`;
    expect(rows.map((row) => row.variant).sort()).toEqual(expect.arrayContaining(["A", "B", "C"]));
    for (const row of rows) expect(row.body).toContain("{link}");
  });

  it("reverts cleanly", async () => {
    await inRollback(async (tx) => {
      await tx.unsafe(ROLLBACK);
      const [fns] = await tx`select count(*)::int as n from pg_proc where proname in ('growth_cold_leads', 'growth_bulk_drop', 'growth_variant_stats')`;
      expect(fns.n).toBe(0);
      const [linkless] = await tx`select count(*)::int as n from growth_templates where workspace_id = ${TLACO} and channel = 'whatsapp' and step = 'm1' and variant = 'A' and status = 'active'`;
      expect(linkless.n).toBe(1);
    });
  });
});
