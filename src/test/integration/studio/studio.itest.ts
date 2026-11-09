import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { TransactionSql } from "postgres";
import { sql } from "@/test/integration/setup";

class StudioRollback extends Error {}
async function isolated(run: (tx: TransactionSql) => Promise<void>) {
  await expect(
    sql.begin(async (tx) => {
      await run(tx);
      throw new StudioRollback();
    }),
  ).rejects.toBeInstanceOf(StudioRollback);
}
async function seed(tx: TransactionSql) {
  const user = randomUUID(),
    tenant = randomUUID(),
    design = randomUUID(),
    asset = randomUUID();
  await tx`insert into auth.users(id,email) values(${user},${`studio-${user}@example.com`})`;
  await tx`insert into tenants(id,name,slug,public_store_enabled) values(${tenant},'ITest Studio',${`studio-${tenant}`},true)`;
  const [owner] =
    await tx`select id from tenant_roles where tenant_id=${tenant} and name='owner'`;
  await tx`insert into tenant_memberships(tenant_id,user_id,role_id,accepted_at,status) values(${tenant},${user},${owner.id},now(),'active')`;
  await tx`select set_config('request.jwt.claims',${JSON.stringify({ sub: user, role: "service_role" })},true)`;
  await tx`insert into tenant_studio_subscriptions(tenant_id,plan_code,status,contracted_amount_mxn,contracted_tlacos,current_period_start,current_period_end) values(${tenant},'basic','active',99,20,now(),now()+interval '1 month')`;
  await tx`insert into studio_designs(id,tenant_id,created_by,title,source_type,source_snapshot,source_hash,draft_scene,idempotency_key) values(${design},${tenant},${user},'Campaña','custom','{}',studio_source_fingerprint(${tenant},'custom',null),'{}',${randomUUID()})`;
  await tx`insert into studio_assets(id,tenant_id,design_id,kind,status,storage_path,mime_type) values(${asset},${tenant},${design},'original','ready',${`${tenant}/${design}/original/test.png`},'image/png')`;
  await tx`update studio_ai_routes set is_active=true,estimated_cost_usd=0.01 where operation='improve_photo' and quality='economy' and provider='gemini'`;
  await tx`update studio_runtime_limits set daily_budget_usd=1000000,tenant_monthly_budget_usd=1000000`;
  const [route] =
    await tx`select * from studio_ai_routes where operation='improve_photo' and quality='economy' and provider='gemini'`;
  return { user, tenant, design, asset, route };
}
type Fixture = Awaited<ReturnType<typeof seed>>;
async function enqueue(tx: TransactionSql, data: Fixture, key = randomUUID()) {
  const [quote] =
    await tx`insert into studio_ai_quotes(tenant_id,design_id,asset_id,requested_by,route_id,route_version,route_snapshot,budget_usd,cost,operation,quality,instructions) values(${data.tenant},${data.design},${data.asset},${data.user},${data.route.id},${data.route.config_version},${tx.json([{ id: data.route.id, provider: "gemini", model: "test-only", estimated_cost_usd: 0.01, config_version: data.route.config_version }])},0.03,1,'improve_photo','economy','Preserve product') returning id`;
  const [job] =
    await tx`select studio_enqueue_generation(${quote.id},${data.user},${key}) as result`;
  return job.result as { id: string; status: string };
}
async function grant(
  tx: TransactionSql,
  data: Fixture,
  kind: "purchased" | "subscription",
  amount: number,
) {
  const [row] =
    await tx`insert into studio_credit_grants(tenant_id,kind,amount,remaining,expires_at,external_reference) values(${data.tenant},${kind},${amount},${amount},${kind === "subscription" ? new Date(Date.now() + 86400_000) : null},${randomUUID()}) returning id`;
  return row.id as string;
}

describe("Studio accounting and durable jobs", () => {
  it("reserves the last Tlaco once and rolls back the entire second enqueue", () =>
    isolated(async (tx) => {
      const data = await seed(tx),
        grantId = await grant(tx, data, "purchased", 1),
        key = randomUUID();
      const first = await enqueue(tx, data, key),
        repeated = await enqueue(tx, data, key);
      expect(repeated.id).toBe(first.id);
      await expect(
        tx.savepoint(async (nested) => enqueue(nested, data)),
      ).rejects.toMatchObject({ message: "STUDIO_INSUFFICIENT_TLACOS" });
      const [balance] =
        await tx`select remaining,reserved from studio_credit_grants where id=${grantId}`;
      expect(balance).toEqual({ remaining: 1, reserved: 1 });
      const [counts] =
        await tx`select count(*)::integer as jobs from studio_ai_jobs where tenant_id=${data.tenant}`;
      expect(counts.jobs).toBe(1);
    }));
  it("consumes monthly credits before purchased credits and captures exactly once", () =>
    isolated(async (tx) => {
      const data = await seed(tx),
        monthly = await grant(tx, data, "subscription", 1),
        purchased = await grant(tx, data, "purchased", 3);
      const job = await enqueue(tx, data);
      await tx`select capture_studio_credits(${data.tenant},${job.id})`;
      await tx`select capture_studio_credits(${data.tenant},${job.id})`;
      const rows =
        await tx`select id,remaining,reserved from studio_credit_grants where tenant_id=${data.tenant}`;
      expect(rows.find((r) => r.id === monthly)).toMatchObject({
        remaining: 0,
        reserved: 0,
      });
      expect(rows.find((r) => r.id === purchased)).toMatchObject({
        remaining: 3,
        reserved: 0,
      });
      const [count] =
        await tx`select count(*)::integer as n from studio_credit_ledger where job_id=${job.id} and reason='capture'`;
      expect(count.n).toBe(1);
    }));
  it("does not restore an expired monthly lot when a failed job releases it", () =>
    isolated(async (tx) => {
      const data = await seed(tx),
        monthly = await grant(tx, data, "subscription", 1),
        job = await enqueue(tx, data);
      await tx`update studio_credit_grants set expires_at=now()-interval '1 second' where id=${monthly}`;
      await tx`select release_studio_credits(${data.tenant},${job.id})`;
      await tx`select release_studio_credits(${data.tenant},${job.id})`;
      const [row] =
        await tx`select remaining,reserved from studio_credit_grants where id=${monthly}`;
      expect(row).toEqual({ remaining: 0, reserved: 0 });
    }));
  it("creates a purchased grant once and preserves its payment evidence after a refund", () =>
    isolated(async (tx) => {
      const data = await seed(tx),
        order = randomUUID(),
        payment = `studio-test-${randomUUID()}`;
      await tx`insert into studio_credit_orders(id,tenant_id,pack_code,amount_mxn,tlacos,catalog_version,idempotency_key,created_by) values(${order},${data.tenant},'mini',49,10,1,${randomUUID()},${data.user})`;
      await tx`select apply_studio_credit_purchase(${order},${payment},49,now())`;
      await tx`select apply_studio_credit_purchase(${order},${payment},49,now())`;
      await tx`select studio_reverse_payment(${payment},false)`;
      await tx`select studio_reverse_payment(${payment},false)`;
      const [lot] =
        await tx`select count(*)::integer as n,sum(remaining)::integer as remaining from studio_credit_grants where tenant_id=${data.tenant}`;
      expect(lot).toEqual({ n: 1, remaining: 0 });
      const [evidence] =
        await tx`select status from studio_payments where provider_payment_id=${payment}`;
      expect(evidence.status).toBe("refunded");
      await expect(
        tx.savepoint(async (nested) => {
          await nested`delete from studio_credit_ledger where tenant_id=${data.tenant}`;
        }),
      ).rejects.toMatchObject({ message: "STUDIO_IMMUTABLE_RECORD" });
    }));
  it("requires reconfirmation when a quoted route changes", () =>
    isolated(async (tx) => {
      const data = await seed(tx);
      await grant(tx, data, "purchased", 2);
      const [quote] =
        await tx`insert into studio_ai_quotes(tenant_id,design_id,asset_id,requested_by,route_id,route_version,route_snapshot,budget_usd,cost,operation,quality,instructions) values(${data.tenant},${data.design},${data.asset},${data.user},${data.route.id},${data.route.config_version},'[{}]',0.03,1,'improve_photo','economy','Test') returning id`;
      await tx`update studio_ai_routes set estimated_cost_usd=0.02 where id=${data.route.id}`;
      await expect(
        tx.savepoint(async (nested) => {
          await nested`select studio_enqueue_generation(${quote.id},${data.user},${randomUUID()})`;
        }),
      ).rejects.toMatchObject({ message: "STUDIO_QUOTE_EXPIRED" });
      const [row] =
        await tx`select reserved from studio_credit_grants where tenant_id=${data.tenant}`;
      expect(row.reserved).toBe(0);
    }));
});

describe("Studio renewal and financial recovery", () => {
  it("confirms a change without granting benefits until the verified next renewal", () =>
    isolated(async (tx) => {
      const data = await seed(tx),
        payment = `renewal-${randomUUID()}`;
      const [sub] =
        await tx`update tenant_studio_subscriptions set current_period_end=now(),pending_plan_code='pro',pending_amount_mxn=199,pending_tlacos=60,plan_change_status='pending' where tenant_id=${data.tenant} returning id`;
      await tx`select studio_confirm_plan_change(${sub.id},'pro',199)`;
      const [before] =
        await tx`select count(*)::integer as n from studio_credit_grants where tenant_id=${data.tenant}`;
      expect(before.n).toBe(0);
      await tx`select grant_studio_subscription_credits(${sub.id},${payment},${`invoice-${payment}`},199,now(),now(),now()+interval '1 month')`;
      await tx`select grant_studio_subscription_credits(${sub.id},${payment},${`invoice-${payment}`},199,now(),now(),now()+interval '1 month')`;
      const [lot] =
        await tx`select amount,remaining from studio_credit_grants where tenant_id=${data.tenant}`;
      expect(lot).toEqual({ amount: 60, remaining: 60 });
      const [state] =
        await tx`select plan_code,pending_plan_code,plan_change_status from tenant_studio_subscriptions where id=${sub.id}`;
      expect(state).toEqual({
        plan_code: "pro",
        pending_plan_code: null,
        plan_change_status: null,
      });
      await expect(
        tx.savepoint(async (nested) => {
          await nested`select grant_studio_subscription_credits(${sub.id},${`overlap-${payment}`},${`overlap-invoice-${payment}`},199,now(),now()+interval '1 hour',now()+interval '1 month 1 hour')`;
        }),
      ).rejects.toMatchObject({ message: "STUDIO_OVERLAPPING_PERIOD" });
    }));
  it("preserves the intent when an unconfirmed change is still charged at the old price", () =>
    isolated(async (tx) => {
      const data = await seed(tx),
        payment = `pending-change-${randomUUID()}`;
      const [sub] =
        await tx`update tenant_studio_subscriptions set current_period_end=now(),pending_plan_code='pro',pending_amount_mxn=199,pending_tlacos=60,plan_change_status='pending' where tenant_id=${data.tenant} returning id`;
      await tx`select grant_studio_subscription_credits(${sub.id},${payment},${`invoice-${payment}`},99,now(),now(),now()+interval '1 month')`;
      const [state] =
        await tx`select plan_code,pending_plan_code,plan_change_status from tenant_studio_subscriptions where id=${sub.id}`;
      expect(state).toEqual({
        plan_code: "basic",
        pending_plan_code: "pro",
        plan_change_status: "pending",
      });
      const [lot] =
        await tx`select amount from studio_credit_grants where tenant_id=${data.tenant}`;
      expect(lot.amount).toBe(20);
    }));
  it("retains credits during a partial-refund review and audits an explicit support resolution", () =>
    isolated(async (tx) => {
      const data = await seed(tx),
        order = randomUUID(),
        payment = `partial-${randomUUID()}`,
        resolution = randomUUID();
      await tx`insert into studio_credit_orders(id,tenant_id,pack_code,amount_mxn,tlacos,catalog_version,idempotency_key,created_by) values(${order},${data.tenant},'mini',49,10,1,${randomUUID()},${data.user})`;
      await tx`select apply_studio_credit_purchase(${order},${payment},49,now())`;
      await tx`select studio_flag_partial_refund(${payment},1)`;
      const [lot] =
        await tx`select remaining from studio_credit_grants where tenant_id=${data.tenant}`;
      expect(lot.remaining).toBe(10);
      const [blocked] =
        await tx`select ai_blocked from tenant_studio_subscriptions where tenant_id=${data.tenant}`;
      expect(blocked.ai_blocked).toBe(true);
      await expect(
        tx.savepoint(async (nested) => {
          await nested`select studio_resolve_credit_review(${data.tenant},${data.user},'Reviewed payment and granted courtesy',${resolution})`;
        }),
      ).rejects.toMatchObject({ message: "STUDIO_FORBIDDEN" });
      await tx`insert into platform_admins(user_id) values(${data.user})`;
      await tx`select studio_resolve_credit_review(${data.tenant},${data.user},'Reviewed payment and granted courtesy',${resolution})`;
      await tx`select studio_resolve_credit_review(${data.tenant},${data.user},'Reviewed payment and granted courtesy',${resolution})`;
      await tx`select studio_flag_partial_refund(${payment},1)`;
      const [resolved] =
        await tx`select ai_blocked from tenant_studio_subscriptions where tenant_id=${data.tenant}`;
      expect(resolved.ai_blocked).toBe(false);
      const [audit] =
        await tx`select count(*)::integer as n from studio_activity_events where tenant_id=${data.tenant} and action='payment.review_resolved'`;
      expect(audit.n).toBe(1);
      const job = await enqueue(tx, data),
        output = randomUUID();
      const [claimed] = await tx`select studio_claim_job(${job.id}) as job`;
      await tx`insert into studio_assets(id,tenant_id,design_id,kind,status,storage_path,mime_type,source_asset_id) values(${output},${data.tenant},${data.design},'generated','pending',${`${data.tenant}/${data.design}/generated/${output}.png`},'image/png',${data.asset})`;
      await tx`select studio_finish_job(${job.id},${claimed.job.lease_token},${output},null)`;
      const [after] =
        await tx`select remaining,reserved from studio_credit_grants where tenant_id=${data.tenant}`;
      expect(after).toEqual({ remaining: 9, reserved: 0 });
    }));
});

describe("Studio access and immutable snapshots", () => {
  it("preserves historical renders when a new exporter version produces the same composition", () =>
    isolated(async (tx) => {
      const data = await seed(tx);
      const [snapshot] =
        await tx`select studio_create_version(${data.tenant},${data.user},${data.design},1,false,'{}') as version`;
      const render = randomUUID();
      await tx`insert into studio_renders(id,tenant_id,design_id,design_version_id,asset_id,format,surface,renderer_version) values(${render},${data.tenant},${data.design},${snapshot.version.id},${data.asset},'square','social',1)`;
      await tx`insert into studio_renders(tenant_id,design_id,design_version_id,asset_id,format,surface,renderer_version) values(${data.tenant},${data.design},${snapshot.version.id},${data.asset},'square','social',2)`;
      const rows =
        await tx`select renderer_version from studio_renders where design_version_id=${snapshot.version.id} order by renderer_version`;
      expect(rows).toEqual([{ renderer_version: 1 }, { renderer_version: 2 }]);
      await expect(
        tx.savepoint(async (nested) => {
          await nested`update studio_renders set renderer_version=3 where id=${render}`;
        }),
      ).rejects.toMatchObject({ message: "STUDIO_IMMUTABLE_RECORD" });
      await expect(
        tx.savepoint(async (nested) => {
          await nested`insert into studio_renders(tenant_id,design_id,design_version_id,asset_id,format,surface,renderer_version) values(${data.tenant},${data.design},${snapshot.version.id},${data.asset},'square','social',2)`;
        }),
      ).rejects.toMatchObject({ code: "23505" });
    }));
  it("keeps another tenant's designs outside RLS and financial RPC outside browser grants", () =>
    isolated(async (tx) => {
      const data = await seed(tx),
        other = randomUUID();
      await tx`insert into tenants(id,name,slug) values(${other},'Other studio',${`other-${other}`})`;
      // The seed's claims make the new-tenant trigger enroll this user as owner; the point is a tenant they do not belong to.
      await tx`delete from tenant_memberships where tenant_id=${other}`;
      await tx`insert into studio_designs(tenant_id,created_by,title,source_type,source_snapshot,source_hash,draft_scene,idempotency_key) values(${other},${data.user},'Private','custom','{}',studio_source_fingerprint(${other},'custom',null),'{}',${randomUUID()})`;
      await tx`select set_config('request.jwt.claims',${JSON.stringify({ sub: data.user, role: "authenticated" })},true)`;
      await tx`set local role authenticated`;
      const rows = await tx`select tenant_id from studio_designs`;
      expect(rows).toEqual([{ tenant_id: data.tenant }]);
      const [permission] =
        await tx`select has_function_privilege('authenticated','public.reserve_studio_credits(uuid,uuid,integer)','EXECUTE') as allowed`;
      expect(permission.allowed).toBe(false);
    }));
  it("removes access from suspended members even if their role grants Studio", () =>
    isolated(async (tx) => {
      const data = await seed(tx);
      await tx`update tenant_memberships set status='suspended' where tenant_id=${data.tenant} and user_id=${data.user}`;
      const [row] =
        await tx`select studio_has_permission(${data.tenant},'studio.read',${data.user}) as allowed`;
      expect(row.allowed).toBe(false);
    }));
  it("reuses an immutable version and detects conflicting editor revisions", () =>
    isolated(async (tx) => {
      const data = await seed(tx);
      const [first] =
        await tx`select studio_create_version(${data.tenant},${data.user},${data.design},1,false,'{}') as version`;
      const [second] =
        await tx`select studio_create_version(${data.tenant},${data.user},${data.design},1,false,'{}') as version`;
      expect(second.version.id).toBe(first.version.id);
      await tx`select studio_save_design(${data.tenant},${data.user},${data.design},1,'{"title":"Updated"}')`;
      await expect(
        tx.savepoint(async (nested) => {
          await nested`select studio_save_design(${data.tenant},${data.user},${data.design},1,'{"title":"Stale"}')`;
        }),
      ).rejects.toMatchObject({ message: "STUDIO_REVISION_CONFLICT" });
      await expect(
        tx.savepoint(async (nested) => {
          await nested`update studio_design_versions set scene_json='{"changed":true}' where id=${first.version.id}`;
        }),
      ).rejects.toMatchObject({ message: "STUDIO_IMMUTABLE_RECORD" });
    }));
});
