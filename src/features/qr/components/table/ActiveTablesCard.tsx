import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { getFulfillmentStatusMeta } from "@/features/qr/constants/fulfillmentStatusMeta";
import { formatCurrency } from "@/features/qr/helpers/format";

import type { ActiveTableSummary } from "@/app/api/qr/tables/active/route";

interface ActiveTablesCardProps {
  tables: ActiveTableSummary[];
  tenantSlug: string;
}

/**
 * Dashboard-home widget: mesas with a customer connected right now. Hidden
 * entirely by the caller when `tables` is empty — an idle dashboard has no
 * business showing an empty "mesas activas" section.
 */
export function ActiveTablesCard({ tables, tenantSlug }: ActiveTablesCardProps) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
          <Store className="h-4 w-4" />
          Mesas activas
        </h2>
        <Link
          href={`/dashboard/${tenantSlug}/mesas`}
          className="text-xs font-medium text-muted hover:text-foreground"
        >
          Ver todas <ArrowRight className="inline h-3 w-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((table) => {
          const meta = getFulfillmentStatusMeta(table.fulfillment_status);
          return (
            <Link
              key={table.qr_code_id}
              href={`/dashboard/${tenantSlug}/mesas/${table.qr_code_id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-raised p-4 transition-colors duration-200 hover:bg-border-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {table.label}
                </p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">
                  {formatCurrency(table.total)}
                </p>
              </div>
              <StatusBadge tone={meta.tone} label={meta.label} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
