import {
  Baby,
  Banknote,
  CreditCard,
  Footprints,
  Gem,
  Gift,
  Package,
  Shirt,
  Sparkles,
  Star,
  Store,
  Tag,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { formatCurrency } from "@/features/qr/helpers/format";
import { productHref } from "@/features/sitio/helpers/storeLinks";

import type { PublicCheckoutOptions } from "@/features/checkout/components/cart/CheckoutFulfillmentStep";
import type { HeroShowcaseItem, StoreHighlight } from "@/features/sitio/interfaces/storeHome";
import type { CatalogItem, StoreCatalogCounts, StoreCategory } from "@/features/sitio/interfaces/storefront";
import type { SitePageContent } from "@/types/tenantSitePages";

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** Merchant copy wins; the fallback describes what this catalog actually sells. */
export function resolveHeroCopy(
  content: SitePageContent,
  counts: StoreCatalogCounts,
  tenantDescription: string | null,
): { title: string; subtitle: string | null } {
  const generatedTitle =
    counts.products > 0 && counts.services > 0
      ? "Compra y agenda en un solo lugar."
      : counts.services > 0
        ? "Elige tu servicio y agenda en minutos."
        : "Elige, paga y recibe tu pedido.";
  const parts = [
    counts.products > 0 ? plural(counts.products, "producto", "productos") : null,
    counts.services > 0 ? plural(counts.services, "servicio", "servicios") : null,
  ].filter(Boolean);
  const generatedSubtitle = parts.length > 0 ? `${parts.join(" y ")} con precio a la vista. Pide en línea y sigue tu pedido.` : null;
  return {
    title: content.title?.trim() || generatedTitle,
    subtitle: content.subtitle?.trim() || tenantDescription?.trim() || generatedSubtitle,
  };
}

/** Products first: they are what a photo sells best. */
export function pickShowcase(slug: string, products: CatalogItem[], services: CatalogItem[]): HeroShowcaseItem[] {
  return [...products, ...services]
    .filter((item) => item.image_urls.length > 0)
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      name: item.name,
      price: item.promotion?.finalPrice ?? Number(item.price),
      image: item.image_urls[0],
      href: productHref(slug, item),
    }));
}

/** Only what the business really configured; an unconfigured promise is never shown. */
export function buildStoreHighlights(options: PublicCheckoutOptions): StoreHighlight[] {
  const highlights: StoreHighlight[] = [];
  if (options.deliveryEnabled) {
    highlights.push({
      id: "delivery",
      icon: Truck,
      title: "Entrega a domicilio",
      detail: [options.deliveryAreaLabel, options.deliveryFee > 0 ? `Envío ${formatCurrency(options.deliveryFee)}` : "Envío sin costo"]
        .filter(Boolean)
        .join(" · "),
    });
  }
  if (options.pickupEnabled && options.pickupPoints.length > 0) {
    highlights.push({
      id: "pickup",
      icon: Store,
      title: "Recoge en tienda",
      detail: options.pickupPoints.length === 1
        ? options.pickupPoints[0].name
        : `${options.pickupPoints.length} ubicaciones disponibles`,
    });
  }
  const payments = [
    options.onlinePaymentEnabled ? "tarjeta" : null,
    options.transferEnabled ? "transferencia" : null,
    options.cashEnabled ? "efectivo" : null,
  ].filter(Boolean) as string[];
  if (payments.length > 0) {
    highlights.push({
      id: "payment",
      icon: options.onlinePaymentEnabled ? CreditCard : Banknote,
      title: options.onlinePaymentEnabled ? "Paga en línea" : "Formas de pago",
      detail: `Aceptamos ${payments.join(", ").replace(/, ([^,]*)$/, " y $1")}`,
    });
  }
  return highlights;
}

const CATEGORY_ICON_RULES: Array<{ pattern: RegExp; icon: LucideIcon }> = [
  { pattern: /playera|camis|blusa|vestid|ropa|sudadera|jersey|uniforme/i, icon: Shirt },
  { pattern: /niñ|bebé|bebe|infantil|kids/i, icon: Baby },
  { pattern: /accesori|joya|bols|reloj/i, icon: Gem },
  { pattern: /zapat|tenis|calzado/i, icon: Footprints },
  { pattern: /regalo|detalle|kit|paquete|combo/i, icon: Gift },
];
const CATEGORY_FALLBACK_ICONS: LucideIcon[] = [Tag, Package, Sparkles, Star];

/** A name-based icon when the category says what it is; otherwise a neutral one. */
export function categoryIcon(name: string, index: number): LucideIcon {
  return (
    CATEGORY_ICON_RULES.find((rule) => rule.pattern.test(name))?.icon ??
    CATEGORY_FALLBACK_ICONS[index % CATEGORY_FALLBACK_ICONS.length]
  );
}

/** The three biggest categories lead; the rest stay one tap away. */
export function splitFeaturedCategories(categories: StoreCategory[], featuredCount = 3) {
  const ranked = [...categories].sort((left, right) => right.count - left.count);
  return {
    featured: ranked.slice(0, featuredCount),
    others: ranked.slice(featuredCount).sort((left, right) => left.name.localeCompare(right.name, "es-MX")),
  };
}
