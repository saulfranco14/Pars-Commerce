import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { sql } from "@/test/integration/setup";

import type { TransactionSql } from "postgres";

const ROLLBACK = readFileSync(fileURLToPath(new URL("../../../../supabase/snippets/growth_prospect_ads_rollback.sql", import.meta.url)), "utf8")
  .replace(/^\s*(BEGIN|COMMIT);\s*$/gim, "");

class RolledBack extends Error {}

const TLACO = "00000000-0000-4000-8000-000000000001";
// Far from any real DENUE row, so the counts only see the rows seeded here.
const LAT = 10.5;
const LNG = -80.5;
const METER_LAT = 1 / 111_320;

async function inRollback(run: (tx: TransactionSql) => Promise<void>) {
  await expect(
    sql.begin(async (tx) => {
      await run(tx);
      throw new RolledBack();
    }),
  ).rejects.toBeInstanceOf(RolledBack);
}

async function lead(tx: TransactionSql, name: string, metersNorth: number, extra: Record<string, unknown> = {}): Promise<string> {
  const [row] = await tx`
    insert into growth_leads (business_name, giro, municipio, lat, lng, workspace_id, phone_e164, email)
    values (${name}, 'cafeteria', 'ITest Zona', ${LAT + metersNorth * METER_LAT}, ${LNG}, ${TLACO}, ${(extra.phone as string) ?? null}, ${(extra.email as string) ?? null})
    returning id`;
  return row.id as string;
}

async function link(tx: TransactionSql, leadId: string, hash: string) {
  await tx`insert into growth_lead_links (lead_id, token_hash, purpose, channel, expires_at) values (${leadId}, ${hash}, 'para', 'whatsapp', now() + interval '30 days')`;
}

describe("growth: prospect ads", () => {
  it("counts same-giro businesses at 500 m and 1 km without the prospect itself", async () => {
    await inRollback(async (tx) => {
      const self = await lead(tx, "ITest Centro", 0);
      await lead(tx, "ITest 200", 200);
      await lead(tx, "ITest 450", 450);
      await lead(tx, "ITest 800", 800);
      await lead(tx, "ITest 3000", 3000);
      const [counts] = await tx`select * from growth_zone_counts(${LAT}, ${LNG}, 'cafeteria', ${self}::uuid, ${TLACO}::uuid)`;
      expect(counts).toMatchObject({ within_500: 2, within_1000: 3 });
      expect(Math.abs(Number(counts.nearest_m) - 200)).toBeLessThan(5);
      const points = await tx`select * from growth_zone_points(${LAT}, ${LNG}, 'cafeteria', ${self}::uuid, ${TLACO}::uuid)`;
      expect(points.map((point) => point.distance_m)).toHaveLength(3);
      expect(Object.keys(points[0]).sort()).toEqual(["distance_m", "lat", "lng"]);
    });
  });

  it("records the ads events and warms the prospect", async () => {
    await inRollback(async (tx) => {
      const id = await lead(tx, "ITest Eventos", 0);
      await link(tx, id, "itest-hash-eventos");
      const [row] = await tx`select * from growth_track_link('itest-hash-eventos', 'ads_downloaded', null, ${tx.json({ count: 4 } as never)})`;
      expect(row.became_hot).toBe(true);
      const [event] = await tx`select type, payload from growth_lead_events where lead_id = ${id}`;
      expect(event).toMatchObject({ type: "ads_downloaded", payload: { count: 4 } });
      await expect(tx.savepoint((sp) => sp`select * from growth_track_link('itest-hash-eventos', 'ads_hacked')`)).rejects.toThrow(/UNKNOWN_LINK_EVENT/);
    });
  });

  it("«Quitar mis datos» is a baja everywhere, revokes the page and erases the edits", async () => {
    await inRollback(async (tx) => {
      const id = await lead(tx, "ITest Quitar", 0, { phone: "+525500000977", email: "quitar-itest@tlaco.app" });
      await tx`update growth_leads set ad_edits = ${tx.json({ prod: { price: "25" } } as never)} where id = ${id}`;
      await link(tx, id, "itest-hash-quitar");
      const [removed] = await tx`select * from growth_remove_prospect_data('itest-hash-quitar')`;
      expect(removed.lead_id).toBe(id);
      const [after] = await tx`select stage, drop_reason, ad_edits from growth_leads where id = ${id}`;
      expect(after).toMatchObject({ stage: "descartado", drop_reason: "baja", ad_edits: {} });
      const [links] = await tx`select count(*)::int as n from growth_lead_links where lead_id = ${id} and revoked_at is null`;
      expect(links.n).toBe(0);
      const [blocked] = await tx`select count(*)::int as n from growth_suppressions where lead_id = ${id}`;
      expect(blocked.n).toBe(2);
      expect(await tx`select * from growth_remove_prospect_data('itest-hash-quitar')`).toHaveLength(0);
    });
  });

  it("the rollback script removes the new objects", async () => {
    await inRollback(async (tx) => {
      await tx.unsafe(ROLLBACK);
      const [left] = await tx`
        select to_regprocedure('public.growth_zone_counts(double precision, double precision, text, uuid, uuid)') as zone,
               to_regclass('public.growth_ad_backgrounds') as backgrounds,
               to_regclass('public.growth_bot_inbox') as inbox`;
      expect(left).toEqual({ zone: null, backgrounds: null, inbox: null });
      const [column] = await tx`select count(*)::int as n from information_schema.columns where table_name = 'growth_leads' and column_name = 'ad_edits'`;
      expect(column.n).toBe(0);
    });
  });
});
