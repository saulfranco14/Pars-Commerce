"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Plus, QrCode as QrIcon } from "lucide-react";

import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { FormSheet } from "@/components/ui/FormSheet";
import { Notification } from "@/components/ui/Notification";
import { EmptyState } from "@/components/admin/EmptyState";
import { FilterPills } from "@/components/admin/FilterPills";
import { PageHeader } from "@/components/admin/PageHeader";
import { swrFetcher } from "@/lib/swrFetcher";
import { useActiveTenant } from "@/stores/useTenantStore";
import { QRCodeCard } from "@/features/qr/components/QRCodeCard";
import { QrPreview } from "@/features/qr/components/QrPreview";
import { buildQrCodesKey } from "@/features/qr/helpers/buildQrKey";
import { useQrActions } from "@/features/qr/hooks/useQrActions";

import type { QrCode } from "@/features/qr/interfaces/qrCode";

type Filter = "all" | "table" | "payment";

const primaryCta =
  "inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground shadow-md shadow-accent/20 hover:bg-accent/90 active:scale-[0.99] transition-all";

export default function QrCodesPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useActiveTenant();

  const key = buildQrCodesKey(activeTenant?.id ?? null);
  const { data, isLoading, error } = useSWR<QrCode[]>(key, swrFetcher, {
    fallbackData: [],
  });

  const {
    toggleActive,
    archive,
    busyId,
    error: actionError,
  } = useQrActions(activeTenant?.id ?? null);

  const [filter, setFilter] = useState<Filter>("all");
  const [previewCode, setPreviewCode] = useState<QrCode | null>(null);

  // Configuration screen: only the reusable QR kinds (tables + fixed charges).
  // Single-use 'order' tickets are ephemeral and live under Órdenes, not here.
  const codes = useMemo(
    () => (data ?? []).filter((c) => c.kind === "table" || c.kind === "payment"),
    [data],
  );
  const visibleCodes = useMemo(() => {
    if (filter === "all") return codes;
    return codes.filter((c) => c.kind === filter);
  }, [codes, filter]);

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  const hasCodes = codes.length > 0;
  const counts = {
    all: codes.length,
    table: codes.filter((c) => c.kind === "table").length,
    payment: codes.filter((c) => c.kind === "payment").length,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Códigos QR"
        description="Genera QR para mesas y cobros libres. Imprime, comparte o escanea desde aquí."
        action={
          <Link
            href={`/dashboard/${tenantSlug}/qr/nuevo`}
            className={primaryCta}
          >
            <Plus className="h-4 w-4" />
            Nuevo QR
          </Link>
        }
      />

      {actionError && <Notification tone="error" message={actionError} />}

      {hasCodes && (
        <FilterPills<Filter>
          ariaLabel="Filtrar QR"
          value={filter}
          onChange={setFilter}
          filters={[
            { value: "all", label: "Todos", count: counts.all },
            { value: "table", label: "Mesas", count: counts.table },
            { value: "payment", label: "Cobros", count: counts.payment },
          ]}
        />
      )}

      {isLoading ? (
        <LoadingBlock message="Cargando códigos QR" />
      ) : error ? (
        <Notification tone="error" message="No se pudieron cargar los QR." />
      ) : !hasCodes ? (
        <EmptyState
          icon={QrIcon}
          title="Aún no tienes códigos QR"
          description="Crea tu primer QR para que tus clientes puedan ordenar desde la mesa o pagarte sin contacto."
          action={
            <Link
              href={`/dashboard/${tenantSlug}/qr/nuevo`}
              className={primaryCta}
            >
              <Plus className="h-4 w-4" />
              Crear primer QR
            </Link>
          }
        />
      ) : visibleCodes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No hay QR en esta categoría.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleCodes.map((code) => (
            <QRCodeCard
              key={code.id}
              tenantSlug={tenantSlug}
              code={code}
              busy={busyId === code.id}
              onPreview={setPreviewCode}
              onToggleActive={toggleActive}
              onArchive={archive}
            />
          ))}
        </div>
      )}

      <FormSheet
        isOpen={!!previewCode}
        onClose={() => setPreviewCode(null)}
        title={previewCode?.label ?? ""}
      >
        {previewCode && (
          <QrPreview
            token={previewCode.token}
            label={previewCode.label}
            kind={previewCode.kind}
            tableCapacity={previewCode.table_capacity}
            presetAmount={previewCode.preset_amount}
          />
        )}
      </FormSheet>
    </div>
  );
}
