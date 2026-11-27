import { ProductCard } from "@/features/sitio/components/catalog/ProductCard";
import { ServiceRow } from "@/features/sitio/components/catalog/ServiceRow";

import type { ServiceMenuProps } from "@/features/sitio/interfaces/storeHome";

export function ServiceList({ items, tenantId, slug, tone = "plain" }: ServiceMenuProps & { tone?: "plain" | "contrast" }) {
  const divider = tone === "contrast" ? "divide-(--store-canvas)/12" : "divide-(--store-hairline)";
  // A Studio ad would be unreadable in a 56px row thumbnail, so those services lead as cards.
  const featured = items.filter((item) => item.studio_ad_url);
  const rows = items.filter((item) => !item.studio_ad_url);
  const half = Math.ceil(rows.length / 2);
  const columns = rows.length > 4 ? [rows.slice(0, half), rows.slice(half)] : [rows];

  return (
    <div className="space-y-6">
      {featured.length > 0 && (
        <section aria-label="Servicios destacados" className="space-y-3">
          <h3 className={`text-sm font-bold uppercase tracking-wider ${tone === "contrast" ? "text-(--store-canvas)/70" : "text-(--store-ink-2)"}`}>
            Destacados
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((item) => (
              <ProductCard key={item.id} product={item} promotion={item.promotion} tenantId={tenantId} slug={slug} />
            ))}
          </div>
        </section>
      )}
      {rows.length > 0 && (
        <div className={`grid gap-x-12 ${columns.length > 1 ? "lg:grid-cols-2" : ""}`}>
          {columns.map((column, index) => (
            <ul key={index} className={`divide-y ${divider} ${index > 0 ? "border-t lg:border-t-0" : ""} ${tone === "contrast" ? "border-(--store-canvas)/12" : "border-(--store-hairline)"}`}>
              {column.map((item) => (
                <ServiceRow
                  key={item.id}
                  product={item}
                  promotion={item.promotion}
                  tenantId={tenantId}
                  slug={slug}
                  tone={tone}
                />
              ))}
            </ul>
          ))}
        </div>
      )}
    </div>
  );
}
