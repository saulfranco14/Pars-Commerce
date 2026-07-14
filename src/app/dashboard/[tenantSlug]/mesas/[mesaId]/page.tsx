"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft } from "lucide-react";

import { swrFetcher } from "@/lib/swrFetcher";
import { useActiveTenant } from "@/stores/useTenantStore";
import { buildQrCodesKey } from "@/features/qr/helpers/buildQrKey";
import { MesaDetailContent } from "@/features/qr/components/MesaDetailContent";

import type { QrCode } from "@/features/qr/interfaces/qrCode";

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
  const { data: qrList } = useSWR<QrCode[]>(qrKey, swrFetcher, {
    fallbackData: [],
  });
  const qr = (qrList ?? []).find((q) => q.id === mesaQrId);

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
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
