import { describe, expect, it } from "vitest";

import { sql } from "@/test/integration/setup";

import type { TransactionSql } from "postgres";

class RolledBack extends Error {}

async function inRollback(run: (tx: TransactionSql) => Promise<void>) {
  await expect(
    sql.begin(async (tx) => {
      await run(tx);
      throw new RolledBack();
    }),
  ).rejects.toBeInstanceOf(RolledBack);
}

async function seedLink(tx: TransactionSql) {
  const rows = [{ denue_id: "itest-para-1", business_name: "ITest Tlapalería", giro: "itest-para", municipio: "Nezahualcóyotl", phone_e164: "+525500000991" }];
  await tx`select * from growth_upsert_leads(${tx.json(rows as never)})`;
  const [lead] = await tx`select id from growth_leads where denue_id = 'itest-para-1'`;
  await tx`insert into growth_lead_links (lead_id, token_hash, purpose, channel, expires_at)
           values (${lead.id}, 'itest-para-hash', 'para', 'whatsapp', now() + interval '1 day')`;
  return lead.id as string;
}

async function lastEvent(tx: TransactionSql, leadId: string) {
  const [event] = await tx`select type, payload from growth_lead_events where lead_id = ${leadId} order by created_at desc, id desc limit 1`;
  return event as { type: string; payload: Record<string, unknown> };
}

describe("growth: «Para ti» visits", () => {
  it("keeps what a visit saw and tapped on the lead event", async () => {
    await inRollback(async (tx) => {
      const leadId = await seedLink(tx);
      const visit = { sections: ["intro", "productos"], actions: ["claim:bar"], items: ["Cemento 50 kg"] };
      const [row] = await tx`select * from growth_track_link('itest-para-hash', 'para_left', 48, ${tx.json(visit)})`;

      expect(row).toMatchObject({ lead_id: leadId, business_name: "ITest Tlapalería" });
      expect(await lastEvent(tx, leadId)).toEqual({ type: "para_left", payload: { ...visit, seconds: 48, view_count: 0 } });
    });
  });

  it("does not let the payload overwrite the server's seconds or view count", async () => {
    await inRollback(async (tx) => {
      const leadId = await seedLink(tx);
      await tx`select * from growth_track_link('itest-para-hash', 'claim_clicked', null, ${tx.json({ placement: "final", view_count: 99 })})`;

      expect(await lastEvent(tx, leadId)).toEqual({ type: "claim_clicked", payload: { placement: "final", view_count: 0 } });
    });
  });

  it("still answers callers that send no payload", async () => {
    await inRollback(async (tx) => {
      const leadId = await seedLink(tx);
      await tx`select * from growth_track_link('itest-para-hash', 'para_viewed', null)`;

      expect(await lastEvent(tx, leadId)).toEqual({ type: "para_viewed", payload: { view_count: 1 } });
    });
  });

  it("marks the lead hot when the owner asks for a visit, and keeps the day", async () => {
    await inRollback(async (tx) => {
      const leadId = await seedLink(tx);
      await tx`update growth_leads set stage = 'contactado' where id = ${leadId}`;
      const visit = { day: "2026-10-30", slot: "tarde" };
      await tx`select * from growth_track_link('itest-para-hash', 'visit_requested', null, ${tx.json(visit)})`;

      expect(await lastEvent(tx, leadId)).toEqual({ type: "visit_requested", payload: { ...visit, view_count: 0 } });
      const [lead] = await tx`select stage from growth_leads where id = ${leadId}`;
      expect(lead.stage).toBe("caliente");
    });
  });

  it("records what holds the owner back", async () => {
    await inRollback(async (tx) => {
      const leadId = await seedLink(tx);
      await tx`select * from growth_track_link('itest-para-hash', 'objection_chosen', null, ${tx.json({ reason: "costo" })})`;

      expect(await lastEvent(tx, leadId)).toEqual({ type: "objection_chosen", payload: { reason: "costo", view_count: 0 } });
    });
  });

  it("rejects unknown events and non-object payloads", async () => {
    await inRollback(async (tx) => {
      await seedLink(tx);
      await expect(tx.savepoint((sp) => sp`select * from growth_track_link('itest-para-hash', 'deleted_store', null, null)`)).rejects.toThrow(/UNKNOWN_LINK_EVENT/);
      await expect(tx.savepoint((sp) => sp`select * from growth_track_link('itest-para-hash', 'para_left', null, ${tx.json(["intro"])})`)).rejects.toThrow(/INVALID_LINK_PAYLOAD/);
    });
  });
});
