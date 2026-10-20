import { ServiceRow } from "@/features/sitio/components/catalog/ServiceRow";

import type { ServiceMenuProps } from "@/features/sitio/interfaces/storeHome";

export function ServiceList({ items, tenantId, slug, tone = "plain" }: ServiceMenuProps & { tone?: "plain" | "contrast" }) {
  const divider = tone === "contrast" ? "divide-(--store-canvas)/12" : "divide-(--store-hairline)";
  const half = Math.ceil(items.length / 2);
  const columns = items.length > 4 ? [items.slice(0, half), items.slice(half)] : [items];

  return (
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
  );
}
