"use client";

import Link from "next/link";
import { ExternalLink, Loader2, MapPin, Search, X } from "lucide-react";

import { useOrderSearch } from "@/features/operaciones/hooks/useOrderSearch";
import { OrderJourney } from "@/features/operaciones/components/OrderJourney";

import { orderJourney } from "@/features/operaciones/helpers/orderJourney";

import type { OrderSearchProps } from "@/features/operaciones/interfaces/boardComponents";

const dayOf = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });

/** Find an order by number, customer or table and see at once which station has it. */
export function OrderSearch({ tenantId, detailHref }: OrderSearchProps) {
  const search = useOrderSearch(tenantId);

  return (
    <div className="space-y-2">
      <label className="flex min-h-12 items-center gap-2 rounded-2xl border border-border bg-surface px-3 shadow-sm focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 sm:min-h-11">
        {search.searching ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
        ) : (
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
        <span className="sr-only">Buscar pedido</span>
        <input
          type="search"
          value={search.query}
          onChange={(e) => search.setQuery(e.target.value)}
          placeholder="Buscar por número, cliente o mesa"
          enterKeyHint="search"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none sm:text-sm"
        />
        {search.query && (
          <button
            type="button"
            onClick={search.clear}
            aria-label="Limpiar búsqueda"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </label>

      {search.active && (
        <div className="space-y-2" aria-live="polite">
          {search.error && <p className="px-1 text-sm text-red-600 dark:text-red-400">{search.error}</p>}
          {!search.searching && !search.error && search.results.length === 0 && (
            <p className="px-1 text-sm text-muted-foreground">No encontramos pedidos de los últimos 7 días con “{search.query.trim()}”.</p>
          )}
          {search.results.map(({ order, locations }) => {
            const href = detailHref(order.id);
            return (
              <article key={order.id} className="space-y-2.5 rounded-xl border border-border bg-surface p-3 shadow-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="min-w-0 truncate font-mono text-sm font-bold text-foreground">
                    #{order.number}
                    <span className="font-sans font-semibold"> · {order.originLabel}</span>
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground">{dayOf(order.createdAt)}</span>
                </div>
                {order.customerName && <p className="-mt-1.5 truncate text-xs text-muted-foreground">{order.customerName}</p>}
                {locations.length > 0 && <OrderJourney steps={orderJourney(order)} />}
                <p className="flex items-start gap-1.5 rounded-lg bg-accent/8 px-2.5 py-1.5 text-xs font-semibold text-accent">
                  <MapPin className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
                  {locations.length > 0
                    ? `Está en: ${locations.map((l) => `${l.stationLabel} (${l.columnLabel})`).join(" y ")}`
                    : "Terminado: ya no está en ninguna estación"}
                </p>
                {href && (
                  <Link href={href} className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 text-sm font-semibold text-accent">
                    <ExternalLink className="h-4 w-4" aria-hidden />
                    Abrir pedido
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
