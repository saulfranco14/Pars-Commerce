/* eslint-disable @typescript-eslint/no-explicit-any -- see billingService: migration-first module. */
import type { SupabaseClient } from "@supabase/supabase-js";

export interface CreditRecommendation {
  recommended_amount: number;
  max_amount: number;
  eligible: boolean;
  reasons: string[];
  metrics: { paid_last_90_days: number; paid_orders: number; active_debt: number; overdue_loans: number };
}

/** Advisory only: this never creates a loan nor grants automatic credit. */
export async function getCreditRecommendation(
  admin: SupabaseClient<any>, tenantId: string, customerId: string,
): Promise<CreditRecommendation> {
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const [ordersResult, loansResult] = await Promise.all([
    admin.from("orders").select("total, paid_at").eq("tenant_id", tenantId).eq("customer_id", customerId).eq("status", "paid").gte("paid_at", since.toISOString()),
    admin.from("loans").select("amount_pending, status, due_date").eq("tenant_id", tenantId).eq("customer_id", customerId),
  ]);
  if (ordersResult.error) throw new Error(ordersResult.error.message);
  if (loansResult.error) throw new Error(loansResult.error.message);
  const { data: policy, error: policyError } = await admin
    .from("tenant_credit_policies")
    .select("min_paid_last_90_days, max_recommendation_percent, block_overdue_loans")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (policyError) throw new Error(policyError.message);
  const paid = (ordersResult.data ?? []).reduce((sum: number, row: any) => sum + Number(row.total ?? 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const active = (loansResult.data ?? []).filter((loan: any) => ["pending", "partial"].includes(loan.status));
  const activeDebt = active.reduce((sum: number, loan: any) => sum + Number(loan.amount_pending ?? 0), 0);
  const overdue = active.filter((loan: any) => loan.due_date && loan.due_date < today).length;
  const reasons: string[] = [];
  const minPaid = Number(policy?.min_paid_last_90_days ?? 0);
  const rate = Number(policy?.max_recommendation_percent ?? 30) / 100;
  const blockOverdue = policy?.block_overdue_loans ?? true;
  if (overdue && blockOverdue) reasons.push("Tiene préstamos vencidos pendientes");
  if (paid < minPaid) reasons.push(`Aún no alcanza $${minPaid.toFixed(2)} de compras pagadas recientes`);
  else if (!paid) reasons.push("Aún no tiene compras pagadas suficientes en los últimos 90 días");
  if (paid >= 500) reasons.push("Tiene compras pagadas recientes en este negocio");
  if (activeDebt) reasons.push(`Ya mantiene $${activeDebt.toFixed(2)} pendiente`);
  const max = (overdue && blockOverdue) || paid < minPaid || !paid
    ? 0
    : Math.max(0, Math.floor((paid * rate - activeDebt) * 100) / 100);
  return { recommended_amount: max, max_amount: max, eligible: max > 0, reasons, metrics: { paid_last_90_days: paid, paid_orders: ordersResult.data?.length ?? 0, active_debt: activeDebt, overdue_loans: overdue } };
}
