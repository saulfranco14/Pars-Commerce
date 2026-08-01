import type { SupabaseClient } from "@supabase/supabase-js";

export interface StockRequestItem {
  product_id: string;
  quantity: number;
}

export type StockValidationResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Friendly pre-flight validation for order entry points. The database trigger
 * remains the authoritative atomic guard at payment time; this gives the
 * customer or staff a useful answer before creating an impossible order.
 */
export async function validateOrderStock(
  admin: SupabaseClient,
  tenantId: string,
  items: StockRequestItem[],
): Promise<StockValidationResult> {
  const requested = new Map<string, number>();
  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!item.product_id || !Number.isFinite(quantity) || quantity <= 0) {
      continue;
    }
    requested.set(
      item.product_id,
      (requested.get(item.product_id) ?? 0) + quantity,
    );
  }

  const productIds = [...requested.keys()];
  if (productIds.length === 0) return { ok: true };

  const { data: products } = await admin
    .from("products")
    .select("id, name, type, track_stock")
    .eq("tenant_id", tenantId)
    .in("id", productIds)
    .is("deleted_at", null);

  const trackedProducts = (products ?? []).filter(
    (product) => product.type === "product" && product.track_stock,
  );
  if (trackedProducts.length === 0) return { ok: true };

  const { data: inventory } = await admin
    .from("product_inventory")
    .select("product_id, quantity")
    .in(
      "product_id",
      trackedProducts.map((product) => product.id),
    );
  const quantityByProduct = new Map(
    (inventory ?? []).map((row) => [row.product_id, Number(row.quantity)]),
  );

  for (const product of trackedProducts) {
    const needed = requested.get(product.id) ?? 0;
    const available = Math.max(0, quantityByProduct.get(product.id) ?? 0);
    if (available < needed) {
      return {
        ok: false,
        message: `No hay existencias suficientes de ${product.name}. Disponible: ${available}.`,
      };
    }
  }

  return { ok: true };
}
