import { describe, expect, it } from "vitest";

import {
  duePeriod,
  planPriceLabel,
  planReminderMessage,
  planSubscriptionTab,
} from "@/features/suscripciones/helpers/planSubscriptionView";

import type { PlanPeriod } from "@/features/suscripciones/interfaces/planSubscription";

function period(n: number, status: PlanPeriod["status"]): PlanPeriod {
  return {
    id: `p${n}`,
    period_number: n,
    status,
    amount: 559,
    starts_at: "2026-11-20T06:00:00Z",
    ends_at: "2026-12-20T06:00:00Z",
    due_at: "2026-11-20T06:00:00Z",
    paid_at: null,
    order_id: `o${n}`,
    order_tracking_token: null,
  };
}

describe("duePeriod", () => {
  it("picks the newest unpaid period", () => {
    expect(duePeriod([period(1, "paid"), period(2, "overdue"), period(3, "pending")])?.period_number).toBe(3);
    expect(duePeriod([period(1, "paid"), period(2, "cancelled")])).toBeNull();
  });
});

describe("planSubscriptionTab", () => {
  it("files each subscription where the business has to act", () => {
    expect(planSubscriptionTab({ status: "active", due_period: period(2, "pending") })).toBe("por_cobrar");
    expect(planSubscriptionTab({ status: "active", due_period: null })).toBe("activas");
    expect(planSubscriptionTab({ status: "past_due", due_period: period(2, "overdue") })).toBe("vencidas");
    expect(planSubscriptionTab({ status: "pending_setup", due_period: period(1, "pending") })).toBe("pendientes");
    expect(planSubscriptionTab({ status: "completed", due_period: null })).toBe("terminadas");
  });
});

describe("labels", () => {
  it("prices per interval and writes a reminder with the pay link", () => {
    expect(planPriceLabel({ price: 559, interval_unit: "month", interval_count: 1 })).toBe("$559 / mes");
    expect(planPriceLabel({ price: 120.5, interval_unit: "week", interval_count: 2 })).toBe("$120.5 / 2 semanas");
    const message = planReminderMessage({
      customerName: "Juan Pérez",
      planName: "Despensa Básica",
      period: period(2, "pending"),
      payUrl: "https://tlaco.app/pedido/abc",
    });
    expect(message).toContain("Hola Juan, tu Despensa Básica del periodo 2 ya está listo.");
    expect(message).toContain("$559.00");
    expect(message).toContain("https://tlaco.app/pedido/abc");
  });
});
