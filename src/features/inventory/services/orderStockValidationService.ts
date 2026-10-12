import type { SupabaseClient } from "@supabase/supabase-js";

export interface StockRequestItem {
  product_id: string;
  product_variant_id?: string | null;
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
  const requestedProducts = new Map<string, number>();
  const requestedVariants = new Map<string, { productId: string; quantity: number }>();
  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!item.product_id || !Number.isFinite(quantity) || quantity <= 0) {
      continue;
    }
    if (item.product_variant_id) {
      const current = requestedVariants.get(item.product_variant_id);
      requestedVariants.set(item.product_variant_id, {
        productId: item.product_id,
        quantity: (current?.quantity ?? 0) + quantity,
      });
    } else {
      requestedProducts.set(item.product_id, (requestedProducts.get(item.product_id) ?? 0) + quantity);
    }
  }

  const productIds = [...new Set([
    ...requestedProducts.keys(),
    ...[...requestedVariants.values()].map((item) => item.productId),
  ])];
  if (productIds.length === 0) return { ok: true };

  type InventoryDb = { from: (table: string) => any };
  const db = admin as unknown as InventoryDb;
  const variantIds = [...requestedVariants.keys()];
  const [{ data: products }, variantsResult] = await Promise.all([
    db.from("products").select("id, name, type, track_stock, has_variants").eq("tenant_id", tenantId).in("id", productIds).is("deleted_at", null),
    variantIds.length
      ? db.from("product_variants").select("id, product_id, selection_key, stock, is_active, archived_at").in("id", variantIds)
      : Promise.resolve({ data: [] }),
  ]);

  const productById = new Map((products ?? []).map((product: { id: string }) => [product.id, product]));
  const variantById = new Map((variantsResult.data ?? []).map((variant: { id: string }) => [variant.id, variant]));

  for (const [variantId, request] of requestedVariants) {
    const product = productById.get(request.productId) as { name?: string } | undefined;
    const variant = variantById.get(variantId) as { product_id: string; selection_key: string; stock: number; is_active: boolean; archived_at: string | null } | undefined;
    if (!product || !variant || variant.product_id !== request.productId || !variant.is_active || variant.archived_at) {
      return { ok: false, message: "Una talla o color seleccionado ya no está disponible." };
    }
    if (Number(variant.stock) < request.quantity) {
      return {
        ok: false,
        message: `No hay existencias suficientes de ${product.name ?? "este producto"} (${variant.selection_key.replaceAll(":", " ")}). Disponible: ${Math.max(0, Number(variant.stock))}.`,
      };
    }
  }

  for (const product of products ?? []) {
    if (product.has_variants && requestedProducts.has(product.id)) {
      return { ok: false, message: `Elige talla o color para ${product.name}.` };
    }
  }

  const trackedProducts = (products ?? []).filter(
    (product: { id: string; type: string; track_stock: boolean; has_variants?: boolean }) =>
      product.type === "product" && product.track_stock && !product.has_variants && requestedProducts.has(product.id),
  );
  if (trackedProducts.length === 0) return { ok: true };

  const { data: inventory } = await db
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
    const needed = requestedProducts.get(product.id) ?? 0;
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
