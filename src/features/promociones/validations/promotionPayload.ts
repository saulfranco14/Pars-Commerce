import { MAX_PERCENTAGE_DISCOUNT } from "@/lib/offers/pricing";

import type {
  NormalizedPromotion,
  PromotionWriteInput,
} from "@/features/promociones/interfaces/promotionAdmin";

export const PROMOTION_TYPES = ["percentage", "fixed_amount", "fixed_price", "bundle_price", "nxm", "event_badge"] as const;
export const PROMOTION_STATUSES = ["draft", "active", "paused", "archived"] as const;
const APPLIES_TO = ["products", "subcatalogs", "all"] as const;
const UNIT_TYPES = new Set(["percentage", "fixed_amount", "fixed_price"]);

type Result = { ok: true; data: NormalizedPromotion } | { ok: false; message: string };

function invalid(message: string): Result {
  return { ok: false, message };
}

function cleanIds(ids: string[] | null | undefined): string[] | null {
  if (ids === undefined) return null;
  return [...new Set((ids ?? []).filter((id) => typeof id === "string" && id.length > 0))];
}

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Validates a promotion write. `existing` is the stored row on PATCH so rules
 * that depend on the type still apply when only some fields change.
 */
export function normalizePromotionInput(
  input: PromotionWriteInput,
  mode: "create" | "update",
  existing: Partial<PromotionWriteInput> = {},
): Result {
  const fields: Record<string, unknown> = {};
  const type = input.type ?? existing.type;

  if (mode === "create" || input.name !== undefined) {
    const name = input.name?.trim() ?? "";
    if (name.length < 2 || name.length > 100) return invalid("El nombre debe tener entre 2 y 100 caracteres.");
    fields.name = name;
  }

  if (!type || !(PROMOTION_TYPES as readonly string[]).includes(type)) {
    return invalid("Elige un tipo de promoción válido.");
  }
  if (input.type !== undefined) fields.type = type;

  const value = input.value ?? existing.value ?? 0;
  if (input.value !== undefined || mode === "create") {
    if (!Number.isFinite(Number(value)) || Number(value) < 0) return invalid("El valor no puede ser negativo.");
    if (type === "percentage" && (Number(value) < 1 || Number(value) > MAX_PERCENTAGE_DISCOUNT)) {
      return invalid(`El descuento debe estar entre 1% y ${MAX_PERCENTAGE_DISCOUNT}%.`);
    }
    if ((type === "fixed_amount" || type === "fixed_price" || type === "bundle_price") && Number(value) <= 0) {
      return invalid("Indica un monto mayor a cero.");
    }
    fields.value = type === "nxm" || type === "event_badge" ? Number(value) || 0 : Number(value);
  }

  if (type === "nxm") {
    const buy = Number(input.buy_quantity ?? existing.buy_quantity);
    const pay = Number(input.pay_quantity ?? existing.pay_quantity);
    if (!Number.isInteger(buy) || buy < 2 || buy > 10 || !Number.isInteger(pay) || pay < 1 || pay >= buy) {
      return invalid("Indica cuántos lleva y cuántos paga (por ejemplo 2x1 o 3x2).");
    }
    fields.buy_quantity = buy;
    fields.pay_quantity = pay;
  }

  const productIds = cleanIds(input.product_ids);
  const subcatalogIds = cleanIds(input.subcatalog_ids);
  if (productIds !== null) fields.product_ids = productIds.length ? productIds : null;
  if (subcatalogIds !== null) fields.subcatalog_ids = subcatalogIds.length ? subcatalogIds : null;

  if (input.applies_to !== undefined && input.applies_to !== null) {
    if (!(APPLIES_TO as readonly string[]).includes(input.applies_to)) return invalid("Alcance de la promoción no válido.");
    fields.applies_to = input.applies_to;
  } else if (mode === "create" && UNIT_TYPES.has(type)) {
    // The dashboard promises "leave empty to apply to everything"; make that true.
    fields.applies_to = productIds?.length ? "products" : subcatalogIds?.length ? "subcatalogs" : "all";
  }

  if (type === "nxm" && mode === "create" && !productIds?.length) {
    return invalid("Elige el producto de la promoción.");
  }

  let items: NormalizedPromotion["items"] = null;
  if (input.items !== undefined && input.items !== null) {
    const merged = new Map<string, number>();
    for (const item of input.items) {
      const productId = typeof item.product_id === "string" ? item.product_id : "";
      const quantity = Math.floor(Number(item.quantity));
      if (!productId || !Number.isFinite(quantity) || quantity < 1 || quantity > 999) {
        return invalid("Los artículos del paquete no son válidos.");
      }
      merged.set(productId, (merged.get(productId) ?? 0) + quantity);
    }
    items = [...merged].map(([product_id, quantity]) => ({ product_id, quantity }));
    fields.bundle_product_ids = items.length ? items.map((item) => item.product_id) : null;
  } else if (input.bundle_product_ids !== undefined) {
    const bundle = cleanIds(input.bundle_product_ids);
    fields.bundle_product_ids = bundle?.length ? bundle : null;
  }
  if (type === "bundle_price" && mode === "create" && !(items?.length || (fields.bundle_product_ids as string[] | null)?.length)) {
    return invalid("Un paquete necesita al menos un producto o servicio.");
  }

  const validFrom = input.valid_from !== undefined ? trimOrNull(input.valid_from) : existing.valid_from ?? null;
  const validUntil = input.valid_until !== undefined ? trimOrNull(input.valid_until) : existing.valid_until ?? null;
  if (validFrom && Number.isNaN(Date.parse(validFrom))) return invalid("La fecha de inicio no es válida.");
  if (validUntil && Number.isNaN(Date.parse(validUntil))) return invalid("La fecha de fin no es válida.");
  if (validFrom && validUntil && new Date(validUntil) <= new Date(validFrom)) {
    return invalid("La fecha de fin debe ser posterior a la de inicio.");
  }
  if (input.valid_from !== undefined) fields.valid_from = validFrom;
  if (input.valid_until !== undefined) fields.valid_until = validUntil;

  if (input.status !== undefined) {
    if (!(PROMOTION_STATUSES as readonly string[]).includes(input.status)) return invalid("Estado no válido.");
    fields.status = input.status;
  }

  if (input.min_amount !== undefined) fields.min_amount = input.min_amount === null ? null : Number(input.min_amount);
  if (input.quantity !== undefined) fields.quantity = input.quantity === null ? null : Math.floor(Number(input.quantity));
  if (input.image_url !== undefined) fields.image_url = trimOrNull(input.image_url);
  if (input.description !== undefined) fields.description = trimOrNull(input.description);
  if (input.badge_label !== undefined) fields.badge_label = trimOrNull(input.badge_label);
  if (input.template_key !== undefined) fields.template_key = trimOrNull(input.template_key);

  return { ok: true, data: { fields, items } };
}
