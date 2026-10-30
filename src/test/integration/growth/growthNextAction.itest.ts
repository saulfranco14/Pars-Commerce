import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { sql } from "@/test/integration/setup";

import type { TransactionSql } from "postgres";

const ROLLBACK = readFileSync(fileURLToPath(new URL("../../../../supabase/snippets/growth_next_action_rollback.sql", import.meta.url)), "utf8")
  .replace(/^\s*(BEGIN|COMMIT);\s*$/gim, "");

class RolledBack extends Error {}

async function inRollback(run: (tx: TransactionSql) => Promise<void>) {
  await expect(
    sql.begin(async (tx) => {
      await run(tx);
      throw new RolledBack();
    }),
  ).rejects.toBeInstanceOf(RolledBack);
}

async function seed(tx: TransactionSql): Promise<string> {
  const rows = [{ denue_id: "itest-next-1", business_name: "ITest Siguiente", giro: "cafeteria", municipio: "ITest Next", phone_e164: "+525500000791" }];
  await tx`select * from growth_upsert_leads(${tx.json(rows as never)})`;
  const [lead] = await tx`select id from growth_leads where denue_id = 'itest-next-1'`;
  await tx`insert into growth_lead_links (lead_id, token_hash, purpose, channel, expires_at) values (${lead.id}, 'itest-next-hash', 'para', 'whatsapp', now() + interval '30 days')`;
  return lead.id as string;
}

async function next(tx: TransactionSql, id: string) {
  const [row] = await tx`select growth_lead_next_action(${id}) as action`;
  return row.action as { step: string | null; code: string; wait: boolean; facts: Record<string, unknown> };
}

/** now() is fixed inside a transaction: push what already happened one minute back so the next event comes after it. */
async function later(tx: TransactionSql, id: string) {
  await tx`update growth_lead_events set created_at = created_at - interval '1 minute' where lead_id = ${id}`;
  await tx`update growth_leads set last_whatsapp_at = last_whatsapp_at - interval '1 minute' where id = ${id}`;
  await tx`update growth_lead_links set last_viewed_at = last_viewed_at - interval '1 minute' where lead_id = ${id}`;
}

async function send(tx: TransactionSql, id: string, step: string, variant = "A") {
  await later(tx, id);
  await tx`select growth_record_outcome(${id}, 'whatsapp_sent', 'operator', ${tx.json({ step, variant, body: `Texto ${step}` } as never)}, null, null)`;
}

async function track(tx: TransactionSql, id: string, event: string, payload: Record<string, string> | null = null) {
  await later(tx, id);
  await tx`select * from growth_track_link('itest-next-hash', ${event}, null, ${payload ? tx.json(payload as never) : null})`;
}

describe("growth: next message from the prospect's history", () => {
  it("goes first message → wait → store visit → doubt → reply, never repeating what was sent", async () => {
    await inRollback(async (tx) => {
      const id = await seed(tx);
      expect(await next(tx, id)).toMatchObject({ step: "m1", code: "first", wait: false });

      await send(tx, id, "m1", "B");
      const waiting = await next(tx, id);
      expect(waiting).toMatchObject({ step: "seguimiento", code: "follow_up", wait: true });
      expect(waiting.facts.sent).toEqual([expect.objectContaining({ step: "m1", variant: "B" })]);

      await track(tx, id, "para_viewed");
      await track(tx, id, "para_viewed");
      expect(await next(tx, id)).toMatchObject({ step: "vio_tienda", code: "viewed", wait: false, facts: expect.objectContaining({ views_since_last_send: 2 }) });

      await send(tx, id, "vio_tienda");
      // Two unanswered messages already: what is left is the last one, a week later.
      expect(await next(tx, id)).toMatchObject({ step: "ultimo", wait: true });

      await track(tx, id, "objection_chosen", { reason: "costo" });
      expect(await next(tx, id)).toMatchObject({ step: "objecion_costo", code: "objection" });
      await send(tx, id, "objecion_costo");

      await later(tx, id);
      await tx`select growth_record_outcome(${id}, 'whatsapp_replied', 'operator', '{}'::jsonb, null, null)`;
      expect(await next(tx, id)).toMatchObject({ step: "si", code: "replied", wait: false });
      await send(tx, id, "si");
      expect(await next(tx, id)).toMatchObject({ step: "si", wait: true });
    });
  });

  it("confirms a requested visit, reminds the appointment and follows up after it", async () => {
    await inRollback(async (tx) => {
      const id = await seed(tx);
      await send(tx, id, "m1");
      await track(tx, id, "visit_requested", { day: "2026-11-03", slot: "manana" });
      expect(await next(tx, id)).toMatchObject({ step: "visita_confirmar", code: "visit_requested" });

      await later(tx, id);
      await tx`select growth_follow_up(${id}, 'schedule_visit', now() + interval '20 hours', null)`;
      expect(await next(tx, id)).toMatchObject({ step: "cita_recordatorio", code: "visit_soon", wait: false });
      await send(tx, id, "cita_recordatorio");
      expect(await next(tx, id)).toMatchObject({ step: "cita_recordatorio", wait: true });

      await tx`update growth_leads set appointment_at = now() - interval '2 hours' where id = ${id}`;
      expect(await next(tx, id)).toMatchObject({ step: "post_visita", code: "visit_passed", wait: false });
    });
  });

  it("sends one last message after two unanswered ones, then stops", async () => {
    await inRollback(async (tx) => {
      const id = await seed(tx);
      await send(tx, id, "m1");
      await send(tx, id, "seguimiento");
      expect(await next(tx, id)).toMatchObject({ step: "ultimo", code: "last_call", wait: true });
      await tx`update growth_leads set last_whatsapp_at = now() - interval '8 days' where id = ${id}`;
      expect(await next(tx, id)).toMatchObject({ step: "ultimo", wait: false });
      await send(tx, id, "ultimo");
      expect(await next(tx, id)).toMatchObject({ step: null, code: "exhausted" });
    });
  });

  it("the rollback snippet removes the new steps and the function", async () => {
    await inRollback(async (tx) => {
      await tx.unsafe(ROLLBACK);
      const [fn] = await tx`select count(*)::int as n from pg_proc where proname = 'growth_lead_next_action'`;
      expect(fn.n).toBe(0);
      const [steps] = await tx`select count(*)::int as n from growth_templates where step = 'vio_tienda'`;
      expect(steps.n).toBe(0);
    });
  });
});
