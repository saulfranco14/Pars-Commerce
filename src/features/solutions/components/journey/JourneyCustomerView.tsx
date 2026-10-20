import Image from "next/image";
import { ArrowRight, Search, ShoppingBag } from "lucide-react";

import { ProductCard } from "@/features/solutions/components/journey/ProductCard";

import { catalogItemKey, formatPeso } from "@/features/solutions/helpers/solutionFormat";

import type { CatalogItemDefinition } from "@/features/catalog/catalogDefinitions";
import type { CartLine } from "@/features/solutions/interfaces/solutionExperience";

export function JourneyCustomerView({
  name,
  themeColor,
  heroImage,
  featuredItems,
  quantityOf,
  changeQuantity,
  cartLines,
  cartCount,
  total,
  submitOrder,
}: {
  name: string;
  themeColor: string;
  heroImage: string;
  featuredItems: CatalogItemDefinition[];
  quantityOf: (item: CatalogItemDefinition) => number;
  changeQuantity: (item: CatalogItemDefinition, delta: number) => void;
  cartLines: CartLine[];
  cartCount: number;
  total: number;
  submitOrder: () => void;
}) {
  return (
    <div className="grid min-h-98 md:grid-cols-[1fr_220px]">
      <div className="p-3 sm:p-4">
        <div className="relative min-h-28 overflow-hidden rounded-2xl p-4 text-white" style={{ background: themeColor }}>
          <Image src={heroImage} alt="" fill sizes="560px" className="object-cover opacity-35 mix-blend-multiply" />
          <div className="absolute inset-0 bg-linear-to-r from-black/45 to-transparent" />
          <div className="relative">
            <p className="text-[11px] font-semibold text-white/80">Tienda abierta · compra segura</p>
            <h2 className="mt-1 text-xl font-bold">{name}</h2>
            <p className="mt-1 text-xs text-white/85">Compra ahora o agenda para cuándo lo necesitas.</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2" aria-hidden>
          <div className="flex min-h-10 flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-xs text-muted-foreground">
            <Search className="h-4 w-4" />
            Buscar en la tienda
          </div>
          <span className="rounded-xl bg-accent/10 px-3 py-2.5 text-xs font-bold text-accent">Promociones</span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {featuredItems.map((item) => (
            <ProductCard
              key={catalogItemKey(item)}
              item={item}
              fallback={heroImage}
              quantity={quantityOf(item)}
              onChange={(delta) => changeQuantity(item, delta)}
            />
          ))}
        </div>
      </div>

      <aside className="border-t border-border bg-background p-4 md:border-l md:border-t-0">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">Pedido del cliente</h3>
          <ShoppingBag className="h-5 w-5 text-muted-foreground" aria-hidden />
        </div>
        <div className="mt-4 space-y-2">
          {cartLines.map(({ item, quantity }) => (
            <div key={catalogItemKey(item)} className="flex justify-between gap-2 text-xs">
              <span className="min-w-0 truncate text-muted-foreground">{quantity} × {item.name}</span>
              <span className="font-bold text-foreground">{formatPeso(item.price * quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-lg font-bold text-foreground">{formatPeso(total)}</span>
        </div>
        <div className="mt-3 rounded-xl bg-accent/10 px-3 py-2 text-xs font-semibold text-accent">Recoger hoy · 18:30</div>
        <button
          type="button"
          onClick={submitOrder}
          disabled={!cartCount}
          className="mt-3 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-bold text-background disabled:cursor-not-allowed disabled:opacity-40"
        >
          Enviar pedido <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </aside>
    </div>
  );
}
