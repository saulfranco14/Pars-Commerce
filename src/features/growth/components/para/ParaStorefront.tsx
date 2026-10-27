import { CreditCard, Smartphone, Store, Truck } from "lucide-react";

import { StoreHero } from "@/features/sitio/components/home/StoreHero";
import { StoreHighlights } from "@/features/sitio/components/home/StoreHighlights";
import { StorePurchaseSteps } from "@/features/sitio/components/home/StorePurchaseSteps";
import { StoreSectionHeader } from "@/features/sitio/components/StoreSectionHeader";
import { ParaProductCard } from "@/features/growth/components/para/ParaProductCard";

import { DEFAULT_PURCHASE_STEPS } from "@/features/sitio/constants/inicio";
import { storeSans } from "@/features/sitio/constants/storeFonts";
import { DEFAULT_TENANT_ACCENT } from "@/features/sitio-web/constants/templateStyles";
import { resolveHeroCopy } from "@/features/sitio/helpers/storeHome";
import { buildStoreThemeStyle, resolveStoreTheme } from "@/features/sitio/helpers/storeTheme";

import type { ParaStorefrontProps } from "@/features/growth/interfaces/para";
import type { StoreHighlight } from "@/features/sitio/interfaces/storeHome";

// What every Tlaco store can turn on; the real storefront shows the merchant's configured subset.
const PREVIEW_HIGHLIGHTS: StoreHighlight[] = [
  { id: "phone", icon: Smartphone, title: "Pedidos por celular", detail: "Tus clientes eligen sin descargar nada." },
  { id: "delivery", icon: Truck, title: "Entrega a domicilio", detail: "O que pasen a recoger, tú decides." },
  { id: "card", icon: CreditCard, title: "Pago sin terminal", detail: "Te pagan con tarjeta desde su celular." },
];

/** The prospect's store as their customers would see it, built from the storefront's own blocks and theme. */
export function ParaStorefront({ data }: ParaStorefrontProps) {
  const theme = resolveStoreTheme(null);
  const hero = resolveHeroCopy({}, data.counts, null);

  return (
    <div
      className={`site-template ${theme.dark ? "site-template-dark" : ""} ${storeSans.variable} min-w-0 overflow-x-clip bg-(--store-canvas) font-(family-name:--font-store-sans) text-(--store-ink) antialiased`}
      style={buildStoreThemeStyle(theme, DEFAULT_TENANT_ACCENT)}
    >
      <div className="border-b border-(--store-hairline) bg-(--store-surface)">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Store className="h-4.5 w-4.5" aria-hidden />
          </span>
          <span className="truncate text-base font-extrabold tracking-tight text-(--store-ink)">{data.businessName}</span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-14 px-4 pb-16 pt-4 sm:space-y-20 sm:px-6">
        <div className="space-y-4 sm:space-y-5">
          <StoreHero
            tenantName={data.businessName}
            logoUrl={null}
            title={hero.title}
            subtitle={hero.subtitle}
            imageUrl={null}
            showcase={data.showcase}
            primary={{ href: "#productos", label: "Ver catálogo" }}
          />
          <StoreHighlights items={PREVIEW_HIGHLIGHTS} />
        </div>

        {data.items.length > 0 ? (
          <section id="productos" aria-labelledby="para-products-title" className="scroll-mt-20">
            <StoreSectionHeader id="para-products-title" title="Lo que ya trae" subtitle="Precios de referencia: al activarla los cambias o agregas los tuyos." />
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {data.items.map((item, index) => (
                <li key={item.id}>
                  <ParaProductCard item={item} priority={index < 4} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <StorePurchaseSteps steps={DEFAULT_PURCHASE_STEPS} subtitle="Así le compran a tu negocio." />
      </div>
    </div>
  );
}
