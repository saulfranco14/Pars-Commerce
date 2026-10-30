import { describe, expect, it } from "vitest";

import { sql } from "@/test/integration/setup";

import type { TransactionSql } from "postgres";

class RolledBack extends Error {}

const MUNICIPIO = "ITest Barrido";

async function inRollback(run: (tx: TransactionSql) => Promise<void>) {
  await expect(
    sql.begin(async (tx) => {
      await run(tx);
      throw new RolledBack();
    }),
  ).rejects.toBeInstanceOf(RolledBack);
}

async function seed(tx: TransactionSql): Promise<string[]> {
  const rows = [1, 2, 3, 4].map((n) => ({
    denue_id: `itest-sweep-${n}`,
    business_name: `ITest Barrido ${n}`,
    giro: "tienda",
    municipio: MUNICIPIO,
    colonia: `Colonia ${n}`,
    phone_e164: `+52550000077${n}`,
  }));
  await tx`select * from growth_upsert_leads(${tx.json(rows as never)})`;
  const leads = await tx`select id from growth_leads where municipio = ${MUNICIPIO} order by colonia`;
  return leads.map((row) => row.id as string);
}

async function remaining(tx: TransactionSql, kind: string): Promise<number> {
  const [row] = await tx`select growth_sweep_remaining(${kind}, ${MUNICIPIO}, null) as n`;
  return row.n as number;
}

describe("growth: WhatsApp sweep", () => {
  it("counts its own set-aside cards but not skipped ones or other batches", async () => {
    await inRollback(async (tx) => {
      const [first, second, third] = await seed(tx);
      expect(await remaining(tx, "whatsapp")).toBe(4);

      const reserved = await tx`select id from growth_reserve_batch('whatsapp', ${MUNICIPIO}, null, 2, 120)`;
      expect(reserved.map((row) => row.id)).toEqual([first, second]);
      expect(await remaining(tx, "whatsapp")).toBe(4);

      await tx`update growth_leads set reserved_until = now() + interval '12 hours', reserved_kind = 'saltado' where id = ${third}`;
      expect(await remaining(tx, "whatsapp")).toBe(3);
      const next = await tx`select id from growth_reserve_batch('whatsapp', ${MUNICIPIO}, null, 5, 120)`;
      expect(next.map((row) => row.id)).not.toContain(third);
    });
  });

  it("moves a sent card from first message to follow-up after 3 days", async () => {
    await inRollback(async (tx) => {
      const [first] = await seed(tx);
      await tx`select growth_record_outcome(${first}, 'whatsapp_sent', 'operator', '{}'::jsonb, null, null)`;
      expect(await remaining(tx, "whatsapp")).toBe(3);
      expect(await remaining(tx, "seguimiento")).toBe(0);

      await tx`update growth_leads set last_whatsapp_at = now() - interval '4 days' where id = ${first}`;
      expect(await remaining(tx, "seguimiento")).toBe(1);
    });
  });

  it("ships formal WhatsApp copy with a sign-off", async () => {
    const live = await sql`
      select step, body from growth_templates
      where channel = 'whatsapp' and giro is null and status = 'active' and created_by is null and step in ('m1', 'seguimiento', 'si')`;
    expect(live.map((row) => row.step).sort()).toEqual(["m1", "m1", "seguimiento", "si"]);
    expect(live.every((row) => row.body.includes("Quedo a sus órdenes.\n{firma}") && !/le late|¡Va!/.test(row.body))).toBe(true);
  });
});
