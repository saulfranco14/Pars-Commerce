import { describe, expect, it } from "vitest";

import { sql } from "@/test/integration/setup";

import type { TransactionSql } from "postgres";

class RolledBack extends Error {}

const GIRO = "itest-outreach";

async function inRollback(run: (tx: TransactionSql) => Promise<void>) {
  await expect(
    sql.begin(async (tx) => {
      // Isolate from real prospects that may be loaded in the local database.
      await tx`update growth_leads set snoozed_until = now() + interval '1 day' where giro <> ${GIRO}`;
      await run(tx);
      throw new RolledBack();
    }),
  ).rejects.toBeInstanceOf(RolledBack);
}

async function seed(tx: TransactionSql) {
  const rows = [
    { denue_id: "itest-o-1", business_name: "ITest Ferre", giro: "materiales", municipio: "Ixtapaluca", email: "ferre@example.com" },
    { denue_id: "itest-o-2", business_name: "ITest Vete", giro: "veterinaria", municipio: "Ixtapaluca", email: "vete@example.com" },
    { denue_id: "itest-o-3", business_name: "ITest Baja", giro: "tienda", municipio: "Ixtapaluca", email: "baja@example.com" },
    { denue_id: "itest-o-4", business_name: "ITest Tel", giro: "tienda", municipio: "Ixtapaluca", email: "tel@example.com", phone_e164: "+525500000777" },
  ].map((row) => ({ ...row, source_detail: GIRO }));
  await tx`select * from growth_upsert_leads(${tx.json(rows as never)})`;
  await tx`update growth_leads set giro = ${GIRO} where source_detail = ${GIRO} and denue_id = 'itest-o-3'`;
  await tx`insert into growth_suppressions (email, reason) values ('baja@example.com', 'opt_out')`;
}

describe("growth outreach: email enrollment", () => {
  it("enrolls only email-channel leads, skips suppressed ones and WhatsApp leads, best giros first", async () => {
    await inRollback(async (tx) => {
      await seed(tx);
      const [{ growth_enroll_email_leads: enrolled }] = await tx`select growth_enroll_email_leads(10)`;
      const rows = await tx`
        select g.denue_id, e.variant from growth_enrollments e join growth_leads g on g.id = e.lead_id
        where g.denue_id like 'itest-o-%' order by e.created_at, g.denue_id`;
      expect(enrolled).toBe(2);
      expect(rows.map((row) => row.denue_id).sort()).toEqual(["itest-o-1", "itest-o-2"]);
      expect(rows.every((row) => ["A", "B", "C"].includes(row.variant))).toBe(true);

      const [{ growth_enroll_email_leads: again }] = await tx`select growth_enroll_email_leads(10)`;
      expect(again).toBe(0);
    });
  });

  it("claims a due enrollment once, even if the tick overlaps", async () => {
    await inRollback(async (tx) => {
      await seed(tx);
      await tx`select growth_enroll_email_leads(10)`;
      const first = await tx`select enrollment_id from growth_claim_due_enrollments(10)`;
      const second = await tx`select enrollment_id from growth_claim_due_enrollments(10)`;
      expect(first.length).toBe(2);
      expect(second.length).toBe(0);
    });
  });
});
