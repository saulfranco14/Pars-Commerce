import { Store } from "lucide-react";

import { StoreHero } from "@/features/sitio/components/home/StoreHero";
import { StorePurchaseSteps } from "@/features/sitio/components/home/StorePurchaseSteps";
import { StoreSectionHeader } from "@/features/sitio/components/StoreSectionHeader";
import { ParaObjections } from "@/features/growth/components/para/ParaObjections";
import { ParaOwnerIntro } from "@/features/growth/components/para/ParaOwnerIntro";
import { ParaProductCard } from "@/features/growth/components/para/ParaProductCard";

import { PARA_ACTIVATION_STEPS } from "@/features/growth/constants/para";
import { storeSans } from "@/features/sitio/constants/storeFonts";
import { DEFAULT_TENANT_ACCENT } from "@/features/sitio-web/constants/templateStyles";
import { resolveHeroCopy } from "@/features/sitio/helpers/storeHome";
import { buildStoreThemeStyle, resolveStoreTheme } from "@/features/sitio/helpers/storeTheme";

import type { ParaInteractiveProps } from "@/features/growth/interfaces/para";

/** The owner's intro, then their store framed as their customers would see it, built from the storefront's own blocks. */
export function ParaStorefront({ token, data }: ParaInteractiveProps) {
  const theme = resolveStoreTheme(null);
  const hero = resolveHeroCopy({}, data.counts, null);

  return (
    <div
      className={`site-template ${theme.dark ? "site-template-dark" : ""} ${storeSans.variable} min-w-0 overflow-x-clip bg-(--store-canvas) font-(family-name:--font-store-sans) text-(--store-ink) antialiased`}
      style={buildStoreThemeStyle(theme, DEFAULT_TENANT_ACCENT)}
    >
      <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pb-16 pt-5 sm:space-y-14 sm:px-6 sm:pt-8">
        <ParaOwnerIntro data={data} />

        <div className="space-y-3">
          <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-(--store-ink-2) before:h-px before:flex-1 before:bg-(--store-hairline) after:h-px after:flex-1 after:bg-(--store-hairline)">
            Lo que ven sus clientes
          </p>
          <div data-para-section="tienda" className="space-y-10 rounded-[32px] border-2 border-dashed border-(--store-hairline) p-2 sm:space-y-14 sm:rounded-[44px] sm:p-4">
            <div className="flex h-14 items-center gap-3 rounded-3xl bg-(--store-surface) px-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Store className="h-4.5 w-4.5" aria-hidden />
              </span>
              <span className="truncate text-base font-bold tracking-tight text-(--store-ink)">{data.businessName}</span>
            </div>

            <StoreHero
              tenantName={data.businessName}
              logoUrl={null}
              title={data.headline}
              subtitle={hero.subtitle}
              imageUrl={null}
              showcase={data.showcase}
              primary={{ href: "#productos", label: "Ver productos" }}
            />

            {data.items.length > 0 ? (
              <section id="productos" data-para-section="productos" aria-labelledby="para-products-title" className="scroll-mt-20 px-2 pb-2 sm:px-0 sm:pb-0">
                <StoreSectionHeader id="para-products-title" title="Lo que ya trae" subtitle="Al activarla cambia los precios o agrega los suyos." />
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                  {data.items.map((item, index) => (
                    <li key={item.id}>
                      <ParaProductCard item={item} priority={index < 4} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>

        <StorePurchaseSteps steps={PARA_ACTIVATION_STEPS} title="Qué pasa al activarla" subtitle="Su tienda queda lista en un par de minutos." />

        <ParaObjections token={token} data={data} />
      </div>
    </div>
  );
}
