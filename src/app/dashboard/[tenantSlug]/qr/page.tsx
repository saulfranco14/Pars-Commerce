"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Plus } from "lucide-react";

import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { swrFetcher } from "@/lib/swrFetcher";
import { useActiveTenant } from "@/stores/useTenantStore";
import { QRCodeCard } from "@/features/qr/components/QRCodeCard";
import { buildQrCodesKey } from "@/features/qr/helpers/buildQrKey";
import type { QrCode } from "@/features/qr/interfaces/qrCode";

export default function QrCodesPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useActiveTenant();
  const key = buildQrCodesKey(activeTenant?.id ?? null);
  const { data, isLoading, error } = useSWR<QrCode[]>(key, swrFetcher, {
    fallbackData: [],
  });

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            Códigos QR
          </h1>
          <p className="text-sm text-muted-foreground">
            Genera QR para mesas y cobros libres.
          </p>
        </div>
        <Link
          href={`/dashboard/${tenantSlug}/qr/nuevo`}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          <Plus className="h-4 w-4" />
          Nuevo QR
        </Link>
      </div>

      {isLoading ? (
        <LoadingBlock message="Cargando códigos QR" />
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudieron cargar los QR.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(data ?? []).map((code) => (
            <QRCodeCard key={code.id} tenantSlug={tenantSlug} code={code} />
          ))}
        </div>
      )}
    </div>
  );
}
