import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestAnonClient, sql } from "@/test/integration/setup";

import type { TransactionSql } from "postgres";

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
const ROLLBACK = read("../../../../supabase/snippets/growth_rollback.sql").replace(/^\s*(BEGIN|COMMIT);\s*$/gim, "");

class RolledBack extends Error {}

const USER = "00000000-0000-0000-0000-0000000a7071";
const GIRO = "itest-growth";

function lead(id: string, extra: Record<string, unknown> = {}) {
  return { denue_id: `itest-${id}`, business_name: `ITest ${id}`, giro: GIRO, municipio: "Chimalhuacán", ...extra };
}

async function upsert(tx: TransactionSql, rows: unknown[]) {
  const [result] = await tx`select * from growth_upsert_leads(${tx.json(rows as never)})`;
  return result;
}

async function leadRow(tx: TransactionSql, denueId: string) {
  const [row] = await tx`select * from growth_leads where denue_id = ${denueId}`;
  return row;
}

async function outcome(tx: TransactionSql, leadId: string, name: string, payload: Record<string, unknown> = {}) {
  const [row] = await tx`select * from growth_record_outcome(${leadId}, ${name}, 'operator', ${tx.json(payload as never)}, null, null)`;
  return row;
}

async function inRollback(run: (tx: TransactionSql) => Promise<void>) {
  await expect(
    sql.begin(async (tx) => {
      await run(tx);
      throw new RolledBack();
    }),
  ).rejects.toBeInstanceOf(RolledBack);
}

describe("growth leads: import and dedup", () => {
  it("merges a phone shared by two branches into one contact and updates on re-import", async () => {
    await inRollback(async (tx) => {
      const first = await upsert(tx, [
        lead("a", { phone_e164: "+525500000001", email: "Dueno@Example.com" }),
        lead("b", { phone_e164: "+525500000001", email: "dueno@example.com" }),
      ]);
      expect(first).toEqual({ inserted: 2, updated: 0, merged_contacts: 2 });
      expect((await leadRow(tx, "itest-a")).phone_e164).toBe("+525500000001");
      expect((await leadRow(tx, "itest-a")).email).toBe("dueno@example.com");
      expect((await leadRow(tx, "itest-b")).phone_e164).toBeNull();

      const again = await upsert(tx, [lead("a", { phone_e164: "+525500000001", colonia: "Xochitenco" })]);
      expect(again).toEqual({ inserted: 0, updated: 1, merged_contacts: 0 });
      expect((await leadRow(tx, "itest-a")).colonia).toBe("Xochitenco");
    });
  });

  it("routes each lead to its first usable channel", async () => {
    await inRollback(async (tx) => {
      await upsert(tx, [
        lead("phone", { phone_e164: "+525500000002" }),
        lead("mail", { email: "solo@example.com" }),
        lead("visit"),
        lead("far", { municipio: "Ecatepec de Morelos" }),
      ]);
      expect((await leadRow(tx, "itest-phone")).next_channel).toBe("whatsapp");
      expect((await leadRow(tx, "itest-mail")).next_channel).toBe("correo");
      expect((await leadRow(tx, "itest-visit")).next_channel).toBe("visita");
      const far = await leadRow(tx, "itest-far");
      expect([far.next_channel, far.stage]).toEqual(["ninguno", "sin_contacto"]);
    });
  });
});

describe("growth leads: outcomes and cascade", () => {
  it("falls from WhatsApp to email to visit, and then to sin contacto", async () => {
    await inRollback(async (tx) => {
      await upsert(tx, [lead("cascade", { phone_e164: "+525500000003", email: "cascade@example.com" })]);
      const id = (await leadRow(tx, "itest-cascade")).id;

      expect((await outcome(tx, id, "no_whatsapp")).next_channel).toBe("correo");
      expect((await outcome(tx, id, "email_bounced")).next_channel).toBe("visita");
      await outcome(tx, id, "visit_absent");
      await outcome(tx, id, "visit_absent");
      const last = await outcome(tx, id, "visit_absent");
      expect([last.next_channel, last.stage, last.visit_attempts]).toEqual(["ninguno", "sin_contacto", 3]);

      const [suppressed] = await tx`select count(*)::int as n from growth_suppressions where lead_id = ${id}`;
      expect(suppressed.n).toBe(1);
      const [events] = await tx`select count(*)::int as n from growth_lead_events where lead_id = ${id}`;
      expect(events.n).toBe(5);
    });
  });

  it("a rejection suppresses every channel and is never contacted again", async () => {
    await inRollback(async (tx) => {
      await upsert(tx, [lead("no", { phone_e164: "+525500000004", email: "no@example.com" })]);
      const id = (await leadRow(tx, "itest-no")).id;
      await outcome(tx, id, "whatsapp_sent");
      const row = await outcome(tx, id, "not_interested", { reason: "rechazo" });
      expect([row.stage, row.next_channel, row.drop_reason]).toEqual(["descartado", "ninguno", "rechazo"]);
      const [suppressed] = await tx`select count(*)::int as n from growth_suppressions where phone_e164 = '+525500000004' or email = 'no@example.com'`;
      expect(suppressed.n).toBe(2);

      // A new branch with the same phone imported later is still blocked.
      await upsert(tx, [lead("no-2", { phone_e164: "+525500000099" })]);
      const reserved = await tx`select id from growth_reserve_batch('whatsapp', null, ${GIRO}, 10, 60)`;
      expect(reserved.map((r) => r.id)).not.toContain(id);
    });
  });

  it("a sent WhatsApp without reply moves to follow-up after 3 days, then to sleep", async () => {
    await inRollback(async (tx) => {
      await upsert(tx, [lead("quiet", { phone_e164: "+525500000005", municipio: "Ixtapaluca" })]);
      const id = (await leadRow(tx, "itest-quiet")).id;
      await outcome(tx, id, "whatsapp_sent");
      await tx`update growth_leads set last_whatsapp_at = now() - interval '4 days' where id = ${id}`;
      const followUps = await tx`select id from growth_reserve_batch('seguimiento', null, ${GIRO}, 10, 60)`;
      expect(followUps.map((r) => r.id)).toContain(id);

      await outcome(tx, id, "whatsapp_sent");
      const asleep = await outcome(tx, id, "whatsapp_no_answer");
      expect([asleep.stage, asleep.next_channel]).toEqual(["sin_respuesta", "ninguno"]);
      expect(asleep.snoozed_until).not.toBeNull();
    });
  });
});

describe("growth leads: batches without repeats", () => {
  beforeAll(async () => {
    const rows = Array.from({ length: 6 }, (_, i) => lead(`batch-${i}`, { phone_e164: `+52550000010${i}`, giro: `${GIRO}-batch` }));
    await sql`select * from growth_upsert_leads(${sql.json(rows as never)})`;
  });

  afterAll(async () => {
    await sql`delete from growth_leads where giro = ${`${GIRO}-batch`}`;
  });

  it("two operators asking at once never get the same prospect", async () => {
    let releaseFirst!: () => void;
    const firstHolds = new Promise<void>((resolve) => { releaseFirst = resolve; });
    const ids: string[][] = [];

    const first = sql.begin(async (tx) => {
      const rows = await tx`select id from growth_reserve_batch('whatsapp', null, ${`${GIRO}-batch`}, 3, 60)`;
      ids.push(rows.map((r) => r.id));
      await firstHolds;
      throw new RolledBack();
    }).catch((error) => { if (!(error instanceof RolledBack)) throw error; });

    await new Promise((resolve) => setTimeout(resolve, 300));
    await sql.begin(async (tx) => {
      const rows = await tx`select id from growth_reserve_batch('whatsapp', null, ${`${GIRO}-batch`}, 3, 60)`;
      ids.push(rows.map((r) => r.id));
      throw new RolledBack();
    }).catch((error) => { if (!(error instanceof RolledBack)) throw error; });
    releaseFirst();
    await first;

    expect(ids[0]).toHaveLength(3);
    expect(ids[1]).toHaveLength(3);
    expect(ids[0].filter((id) => ids[1].includes(id))).toEqual([]);
  });
});

describe("growth leads: attribution", () => {
  it("prospect link → engine, contacted phone → assisted, nothing → self", async () => {
    await inRollback(async (tx) => {
      await tx`insert into auth.users (id, email) values (${USER}, 'growth-itest@tlaco.app')`;
      await upsert(tx, [lead("engine"), lead("assisted", { phone_e164: "+525500000006" })]);
      const engineLead = (await leadRow(tx, "itest-engine")).id;
      const assistedLead = (await leadRow(tx, "itest-assisted")).id;
      await tx`insert into growth_lead_links (lead_id, token_hash, purpose, channel, expires_at)
               values (${engineLead}, 'itest-hash', 'para', 'visita', now() + interval '1 day')`;
      await outcome(tx, assistedLead, "whatsapp_sent");

      const tenant = async (slug: string) => (await tx`select id from create_tenant_with_catalog(${USER}, 'ITest', ${slug}, 'tienda', null)`)[0].id as string;
      const link = async (tenantId: string, phone: string | null, token: string | null, heard: string | null) =>
        (await tx`select * from growth_link_registration(${tenantId}, 'x@example.com', ${phone}, ${token}, ${heard}, '{}'::jsonb)`)[0];

      expect(await link(await tenant("itest-growth-a"), null, "itest-hash", null)).toMatchObject({ bucket: "engine", lead_id: engineLead, channel: "visita" });
      expect(await link(await tenant("itest-growth-b"), "+525500000006", null, null)).toMatchObject({ bucket: "assisted", lead_id: assistedLead, channel: "whatsapp" });
      expect(await link(await tenant("itest-growth-c"), "+525511111111", null, "saul")).toMatchObject({ bucket: "assisted", lead_id: null, channel: "declarado" });
      const selfTenant = await tenant("itest-growth-d");
      expect(await link(selfTenant, null, null, null)).toMatchObject({ bucket: "self", lead_id: null });
      // Idempotent: a second call keeps the first answer.
      expect(await link(selfTenant, null, "itest-hash", null)).toMatchObject({ bucket: "self" });

      expect((await leadRow(tx, "itest-engine")).stage).toBe("registrado");
    });
  });
});

describe("growth leads: templates and security", () => {
  it("saving a version archives the live one and keeps a single live version", async () => {
    await inRollback(async (tx) => {
      const saved = async (body: string) =>
        (await tx`select * from growth_save_template_version('whatsapp', ${GIRO}, 'm1', 'A', null, ${body}, null)`)[0];
      expect((await saved("Primera versión del mensaje")).version).toBe(1);
      expect((await saved("Segunda versión del mensaje")).version).toBe(2);
      const rows = await tx`select version, status from growth_templates where giro = ${GIRO} order by version`;
      expect(rows.map((r) => [r.version, r.status])).toEqual([[1, "archived"], [2, "active"]]);
    });
  });

  it("anon users can't read growth tables or call growth RPCs", async () => {
    const anon = createTestAnonClient();
    const { data } = await anon.from("growth_leads" as never).select("id").limit(1);
    expect(data ?? []).toEqual([]);
    const { error } = await anon.rpc("growth_reserve_batch" as never, { p_kind: "whatsapp" } as never);
    expect(error).not.toBeNull();
  });

  it("the rollback snippet removes every growth object", async () => {
    await inRollback(async (tx) => {
      await tx.unsafe(ROLLBACK);
      const [left] = await tx`select count(*)::int as n from pg_tables where schemaname = 'public' and (tablename like 'growth_%' or tablename = 'tenant_acquisitions')`;
      expect(left.n).toBe(0);
    });
  });
});
