import "server-only";
import { timingSafeEqual } from "node:crypto";
import { studioDb } from "./studioDb";
import { requireStudioData, StudioError } from "./studioErrors";
import { dispatchStudioWebhook } from "./studioWebhookService";
import {
  studioMpRequest,
  withStudioPaymentDeadline,
} from "./studioPaymentProvider";
import { reconcileStudioPlanChange } from "./studioBillingService";
import { STUDIO_BUCKET } from "../constants/studio";
import type {
  StudioMpInvoice,
  StudioMpPayment,
  StudioMpSubscription,
} from "./studioPaymentProvider";

export function validStudioCronSecret(value: string | null): boolean {
  const expected = process.env.STUDIO_CRON_SECRET;
  if (!expected || !value) return false;
  const a = Buffer.from(expected),
    b = Buffer.from(value);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function reconcileStudio() {
  const deadline = Date.now() + 45_000;
  return withStudioPaymentDeadline(deadline, () => reconcileBatch(deadline));
}

async function reconcileBatch(deadline: number) {
  const db = studioDb(),
    state = requireStudioData(await db.rpc("studio_reconcile_state", {}));
  const financialDeadline = deadline - 8000;
  let providerBudget = Math.min(financialDeadline, Date.now() + 8000);
  const requestProvider = <T>(path: string): Promise<T> =>
    withStudioPaymentDeadline(providerBudget, () => studioMpRequest<T>(path));
  const reconcileResource = (type: string, id: string, action = "reconcile") =>
    withStudioPaymentDeadline(providerBudget, () =>
      dispatchStudioWebhook(type, id, action),
    );
  let payments = 0,
    failures = 0,
    cleaned = 0;
  const events = requireStudioData(
    await db
      .from("studio_payment_events")
      .select("id,resource_type,resource_id,event_key")
      .eq("status", "failed")
      .order("last_attempt_at", { nullsFirst: true })
      .order("received_at")
      .limit(10),
  );
  for (const event of events) {
    if (Date.now() >= providerBudget) break;
    try {
      await reconcileResource(
        event.resource_type,
        event.resource_id,
        "reconcile",
      );
      await db
        .from("studio_payment_events")
        .update({
          status: "processed",
          processed_at: new Date().toISOString(),
          error_code: null,
        })
        .eq("id", event.id);
      payments++;
    } catch {
      failures++;
    }
  }
  providerBudget = Math.min(financialDeadline, Date.now() + 8000);
  const pending = requireStudioData(
    await db
      .from("studio_credit_orders")
      .select("id")
      .eq("status", "pending")
      .order("last_reconciled_at", { nullsFirst: true })
      .order("created_at")
      .limit(5),
  );
  for (const order of pending) {
    if (Date.now() >= providerBudget) break;
    await db
      .from("studio_credit_orders")
      .update({ last_reconciled_at: new Date().toISOString() })
      .eq("id", order.id);
    try {
      const result = await requestProvider<{ results: StudioMpPayment[] }>(
        `v1/payments/search?external_reference=${encodeURIComponent(`studio_credit_pack:${order.id}`)}&limit=10&sort=date_created&criteria=desc`,
      );
      for (const payment of result.results ?? []) {
        if (Date.now() >= providerBudget) break;
        if (payment.external_reference === `studio_credit_pack:${order.id}`) {
          await reconcileResource("payment", String(payment.id), "reconcile");
          payments++;
        }
      }
    } catch {
      failures++;
    }
  }
  providerBudget = Math.min(financialDeadline, Date.now() + 8000);
  const approved = requireStudioData(
    await db
      .from("studio_payments")
      .select("id,provider_payment_id")
      .eq("status", "approved")
      .order("last_reconciled_at", { nullsFirst: true })
      .order("paid_at")
      .limit(5),
  );
  for (const payment of approved) {
    if (Date.now() >= providerBudget) break;
    await db
      .from("studio_payments")
      .update({ last_reconciled_at: new Date().toISOString() })
      .eq("id", payment.id);
    try {
      await reconcileResource("payment", payment.provider_payment_id);
      payments++;
    } catch {
      failures++;
    }
  }
  providerBudget = financialDeadline;
  const subscriptions = requireStudioData(
    await db
      .from("tenant_studio_subscriptions")
      .select("id,tenant_id,mp_preapproval_id,status,plan_change_status")
      .neq("status", "cancelled")
      .order("updated_at")
      .limit(10),
  );
  for (const sub of subscriptions) {
    if (Date.now() >= providerBudget) break;
    try {
      let preapprovalId = sub.mp_preapproval_id;
      if (!preapprovalId && sub.status === "pending_payment") {
        const result = await requestProvider<{
          results: StudioMpSubscription[];
        }>(
          `preapproval/search?external_reference=${encodeURIComponent(`studio_subscription:${sub.id}`)}&limit=50`,
        );
        const matches = (result.results ?? []).filter(
          (p) => p.external_reference === `studio_subscription:${sub.id}`,
        );
        if (matches.length === 1) {
          preapprovalId = matches[0].id;
          requireStudioData(
            await db
              .from("tenant_studio_subscriptions")
              .update({
                mp_preapproval_id: preapprovalId,
                mp_init_point: matches[0].init_point ?? null,
                updated_at: new Date().toISOString(),
              })
              .eq("tenant_id", sub.tenant_id)
              .eq("id", sub.id)
              .is("mp_preapproval_id", null)
              .select("id")
              .single(),
          );
        }
      }
      if (preapprovalId) {
        await reconcileResource("subscription_preapproval", preapprovalId);
        if (sub.plan_change_status === "pending")
          await withStudioPaymentDeadline(providerBudget, () =>
            reconcileStudioPlanChange(sub.id),
          );
        const result = await requestProvider<{ results: StudioMpInvoice[] }>(
          `authorized_payments/search?preapproval_id=${encodeURIComponent(preapprovalId)}&limit=10`,
        );
        for (const invoice of result.results ?? []) {
          if (Date.now() >= providerBudget) break;
          await reconcileResource(
            "subscription_authorized_payment",
            String(invoice.id),
            "reconcile",
          );
          payments++;
        }
      }
    } catch {
      failures++;
    } finally {
      await db
        .from("tenant_studio_subscriptions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sub.id);
    }
  }
  const pendingAssets = requireStudioData(
    await db
      .from("studio_assets")
      .select("id,tenant_id,storage_path")
      .eq("status", "pending")
      .lt("created_at", new Date(Date.now() - 86400_000).toISOString())
      .limit(50),
  );
  for (const asset of pendingAssets) {
    if (Date.now() >= deadline) break;
    const linked = await db
      .from("studio_ai_jobs")
      .select("id")
      .eq("tenant_id", asset.tenant_id)
      .or(`input_asset_id.eq.${asset.id},result_asset_id.eq.${asset.id}`)
      .limit(1);
    if (linked.error || linked.data?.length) continue;
    const removed = await db.storage
      .from(STUDIO_BUCKET)
      .remove([asset.storage_path]);
    if (!removed.error) {
      const deleted = await db
        .from("studio_assets")
        .delete()
        .eq("id", asset.id)
        .eq("tenant_id", asset.tenant_id)
        .eq("status", "pending");
      if (!deleted.error) cleaned++;
    }
  }
  if (Date.now() < deadline) {
    const orphanPaths = requireStudioData(
      await db.rpc("studio_orphan_storage_paths", { p_limit: 25 }),
    );
    if (orphanPaths.length) {
      const result = await db.storage
        .from(STUDIO_BUCKET)
        .remove(orphanPaths.map((row) => row.storage_path));
      if (!result.error) cleaned += orphanPaths.length;
    }
  }
  console.info("[studio] reconciliation", { payments, failures, cleaned });
  if (failures && !payments)
    throw new StudioError(
      "RECONCILIATION_PENDING",
      "Hay pagos pendientes de conciliación.",
      503,
    );
  return { state, payments, failures, cleaned };
}
