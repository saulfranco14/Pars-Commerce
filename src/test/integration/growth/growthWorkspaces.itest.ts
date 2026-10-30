import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { sql } from "@/test/integration/setup";

import type { TransactionSql } from "postgres";

const ROLLBACK = readFileSync(fileURLToPath(new URL("../../../../supabase/snippets/growth_workspaces_rollback.sql", import.meta.url)), "utf8")
  .replace(/^\s*(BEGIN|COMMIT);\s*$/gim, "");

class RolledBack extends Error {}

const TLACO = "00000000-0000-4000-8000-000000000001";
const OTHER_WS = "00000000-0000-4000-8000-0000000000f1";
const ANA = "00000000-0000-4000-8000-0000000000a1";
const BETO = "00000000-0000-4000-8000-0000000000b1";
const COORD = "00000000-0000-4000-8000-0000000000c1";
const NORTE = "ITest Norte";
const SUR = "ITest Sur";

async function inRollback(run: (tx: TransactionSql) => Promise<void>) {
  await expect(
    sql.begin(async (tx) => {
      await run(tx);
      throw new RolledBack();
    }),
  ).rejects.toBeInstanceOf(RolledBack);
}

async function failure(tx: TransactionSql, run: (sp: TransactionSql) => Promise<unknown>): Promise<string | null> {
  try {
    await tx.savepoint((sp) => run(sp as unknown as TransactionSql));
    return null;
  } catch (error) {
    return (error as Error).message;
  }
}

async function seedTeam(tx: TransactionSql) {
  for (const [id, email] of [[ANA, "ana-itest@tlaco.app"], [BETO, "beto-itest@tlaco.app"], [COORD, "coord-itest@tlaco.app"]]) {
    await tx`insert into auth.users (id, email) values (${id}, ${email})`;
  }
  await tx`insert into growth_members (workspace_id, user_id, role, status, display_name, zones) values
    (${TLACO}, ${ANA}, 'prospector', 'active', 'Ana', ${tx.json([{ municipio: NORTE }] as never)}),
    (${TLACO}, ${BETO}, 'prospector', 'active', 'Beto', ${tx.json([{ municipio: SUR, colonias: ["Centro"] }] as never)}),
    (${TLACO}, ${COORD}, 'coordinador', 'active', 'Coordinadora', '[]'::jsonb)`;
  const rows = [
    { denue_id: "itest-ws-1", business_name: "ITest Norte Uno", giro: "cafeteria", municipio: NORTE, colonia: "Lomas", phone_e164: "+525500000771" },
    { denue_id: "itest-ws-2", business_name: "ITest Norte Dos", giro: "materiales", municipio: NORTE, colonia: "Lomas", phone_e164: "+525500000772" },
    { denue_id: "itest-ws-3", business_name: "ITest Sur Centro", giro: "taqueria", municipio: SUR, colonia: "Centro", phone_e164: "+525500000773" },
    { denue_id: "itest-ws-4", business_name: "ITest Sur Otra", giro: "taqueria", municipio: SUR, colonia: "Otra", phone_e164: "+525500000774" },
  ];
  await tx`select * from growth_upsert_leads(${tx.json(rows as never)})`;
  const leads = await tx`select id, denue_id from growth_leads where denue_id like 'itest-ws-%' order by denue_id`;
  return Object.fromEntries(leads.map((row) => [row.denue_id as string, row.id as string]));
}

describe("growth: workspaces, members and owners", () => {
  it("puts existing data in Tlaco's workspace and keeps one settings row per workspace", async () => {
    const [workspace] = await sql`select slug, tenant_id from growth_workspaces where id = ${TLACO}`;
    expect(workspace.slug).toBe("tlaco");
    expect(workspace.tenant_id).toBeNull();
    const [settings] = await sql`select count(*)::int as n from growth_settings where workspace_id = ${TLACO}`;
    expect(settings.n).toBe(1);
    const [leftovers] = await sql`select count(*)::int as n from growth_templates where status <> 'archived' and body like '%Mi nombre es Saúl%'`;
    expect(leftovers.n).toBe(0);
  });

  it("lets a prospector work their zones, claims the lead on the first send and blocks everyone else", async () => {
    await inRollback(async (tx) => {
      const lead = await seedTeam(tx);
      const norte = lead["itest-ws-1"];

      const [can] = await tx`select growth_can_act_on(${norte}, ${ANA}) as ana, growth_can_act_on(${norte}, ${BETO}) as beto, growth_can_act_on(${norte}, ${COORD}) as coord`;
      expect(can).toMatchObject({ ana: true, beto: false, coord: true });

      await tx`select growth_record_outcome(${norte}, 'whatsapp_sent', 'operator', '{"body":"Hola"}'::jsonb, null, null, ${ANA})`;
      const [owned] = await tx`select owner_user_id, stage from growth_leads where id = ${norte}`;
      expect(owned.owner_user_id).toBe(ANA);
      expect(owned.stage).toBe("contactado");
      const [event] = await tx`select actor_user_id, payload->>'body' as body from growth_lead_events where lead_id = ${norte} and type = 'whatsapp_sent'`;
      expect(event).toMatchObject({ actor_user_id: ANA, body: "Hola" });

      expect(await failure(tx, (sp) => sp`select growth_record_outcome(${norte}, 'whatsapp_replied', 'operator', '{}'::jsonb, null, null, ${BETO})`)).toContain("NOT_YOUR_LEAD");
      expect(await failure(tx, (sp) => sp`select growth_follow_up(${norte}, 'note', null, 'Hola', ${BETO})`)).toContain("NOT_YOUR_LEAD");
      expect(await failure(tx, (sp) => sp`select growth_follow_up(${norte}, 'note', null, 'Revisado', ${COORD})`)).toBeNull();
    });
  });

  it("hands each person only their own or unowned leads inside their zones, colonias included", async () => {
    await inRollback(async (tx) => {
      const lead = await seedTeam(tx);
      const anaCards = await tx`select id, reserved_by from growth_reserve_batch('whatsapp', null, null, 25, 120, ${TLACO}, ${ANA}) where municipio in (${NORTE}, ${SUR})`;
      expect(anaCards.map((row) => row.id).sort()).toEqual([lead["itest-ws-1"], lead["itest-ws-2"]].sort());
      expect(anaCards.every((row) => row.reserved_by === ANA)).toBe(true);

      const betoCards = await tx`select id from growth_reserve_batch('whatsapp', ${SUR}, null, 25, 120, ${TLACO}, ${BETO})`;
      expect(betoCards.map((row) => row.id)).toEqual([lead["itest-ws-3"]]);

      const [remaining] = await tx`select growth_sweep_remaining('whatsapp', ${SUR}, null, ${TLACO}, ${BETO}) as n`;
      expect(remaining.n).toBe(1);
    });
  });

  it("refuses a repeated phone or email and says who already works it", async () => {
    await inRollback(async (tx) => {
      await seedTeam(tx);
      const row = { business_name: "ITest Tacos Güero", phone_e164: "+525500000781", giro: "taqueria", municipio: NORTE, source_detail: "visita" };
      const [created] = await tx`select growth_add_lead(${TLACO}, ${ANA}, ${tx.json(row as never)}) as result`;
      expect(created.result.status).toBe("created");
      const [owner] = await tx`select owner_user_id, source from growth_leads where id = ${created.result.lead_id}`;
      expect(owner).toMatchObject({ owner_user_id: ANA, source: "manual" });

      const [repeated] = await tx`select growth_add_lead(${TLACO}, ${BETO}, ${tx.json({ ...row, business_name: "Otro nombre" } as never)}) as result`;
      expect(repeated.result).toMatchObject({ status: "conflict", owner_name: "Ana", lead_id: created.result.lead_id });

      await tx`insert into growth_suppressions (workspace_id, phone_e164, reason) values (${TLACO}, '+525500000782', 'rechazo')`;
      const [blocked] = await tx`select growth_add_lead(${TLACO}, ${BETO}, ${tx.json({ ...row, phone_e164: "+525500000782" } as never)}) as result`;
      expect(blocked.result.status).toBe("suppressed");

      expect(await failure(tx, (sp) => sp`select growth_update_lead_phone(${created.result.lead_id}, '+525500000771', ${ANA})`)).toContain("PHONE_TAKEN");
    });
  });

  it("keeps uniqueness per workspace: the same phone can live in another workspace", async () => {
    await inRollback(async (tx) => {
      await seedTeam(tx);
      await tx`insert into growth_workspaces (id, slug, name) values (${OTHER_WS}, 'itest-otro', 'Otro espacio')`;
      await tx`insert into growth_members (workspace_id, user_id, role, status, display_name) values (${OTHER_WS}, ${BETO}, 'coordinador', 'active', 'Beto')`;
      const row = { business_name: "ITest Repetido", phone_e164: "+525500000771", giro: "cafeteria", municipio: NORTE };
      const [result] = await tx`select growth_add_lead(${OTHER_WS}, ${BETO}, ${tx.json(row as never)}) as result`;
      expect(result.result.status).toBe("created");
      expect(await failure(tx, (sp) => sp`select growth_add_lead(${OTHER_WS}, ${ANA}, ${tx.json(row as never)})`)).toContain("NOT_A_MEMBER");
    });
  });

  it("the rollback snippet goes back to one global workspace with the previous functions", async () => {
    await inRollback(async (tx) => {
      await tx.unsafe(ROLLBACK);
      const [tables] = await tx`select count(*)::int as n from pg_tables where schemaname = 'public' and tablename in ('growth_workspaces', 'growth_members')`;
      expect(tables.n).toBe(0);
      const [column] = await tx`select count(*)::int as n from information_schema.columns where table_name = 'growth_leads' and column_name in ('workspace_id', 'owner_user_id', 'reserved_by')`;
      expect(column.n).toBe(0);
      const [settings] = await tx`select count(*)::int as n from growth_settings where id`;
      expect(settings.n).toBe(1);
      const [fn] = await tx`select count(*)::int as n from pg_proc where proname = 'growth_record_outcome' and pronargs = 6`;
      expect(fn.n).toBe(1);
      const [leftovers] = await tx`select count(*)::int as n from growth_templates where status <> 'archived' and body like '%{nombre}%'`;
      expect(leftovers.n).toBe(0);
    });
  });

  it("only coordinators reassign, and the move is logged", async () => {
    await inRollback(async (tx) => {
      const lead = await seedTeam(tx);
      const ids = [lead["itest-ws-1"], lead["itest-ws-2"]];
      expect(await failure(tx, (sp) => sp`select growth_assign_leads(${TLACO}, ${ANA}, ${ids}, ${ANA})`)).toContain("COORDINATOR_ONLY");
      const [moved] = await tx`select growth_assign_leads(${TLACO}, ${COORD}, ${ids}, ${BETO}) as n`;
      expect(moved.n).toBe(2);
      const owners = await tx`select distinct owner_user_id from growth_leads where id in ${tx(ids)}`;
      expect(owners.map((row) => row.owner_user_id)).toEqual([BETO]);
      const [logged] = await tx`select count(*)::int as n from growth_lead_events where lead_id in ${tx(ids)} and type = 'assigned' and actor_user_id = ${COORD}`;
      expect(logged.n).toBe(2);
      const [can] = await tx`select growth_can_act_on(${ids[0]}, ${BETO}) as beto, growth_can_act_on(${ids[0]}, ${ANA}) as ana`;
      expect(can).toMatchObject({ beto: true, ana: false });
    });
  });
});
