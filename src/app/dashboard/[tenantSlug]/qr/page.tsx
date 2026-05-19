"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createPortal } from "react-dom";
import useSWR from "swr";
import { Plus, QrCode as QrIcon } from "lucide-react";

import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { swrFetcher } from "@/lib/swrFetcher";
import { useActiveTenant } from "@/stores/useTenantStore";
import { QRCodeCard } from "@/features/qr/components/QRCodeCard";
import { QrPreview } from "@/features/qr/components/QrPreview";
import { buildQrCodesKey } from "@/features/qr/helpers/buildQrKey";
import { useQrActions } from "@/features/qr/hooks/useQrActions";

import type { QrCode } from "@/features/qr/interfaces/qrCode";

type Filter = "all" | "table" | "payment";

const filters: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "table", label: "Mesas" },
  { value: "payment", label: "Cobros" },
];

function PreviewModal({
  code,
  onClose,
}: {
  code: QrCode;
  onClose: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 hidden items-center justify-center md:flex">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <h2 className="mb-5 text-base font-semibold text-foreground">{code.label}</h2>
        <QrPreview
          token={code.token}
          label={code.label}
          kind={code.kind}
          tableCapacity={code.table_capacity}
          presetAmount={code.preset_amount}
        />
      </div>
    </div>,
    document.body,
  );
}

export default function QrCodesPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useActiveTenant();

  const key = buildQrCodesKey(activeTenant?.id ?? null);
  const { data, isLoading, error } = useSWR<QrCode[]>(key, swrFetcher, {
    fallbackData: [],
  });

  const { toggleActive, archive, busyId, error: actionError } = useQrActions(
    activeTenant?.id ?? null,
  );

  const [filter, setFilter] = useState<Filter>("all");
  const [previewCode, setPreviewCode] = useState<QrCode | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const codes = data ?? [];
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            Códigos QR
          </h1>
          <p className="text-sm text-muted-foreground">
            Genera QR para mesas y cobros libres. Imprime, comparte o escanea desde
            aquí.
          </p>
        </div>
        <Link
          href={`/dashboard/${tenantSlug}/qr/nuevo`}
          className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          Nuevo QR
        </Link>
      </div>

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* Filter chips */}
      {codes.length > 0 && (
        <div role="tablist" aria-label="Filtrar QR" className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const count =
              f.value === "all"
                ? codes.length
                : codes.filter((c) => c.kind === f.value).length;
            const isActive = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilter(f.value)}
                className={`inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors
                  ${isActive
                    ? "bg-accent text-accent-foreground"
                    : "border border-border bg-surface text-foreground hover:bg-border-soft/40"}
                `}
              >
                {f.label}
                <span
                  className={`rounded-full px-1.5 text-xs font-semibold ${isActive ? "bg-accent-foreground/20" : "bg-border-soft text-muted-foreground"}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Body */}
      {isLoading ? (
        <LoadingBlock message="Cargando códigos QR" />
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudieron cargar los QR.
        </div>
      ) : codes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <QrIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Aún no tienes códigos QR
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Crea tu primer QR para que tus clientes puedan ordenar desde la mesa o
              pagarte sin contacto.
            </p>
          </div>
          <Link
            href={`/dashboard/${tenantSlug}/qr/nuevo`}
            className="mt-2 inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="h-4 w-4" />
            Crear primer QR
          </Link>
        </div>
      ) : visibleCodes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
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

      {/* Preview overlay */}
      {mounted && previewCode && (
        <>
          <PreviewModal code={previewCode} onClose={() => setPreviewCode(null)} />
          <BottomSheet
            isOpen={!!previewCode}
            onClose={() => setPreviewCode(null)}
            title={previewCode.label}
          >
            <QrPreview
              token={previewCode.token}
              label={previewCode.label}
              kind={previewCode.kind}
              tableCapacity={previewCode.table_capacity}
              presetAmount={previewCode.preset_amount}
            />
          </BottomSheet>
        </>
      )}
    </div>
  );
}
