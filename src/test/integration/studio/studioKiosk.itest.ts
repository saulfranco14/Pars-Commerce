import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { sql } from "@/test/integration/setup";

import type { TransactionSql } from "postgres";

const ROLLBACK = readFileSync(
  fileURLToPath(
    new URL(
      "../../../../supabase/snippets/studio_kiosk_placements_rollback.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

class RolledBack extends Error {}
async function isolated(run: (tx: TransactionSql) => Promise<void>) {
  await expect(
    sql.begin(async (tx) => {
      await run(tx);
      throw new RolledBack();
    }),
  ).rejects.toBeInstanceOf(RolledBack);
}

async function seed(tx: TransactionSql, sourceType: "product" | "custom") {
  const user = randomUUID(),
    tenant = randomUUID(),
    product = randomUUID(),
    design = randomUUID(),
    asset = randomUUID();
  await tx`insert into auth.users(id,email) values(${user},${`kiosk-${user}@example.com`})`;
  await tx`insert into tenants(id,name,slug,public_store_enabled) values(${tenant},'ITest Kiosco',${`kiosk-${tenant}`},true)`;
  const [owner] =
    await tx`select id from tenant_roles where tenant_id=${tenant} and name='owner'`;
  await tx`insert into tenant_memberships(tenant_id,user_id,role_id,accepted_at,status) values(${tenant},${user},${owner.id},now(),'active')`;
  await tx`select set_config('request.jwt.claims',${JSON.stringify({ sub: user, role: "service_role" })},true)`;
  await tx`insert into products(id,tenant_id,name,slug,price,is_public) values(${product},${tenant},'Café','cafe',45,true)`;
  const sourceId = sourceType === "product" ? product : null;
  await tx`insert into studio_designs(id,tenant_id,created_by,title,source_type,source_id,source_snapshot,source_hash,draft_scene,idempotency_key) values(${design},${tenant},${user},'Café del día',${sourceType},${sourceId},'{}',studio_source_fingerprint(${tenant},${sourceType},${sourceId}),'{}',${randomUUID()})`;
  await tx`insert into studio_assets(id,tenant_id,design_id,kind,status,storage_path,mime_type) values(${asset},${tenant},${design},'render','ready',${`${tenant}/${design}/render/test.png`},'image/png')`;
  const [snapshot] =
    await tx`select studio_create_version(${tenant},${user},${design},1,false,'{}') as version`;
  return { user, tenant, product, design, asset, version: snapshot.version.id };
}

async function apply(
  tx: TransactionSql,
  data: Awaited<ReturnType<typeof seed>>,
  surface: string,
  format: string,
) {
  const render = randomUUID();
  await tx`insert into studio_renders(id,tenant_id,design_id,design_version_id,asset_id,format,surface,renderer_version) values(${render},${data.tenant},${data.design},${data.version},${data.asset},${format},${surface},1)`;
  const [row] =
    await tx`select studio_apply_placement(${data.tenant},${data.user},${data.version},${render},${surface},'Café del día','Café del día','',now(),now()+interval '1 day',${randomUUID()}) as placement`;
  return row.placement as { channel: string; target_key: string };
}

describe("Studio kiosk placements", () => {
  it("places a product ad on the kiosk in both shapes, per product", () =>
    isolated(async (tx) => {
      const data = await seed(tx, "product");
      const story = await apply(tx, data, "kiosk_story", "story");
      const card = await apply(tx, data, "kiosk_card", "portrait");
      const store = await apply(tx, data, "product_campaign", "square");
      expect(story).toMatchObject({ channel: "kiosk", target_key: `product:${data.product}` });
      expect(card).toMatchObject({ channel: "kiosk", target_key: `product:${data.product}` });
      expect(store).toMatchObject({ channel: "public_store" });
      const resolved =
        await tx`select count(*)::int as n from studio_resolve_placements(${data.tenant},'kiosk','kiosk_story',null)`;
      expect(resolved[0].n).toBe(1);
    }));

  it("keeps the kiosk for product ads only", () =>
    isolated(async (tx) => {
      const data = await seed(tx, "custom");
      await expect(
        tx.savepoint((nested) => apply(nested, data, "kiosk_story", "story")),
      ).rejects.toMatchObject({ message: "STUDIO_INVALID_SURFACE" });
    }));

  it("rejects a kiosk row on a store channel", () =>
    isolated(async (tx) => {
      const data = await seed(tx, "product");
      const placed = await apply(tx, data, "kiosk_card", "portrait");
      expect(placed.channel).toBe("kiosk");
      await expect(
        tx.savepoint(
          (nested) =>
            nested`update studio_placements set channel='public_store' where surface='kiosk_card' and tenant_id=${data.tenant}`,
        ),
      ).rejects.toMatchObject({ code: "23514" });
    }));

  it("rollback removes kiosk ads and the kiosk surfaces", () =>
    isolated(async (tx) => {
      const data = await seed(tx, "product");
      await apply(tx, data, "kiosk_story", "story");
      await tx.unsafe(ROLLBACK);
      const left =
        await tx`select count(*)::int as n from studio_placements where tenant_id=${data.tenant}`;
      expect(left[0].n).toBe(0);
      await expect(
        tx.savepoint((nested) => apply(nested, data, "kiosk_card", "portrait")),
      ).rejects.toMatchObject({ message: "STUDIO_INVALID_SURFACE" });
      await expect(apply(tx, data, "product_campaign", "square")).resolves.toMatchObject({
        channel: "public_store",
      });
    }));
});
