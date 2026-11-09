import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/auth/isPlatformAdmin";
import { studioDb } from "./studioDb";
import { StudioError, requireStudioData } from "./studioErrors";
import { uuidSchema } from "../validations/studioSchemas";
import { reconcileStudio } from "./studioReconcileService";

export async function reconcileStudioPlatform() {
  await requireStudioPlatform();
  return reconcileStudio();
}

async function requireStudioPlatform() {
  const client = await createClient(),
    {
      data: { user },
    } = await client.auth.getUser();
  if (!user) throw new StudioError("UNAUTHORIZED");
  if (!(await isPlatformAdmin(user.id))) throw new StudioError("FORBIDDEN");
  return { user, db: studioDb() };
}
export async function getStudioPlatform() {
  const { db } = await requireStudioPlatform();
  const [memberships, jobs, payments, events, reservations, limits, attempts] =
    await Promise.all([
      db
        .from("tenant_studio_subscriptions")
        .select("id,tenant_id,plan_code,status,current_period_end,ai_blocked")
        .order("updated_at", { ascending: false })
        .limit(50),
      db
        .from("studio_ai_jobs")
        .select("id,tenant_id,status,error_code,created_at,updated_at")
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("studio_payments")
        .select("id,tenant_id,status,amount_mxn,refunded_mxn,created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("studio_payment_events")
        .select("id,resource_type,status,error_code,received_at")
        .eq("status", "failed")
        .order("received_at", { ascending: false })
        .limit(50),
      db
        .from("studio_credit_reservations")
        .select("id,tenant_id,job_id,amount,expires_at")
        .eq("status", "held")
        .order("expires_at")
        .limit(50),
      db.from("studio_runtime_limits").select("*").single(),
      db
        .from("studio_ai_attempts")
        .select("provider,estimated_cost_usd,actual_cost_usd,status,created_at")
        .gte("created_at", new Date(Date.now() - 86400_000).toISOString())
        .limit(1000),
    ]);
  return {
    memberships: requireStudioData(memberships),
    jobs: requireStudioData(jobs),
    payments: requireStudioData(payments),
    events: requireStudioData(events),
    reservations: requireStudioData(reservations),
    limits: requireStudioData(limits),
    attempts: requireStudioData(attempts),
  };
}
export async function adjustStudioCredits(raw: unknown) {
  const { db, user } = await requireStudioPlatform();
  const input = z
    .object({
      tenant_id: uuidSchema,
      amount: z.number().int().min(1).max(500),
      reason: z.string().trim().min(10).max(300),
      idempotency_key: uuidSchema,
    })
    .parse(raw);
  return requireStudioData(
    await db.rpc("studio_adjust_credits", {
      p_tenant_id: input.tenant_id,
      p_actor_id: user.id,
      p_amount: input.amount,
      p_reason: input.reason,
      p_key: input.idempotency_key,
    }),
  );
}

export async function resolveStudioCreditReview(raw: unknown) {
  const { db, user } = await requireStudioPlatform();
  const input = z
    .object({
      tenant_id: uuidSchema,
      reason: z.string().trim().min(10).max(300),
      idempotency_key: uuidSchema,
    })
    .parse(raw);
  return requireStudioData(
    await db.rpc("studio_resolve_credit_review", {
      p_tenant_id: input.tenant_id,
      p_actor_id: user.id,
      p_reason: input.reason,
      p_key: input.idempotency_key,
    }),
  );
}
