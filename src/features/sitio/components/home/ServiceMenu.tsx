import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ServiceList } from "@/features/sitio/components/catalog/ServiceList";

import { storeDisplayFont, storeFocusRing } from "@/features/sitio/constants/storeClasses";
import { catalogHref } from "@/features/sitio/helpers/storeLinks";

import type { ServiceMenuProps } from "@/features/sitio/interfaces/storeHome";

export function ServiceMenu({ items, tenantId, slug, total }: ServiceMenuProps & { total: number }) {
  return (
    <section
      aria-labelledby="home-services-title"
      className="rounded-[28px] bg-(--store-ink) px-5 py-8 text-(--store-canvas) sm:rounded-[36px] sm:px-10 sm:py-12 lg:px-14"
    >
      <div className="mb-4 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="home-services-title" className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${storeDisplayFont}`}>
            Servicios
          </h2>
          <p className="mt-1.5 text-[15px] text-(--store-canvas)/70">Precios claros. Agrégalos a tu pedido y elige el horario.</p>
        </div>
        {total > items.length ? (
          <Link
            href={catalogHref(slug, { type: "service" })}
            className={`inline-flex min-h-11 items-center gap-2 self-start rounded-full px-5 text-sm font-bold ring-2 ring-(--store-canvas)/25 transition-colors hover:bg-(--store-canvas)/10 sm:self-auto ${storeFocusRing}`}
          >
            Ver los {total} servicios
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </div>
      <ServiceList items={items} tenantId={tenantId} slug={slug} tone="contrast" />
    </section>
  );
}
