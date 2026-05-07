export type CartItemRow = {
  product_id: string;
  quantity: number;
  price_snapshot: number;
  promotion_id?: string | null;
  product:
    | {
        id: string;
        name: string;
        image_url: string | null;
      }
    | Array<{
        id: string;
        name: string;
        image_url: string | null;
      }>;
};

export interface MappedCartProduct {
  id: string;
  name: string;
  image_url: string | null;
}

export function mapCartItemProduct(item: CartItemRow): MappedCartProduct {
  const product = Array.isArray(item.product) ? item.product[0] : item.product;
  return {
    id: product?.id ?? item.product_id,
    name: product?.name ?? "Producto",
    image_url: product?.image_url ?? null,
  };
}

export function calcCartSubtotal(items: CartItemRow[]): number {
  return items.reduce(
    (sum, item) => sum + Number(item.price_snapshot) * item.quantity,
    0,
  );
}
