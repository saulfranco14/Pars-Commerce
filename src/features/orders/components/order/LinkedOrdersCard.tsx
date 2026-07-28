"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowUpRight, Link2 } from "lucide-react";

import { useOrder } from "@/features/orders/hooks/useOrder";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { formatOrderDate } from "@/lib/formatDate";
import { formatCurrency } from "@/features/qr/helpers/format";

/**
 * El vínculo entre un pedido y sus complementos, en las dos direcciones.
 *
 * Importa mostrarlo porque el cobro de una mesa queda repartido en dos
 * pedidos: quien audite el total sin ver el vínculo concluiría que se cobró de
 * menos. Aparece en el padre (lista de complementos y suma) y en el hijo
 * (vuelta al original).
 */
export function LinkedOrdersCard() {
  const { order } = useOrder();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  if (!order) return null;

  const addenda = order.addenda ?? [];
  const isChild = !!order.parent_order_id;
  if (!isChild && addenda.length === 0) return null;

  const href = (id: string) => `/dashboard/${tenantSlug}/ordenes/${id}`;

  return (
    <div className="min-w-0 rounded-xl border border-border bg-surface-raised p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <h3 className="text-sm font-semibold text-foreground">
          {isChild ? "Complementa a otro pedido" : "Pedidos complementarios"}
        </h3>
      </div>

      {isChild ? (
        <>
          <p className="mb-3 text-xs text-muted-foreground">
            Este pedido recoge lo que faltó registrar en uno que ya se había
            cobrado.
          </p>
          <Link
            href={href(order.parent_order_id!)}
            className="inline-flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-border-soft/60"
          >
            <span className="truncate">
              Ver pedido original{" "}
              <span className="font-mono text-xs text-muted-foreground">
                {order.parent_order_id!.slice(0, 8).toUpperCase()}
              </span>
            </span>
            <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
          </Link>
        </>
      ) : (
        <>
          <ul className="divide-y divide-border-soft rounded-lg border border-border">
            {addenda.map((a) => (
              <li key={a.id}>
                <Link
                  href={href(a.id)}
                  className="flex min-h-11 items-center justify-between gap-3 px-3 py-2 transition-colors hover:bg-border-soft/40"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {a.id.slice(0, 8).toUpperCase()}
                    </span>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatOrderDate(a.created_at)}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(Number(a.total))}
                    </span>
                    <ArrowUpRight
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* El total real cobrado por esta mesa es la suma de los dos. Sin
              este renglón habría que abrir cada pedido y sumarlos a mano. */}
          <p className="mt-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Total con complementos
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatCurrency(
                Number(order.total) +
                  addenda.reduce((sum, a) => sum + Number(a.total), 0),
              )}
            </span>
          </p>
        </>
      )}
    </div>
  );
}
