import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { sql } from "@/test/integration/setup";
import { paraDesignFromHash } from "@/features/growth/helpers/paraDesign";

import type { TransactionSql } from "postgres";

const ROLLBACK = readFileSync(fileURLToPath(new URL("../../../../supabase/snippets/growth_para_design_stats_rollback.sql", import.meta.url)), "utf8")
  .replace(/^\s*(BEGIN|COMMIT);\s*$/gim, "");

class RolledBack extends Error {}
const TLACO = "00000000-0000-4000-8000-000000000001";

async function inRollback(run: (tx: TransactionSql) => Promise<void>) {
  await expect(
    sql.begin(async (tx) => {
      await run(tx);
      throw new RolledBack();
    }),
  ).rejects.toBeInstanceOf(RolledBack);
}

describe("growth: «Para ti» design split", () => {
  it("assigns the same design in SQL and in TypeScript and counts each visitor once", async () => {
    await inRollback(async (tx) => {
      const tokens = Array.from({ length: 6 }, (_, index) => `itest-design-token-${index}`);
      const rows = tokens.map((_, index) => ({ denue_id: `itest-design-${index}`, business_name: `ITest Diseño ${index}`, giro: "cafeteria", municipio: "ITest Diseño", phone_e164: `+52550000099${index}` }));
      await tx`select * from growth_upsert_leads(${tx.json(rows as never)})`;
      const expected: Record<string, number> = {};
      for (const [index, token] of tokens.entries()) {
        const hash = createHash("sha256").update(token).digest("hex");
        const [lead] = await tx`select id from growth_leads where denue_id = ${`itest-design-${index}`}`;
        await tx`insert into growth_lead_links (lead_id, token_hash, purpose, channel, expires_at) values (${lead.id}, ${hash}, 'para', 'whatsapp', now() + interval '30 days')`;
        await tx`insert into growth_lead_events (lead_id, type, actor, payload) values (${lead.id}, 'para_viewed', 'prospect', '{}'::jsonb), (${lead.id}, 'para_viewed', 'prospect', '{}'::jsonb)`;
        const design = paraDesignFromHash(hash);
        expected[design] = (expected[design] ?? 0) + 1;
      }
      const stats = await tx`select design, visitors from growth_para_design_stats(${TLACO}, now() - interval '1 hour')`;
      const counted = Object.fromEntries(stats.map((row) => [row.design, Number(row.visitors)]));
      for (const [design, count] of Object.entries(expected)) expect(counted[design]).toBeGreaterThanOrEqual(count);
    });
  });

  it("reverts cleanly", async () => {
    await inRollback(async (tx) => {
      await tx.unsafe(ROLLBACK);
      const [fns] = await tx`select count(*)::int as n from pg_proc where proname = 'growth_para_design_stats'`;
      expect(fns.n).toBe(0);
    });
  });
});
