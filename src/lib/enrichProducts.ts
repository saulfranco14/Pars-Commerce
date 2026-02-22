import {
  buildProductPromoMap,
  type PromotionForPrice,
  type ProductPromotionResult,
} from "./promotionPrice";

export interface ProductBase {
  id: string;
  name: string;
  slug: string | null;
  description?: string | null;
  price: number;
  image_url: string | null;
  subcatalog_id?: string | null;
}

export interface EnrichedProduct extends ProductBase {
  image_urls: string[];
  promotion?: ProductPromotionResult;
}

function groupImagesByProduct(
  images: { product_id: string; url: string; position?: number }[]
): Map<string, string[]> {
  const byProduct = new Map<string, { url: string; position: number }[]>();
  for (const img of images) {
    const list = byProduct.get(img.product_id) ?? [];
    list.push({ url: img.url, position: img.position ?? 0 });
    byProduct.set(img.product_id, list);
  }
  const result = new Map<string, string[]>();
  byProduct.forEach((list, productId) => {
    list.sort((a, b) => a.position - b.position);
    result.set(productId, list.map((x) => x.url));
  });
  return result;
}

export function enrichProducts(
  products: ProductBase[],
  images: { product_id: string; url: string; position?: number }[],
  promotions: PromotionForPrice[]
): EnrichedProduct[] {
  const imagesByProduct = groupImagesByProduct(images);
  const productIds = products.map((p) => p.id);
  const productPrices = new Map(
    products.map((p) => [p.id, Number(p.price)])
  );
  const promoMap = buildProductPromoMap(promotions, productIds, productPrices);

  return products.map((p) => {
    const urls =
      imagesByProduct.get(p.id) ??
      (p.image_url ? [p.image_url] : []);
    const promotion = promoMap.get(p.id);
    return {
      ...p,
      image_urls: urls,
      promotion,
    };
  });
}
