import { describe, expect, it } from "vitest";

import { sql } from "@/test/integration/setup";

import type { TransactionSql } from "postgres";

class RolledBack extends Error {}

const MUNICIPIO = "ITest Seguimiento";

async function inRollback(run: (tx: TransactionSql) => Promise<void>) {
  await expect(
    sql.begin(async (tx) => {
      await run(tx);
      throw new RolledBack();
    }),
  ).rejects.toBeInstanceOf(RolledBack);
}

async function seed(tx: TransactionSql): Promise<string> {
  const rows = [{ denue_id: "itest-follow-1", business_name: "ITest Seguimiento", giro: "cafeteria", municipio: MUNICIPIO, phone_e164: "+525500000661" }];
  await tx`select * from growth_upsert_leads(${tx.json(rows as never)})`;
  const [lead] = await tx`select id from growth_leads where denue_id = 'itest-follow-1'`;
  return lead.id as string;
}

async function lead(tx: TransactionSql, id: string) {
  const [row] = await tx`select stage, next_step, next_step_at, next_step_note, appointment_at, next_channel, snoozed_until from growth_leads where id = ${id}`;
  return row;
}

async function failure(tx: TransactionSql, run: (sp: TransactionSql) => Promise<unknown>): Promise<string | null> {
  try {
    await tx.savepoint((sp) => run(sp as unknown as TransactionSql));
    return null;
  } catch (error) {
    return (error as Error).message;
  }
}

describe("growth: follow-up pipeline", () => {
  it("walks a lead from first message to a scheduled visit with its next step set", async () => {
    await inRollback(async (tx) => {
      const id = await seed(tx);
      expect((await lead(tx, id)).next_step).toBeNull();

      await tx`select growth_record_outcome(${id}, 'whatsapp_sent', 'operator', '{}'::jsonb, null, null)`;
      const contacted = await lead(tx, id);
      expect(contacted.stage).toBe("contactado");
      expect(contacted.next_step).toBe("whatsapp");
      const days = (new Date(contacted.next_step_at).getTime() - Date.now()) / 86_400_000;
      expect(days).toBeGreaterThan(2.9);

      await tx`select growth_record_outcome(${id}, 'whatsapp_replied', 'operator', '{}'::jsonb, null, null)`;
      const replied = await lead(tx, id);
      expect(replied.stage).toBe("conversando");
      expect(new Date(replied.next_step_at).getTime()).toBeLessThanOrEqual(Date.now() + 1000);

      await tx`select growth_follow_up(${id}, 'remind', now() + interval '2 days', 'Días fuertes, él dice el día')`;
      const reminded = await lead(tx, id);
      expect([reminded.stage, reminded.next_step_note]).toEqual(["conversando", "Días fuertes, él dice el día"]);

      await tx`select growth_follow_up(${id}, 'schedule_visit', '2030-01-10T17:00:00Z', 'Llevar tablet')`;
      const visit = await lead(tx, id);
      expect([visit.stage, visit.next_step, visit.next_channel, visit.next_step_note]).toEqual(["cita", "visita", "visita", "Llevar tablet"]);
      expect(new Date(visit.next_step_at).toISOString()).toBe("2030-01-10T17:00:00.000Z");

      await tx`select growth_follow_up(${id}, 'cancel_visit', null, null)`;
      const cancelled = await lead(tx, id);
      expect([cancelled.stage, cancelled.appointment_at]).toEqual(["conversando", null]);

      const events = await tx`select type from growth_lead_events where lead_id = ${id} order by created_at, type`;
      expect(events.map((row) => row.type)).toEqual(expect.arrayContaining(["reminder_set", "visit_scheduled", "visit_cancelled"]));
    });
  });

  it("blocks moves that skip the pipeline", async () => {
    await inRollback(async (tx) => {
      const id = await seed(tx);
      expect(await failure(tx, (sp) => sp`select growth_follow_up(${id}, 'cancel_visit', null, null)`)).toContain("INVALID_TRANSITION");
      expect(await failure(tx, (sp) => sp`select growth_follow_up(${id}, 'schedule_visit', null, null)`)).toContain("DATE_REQUIRED");
      await tx`select growth_record_outcome(${id}, 'not_interested', 'operator', '{}'::jsonb, null, null)`;
      expect(await failure(tx, (sp) => sp`select growth_follow_up(${id}, 'remind', now() + interval '1 day', null)`)).toContain("INVALID_TRANSITION");
      expect((await lead(tx, id)).next_step).toBeNull();
    });
  });

  it("pauses with a note and counts what is due today", async () => {
    await inRollback(async (tx) => {
      const id = await seed(tx);
      await tx`select growth_record_outcome(${id}, 'whatsapp_replied', 'operator', '{}'::jsonb, null, null)`;
      const [before] = await tx`select growth_pipeline_counts(${MUNICIPIO}, null) as c`;
      expect(before.c).toMatchObject({ conversando: 1, due_today: 1, paused: 0 });

      await tx`select growth_follow_up(${id}, 'pause', now() + interval '5 days', 'Temporada fuerte')`;
      const paused = await lead(tx, id);
      expect([paused.next_step, paused.next_step_note]).toEqual(["retomar", "Temporada fuerte"]);
      const [after] = await tx`select growth_pipeline_counts(${MUNICIPIO}, null) as c`;
      expect(after.c).toMatchObject({ due_today: 0, paused: 1 });
    });
  });

  it("marks the lead warm on the first look at its store", async () => {
    await inRollback(async (tx) => {
      const id = await seed(tx);
      await tx`select growth_record_outcome(${id}, 'whatsapp_sent', 'operator', '{}'::jsonb, null, null)`;
      await tx`insert into growth_lead_links (lead_id, token_hash, purpose, channel, expires_at) values (${id}, 'itest-follow-hash', 'para', 'whatsapp', now() + interval '30 days')`;
      const [tracked] = await tx`select * from growth_track_link('itest-follow-hash', 'para_viewed', null)`;
      expect(tracked.became_hot).toBe(true);
      expect((await lead(tx, id)).stage).toBe("caliente");
    });
  });

  it("drops the colonia from the opening copy", async () => {
    const live = await sql`select body from growth_templates where status = 'active' and created_by is null and body like '%Vi su comercio%'`;
    expect(live.length).toBeGreaterThan(0);
    expect(live.some((row) => row.body.includes("{colonia}"))).toBe(false);
  });
});
