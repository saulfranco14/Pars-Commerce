"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft } from "lucide-react";

import { swrFetcher } from "@/lib/swrFetcher";
import { useActiveTenant } from "@/stores/useTenantStore";
import { buildQrCodesKey } from "@/features/qr/helpers/buildQrKey";
import { MesaDetailContent } from "@/features/qr/components/table/MesaDetailContent";
import { Skeleton } from "@/components/ui/Skeleton";

import type { QrCode } from "@/features/qr/interfaces/qrCode";

function MesaDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5" aria-label="Cargando mesa">
      <Skeleton className="h-4 w-28" />
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[0, 1, 2].map((item) => <Skeleton key={item} className="h-16 rounded-xl" />)}
        </div>
      </section>
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="mt-4 h-12 w-full rounded-xl" />
        <Skeleton className="mt-3 h-24 w-full rounded-xl" />
      </section>
    </div>
  );
}

/**
 * Standalone page for a mesa's detail — kept as a fallback for direct links
 * (e.g. bookmarks) alongside the modal opened from the mesas list. Both
 * render the same `MesaDetailContent`; this page only supplies its own
 * back-link chrome and page-level not-found states.
 */
export default function MesaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mesaQrId = params.mesaId as string;
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useActiveTenant();

  // Resolve the QR (and its current_order_id) from the SAME cache key the
  // Mesas list uses (kind=table) — reusing it means this page shows the
  // list's already-loaded data instantly via SWR's cache/dedupe instead of
  // starting a brand new fetch from scratch on every visit.
  const qrKey = buildQrCodesKey(activeTenant?.id ?? null, "table");
  const { data: qrList, isLoading, isValidating } = useSWR<QrCode[]>(
    qrKey,
    swrFetcher,
  );
  const qr = (qrList ?? []).find((q) => q.id === mesaQrId);

  if (!activeTenant) {
    return <MesaDetailSkeleton />;
  }

  // A direct return from "Tomar pedido" starts with an empty SWR cache. Do
  // not turn that short loading window into a false "not found" state.
  if (!qrList || (!qr && (isLoading || isValidating))) {
    return <MesaDetailSkeleton />;
  }

  if (!qr) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted-foreground">
        Mesa no encontrada.
      </div>
    );
  }

  const backHref = `/dashboard/${tenantSlug}/mesas`;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <Link
        href={backHref}
        className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a mesas
      </Link>

      <MesaDetailContent
        qr={qr}
        qrList={qrList ?? []}
        tenantName={activeTenant.name}
        orderHref={(orderId) =>
          `/dashboard/${tenantSlug}/pedidos/nuevo?table_order_id=${orderId}`
        }
        onClosed={() => router.push(backHref)}
      />
    </div>
  );
}
