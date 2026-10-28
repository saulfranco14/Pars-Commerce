import { describe, expect, it } from "vitest";

import { sql } from "@/test/integration/setup";

import type { TransactionSql } from "postgres";

class RolledBack extends Error {}

const GIRO = "itest-phone";

async function inRollback(run: (tx: TransactionSql) => Promise<void>) {
  await expect(
    sql.begin(async (tx) => {
      await run(tx);
      throw new RolledBack();
    }),
  ).rejects.toBeInstanceOf(RolledBack);
}

async function seed(tx: TransactionSql) {
  const rows = [
    { denue_id: "itest-p-1", business_name: "ITest Frijolero", giro: GIRO, municipio: "Ixtapaluca", phone_e164: "+525500000881" },
    { denue_id: "itest-p-2", business_name: "ITest Otro", giro: GIRO, municipio: "Ixtapaluca", phone_e164: "+525500000882" },
  ];
  await tx`select * from growth_upsert_leads(${tx.json(rows as never)})`;
  const [first] = await tx`select id from growth_leads where denue_id = 'itest-p-1'`;
  return first.id as string;
}

async function attempt(tx: TransactionSql, leadId: string, phone: string): Promise<string | null> {
  try {
    await tx.savepoint((sp) => sp`select growth_update_lead_phone(${leadId}, ${phone})`);
    return null;
  } catch (error) {
    return (error as Error).message;
  }
}

describe("growth: phone correction", () => {
  it("brings a lead with no WhatsApp back to the WhatsApp queue with the new number", async () => {
    await inRollback(async (tx) => {
      const id = await seed(tx);
      await tx`select growth_record_outcome(${id}, 'no_whatsapp', 'operator', '{}'::jsonb, null, null)`;
      const [before] = await tx`select next_channel from growth_leads where id = ${id}`;
      expect(before.next_channel).not.toBe("whatsapp");

      const [after] = await tx`select * from growth_update_lead_phone(${id}, '+525563162174')`;
      expect(after.phone_e164).toBe("+525563162174");
      expect(after.phone_status).toBe("desconocido");
      expect(after.whatsapp_attempts).toBe(0);
      expect(after.next_channel).toBe("whatsapp");

      const [event] = await tx`select payload from growth_lead_events where lead_id = ${id} and type = 'phone_corrected'`;
      expect(event.payload.previous).toBe("+525500000881");
    });
  });

  it("rejects a number owned by another lead, a suppressed one and a malformed one", async () => {
    await inRollback(async (tx) => {
      const id = await seed(tx);
      await tx`insert into growth_suppressions (phone_e164, reason) values ('+525500000999', 'opt_out')`;
      expect(await attempt(tx, id, "+525500000882")).toContain("PHONE_TAKEN");
      expect(await attempt(tx, id, "+525500000999")).toContain("PHONE_SUPPRESSED");
      expect(await attempt(tx, id, "5563162174")).toContain("INVALID_PHONE");
    });
  });

  it("archives the seeded v1 opening templates in favour of the Tlaco copy", async () => {
    const live = await sql`
      select body from growth_templates
      where channel = 'whatsapp' and giro is null and step = 'm1' and status <> 'archived'`;
    expect(live.length).toBeGreaterThan(0);
    expect(live.every((row) => row.body.includes("de Tlaco") && !row.body.includes("{cercania}"))).toBe(true);
    const [archived] = await sql`
      select count(*)::int as n from growth_templates
      where channel = 'whatsapp' and giro is null and step = 'm1' and status = 'archived' and version = 1`;
    expect(archived.n).toBe(2);
  });
});
