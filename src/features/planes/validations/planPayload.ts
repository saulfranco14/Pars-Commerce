import { roundMoney } from "@/lib/offers/pricing";

import {
  MAX_PLAN_PRICE,
  PLAN_BILLING_METHODS,
  PLAN_FULFILLMENT_METHODS,
  PLAN_KINDS,
  PLAN_STATUSES,
} from "@/features/planes/constants/planOptions";

import type { NormalizedOfferPlan, OfferPlanWriteInput } from "@/features/planes/interfaces/offerPlan";

type Result = { ok: true; data: NormalizedOfferPlan } | { ok: false; message: string };

function invalid(message: string): Result {
  return { ok: false, message };
}

function isIntBetween(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function subsetOf(values: unknown, allowed: readonly string[]): string[] | null {
  if (!Array.isArray(values)) return null;
  const unique = [...new Set(values)];
  if (unique.length === 0 || !unique.every((value) => typeof value === "string" && allowed.includes(value))) return null;
  return unique as string[];
}

/**
 * Validates a plan write. `existing` is the stored row on PATCH so the kind
 * still decides which rules apply when only some fields change.
 */
export function normalizePlanInput(
  input: OfferPlanWriteInput,
  mode: "create" | "update",
  existing: Partial<OfferPlanWriteInput> = {},
): Result {
  const fields: Record<string, unknown> = {};
  const kind = input.kind ?? existing.kind;

  if (mode === "create" || input.kind !== undefined) {
    if (!kind || !(PLAN_KINDS as readonly string[]).includes(kind)) return invalid("Elige si es suscripción o membresía.");
    if (kind === "membership") return invalid("Las membresías estarán disponibles pronto.");
    fields.kind = kind;
  }

  if (input.status !== undefined) {
    if (!(PLAN_STATUSES as readonly string[]).includes(input.status)) return invalid("Estado no válido.");
    fields.status = input.status;
  }

  if (mode === "create" || input.name !== undefined) {
    const name = input.name?.trim() ?? "";
    if (name.length < 3 || name.length > 80) return invalid("El nombre debe tener entre 3 y 80 caracteres.");
    fields.name = name;
  }

  if (mode === "create" || input.price !== undefined) {
    const price = Number(input.price);
    if (!Number.isFinite(price) || price <= 0 || price > MAX_PLAN_PRICE) return invalid("Escribe un precio mayor a $0.");
    fields.price = roundMoney(price);
  }

  if (mode === "create" || input.interval_unit !== undefined) {
    if (input.interval_unit !== "week" && input.interval_unit !== "month") return invalid("Elige cada cuánto se repite.");
    fields.interval_unit = input.interval_unit;
  }

  if (mode === "create" || input.interval_count !== undefined) {
    const count = input.interval_count ?? 1;
    if (!isIntBetween(count, 1, 12)) return invalid("El periodo debe ser de 1 a 12.");
    fields.interval_count = count;
  }

  if (input.max_periods !== undefined) {
    if (input.max_periods !== null && !isIntBetween(input.max_periods, 1, 120)) return invalid("La duración debe ser de 1 a 120 periodos.");
    fields.max_periods = input.max_periods;
  }

  if (mode === "create" || input.billing_methods !== undefined) {
    const methods = subsetOf(input.billing_methods ?? ["manual"], PLAN_BILLING_METHODS);
    if (!methods) return invalid("Elige al menos una forma de cobro.");
    if (methods.includes("mp_auto")) return invalid("El cobro automático estará disponible pronto.");
    fields.billing_methods = methods;
  }

  if (mode === "create" || input.fulfillment_methods !== undefined) {
    const methods = subsetOf(input.fulfillment_methods, PLAN_FULFILLMENT_METHODS);
    if (!methods) return invalid("Elige cómo recibe el cliente su plan.");
    if (kind === "subscription" && methods.includes("in_store")) return invalid("Una suscripción se recoge o se entrega a domicilio.");
    fields.fulfillment_methods = methods;
  }

  if (input.preferred_weekday !== undefined) {
    if (input.preferred_weekday !== null && !isIntBetween(input.preferred_weekday, 0, 6)) return invalid("Día de entrega no válido.");
    fields.preferred_weekday = input.preferred_weekday;
  }

  if (input.renewal_lead_days !== undefined) {
    if (!isIntBetween(input.renewal_lead_days, 0, 14)) return invalid("Los días de anticipación deben ser de 0 a 14.");
    fields.renewal_lead_days = input.renewal_lead_days;
  }

  if (input.grace_days !== undefined) {
    if (!isIntBetween(input.grace_days, 0, 30)) return invalid("Los días de tolerancia deben ser de 0 a 30.");
    fields.grace_days = input.grace_days;
  }

  if (input.max_active_members !== undefined) {
    if (input.max_active_members !== null && !isIntBetween(input.max_active_members, 1, 100_000)) {
      return invalid("El cupo debe ser de al menos 1.");
    }
    fields.max_active_members = input.max_active_members;
  }

  if (input.description !== undefined) {
    const description = trimOrNull(input.description);
    if (description && description.length > 500) return invalid("La descripción admite hasta 500 caracteres.");
    fields.description = description;
  }
  if (input.image_url !== undefined) fields.image_url = trimOrNull(input.image_url);
  if (input.template_key !== undefined) fields.template_key = trimOrNull(input.template_key);

  let items: NormalizedOfferPlan["items"] = null;
  if (mode === "create" || (input.items !== undefined && input.items !== null)) {
    const merged = new Map<string, { product_id: string; product_variant_id: string | null; quantity: number }>();
    for (const item of input.items ?? []) {
      if (!item.product_id) return invalid("Un producto del plan no es válido.");
      if (!isIntBetween(item.quantity, 1, 999)) return invalid("Cada producto debe llevar de 1 a 999 piezas.");
      const variant = item.product_variant_id ?? null;
      const key = `${item.product_id}:${variant ?? ""}`;
      const current = merged.get(key);
      merged.set(key, { product_id: item.product_id, product_variant_id: variant, quantity: (current?.quantity ?? 0) + item.quantity });
    }
    items = [...merged.values()];
    if (kind === "subscription" && items.length === 0) return invalid("Agrega al menos un producto al plan.");
    if (items.some((item) => item.quantity > 999)) return invalid("Cada producto debe llevar de 1 a 999 piezas.");
  }

  return { ok: true, data: { fields, items } };
}
