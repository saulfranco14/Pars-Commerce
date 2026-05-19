"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Coffee, Plus } from "lucide-react";

import { useActiveTenant } from "@/stores/useTenantStore";
import { FormSheet } from "@/components/ui/FormSheet";
import { QrCreateForm } from "@/features/qr/components/QrCreateForm";
import { CreatedQrSuccess } from "@/features/qr/components/CreatedQrSuccess";
import { QrPreview } from "@/features/qr/components/QrPreview";
import { TableListCard } from "@/features/qr/components/TableListCard";
import { TablesFilterTabs } from "@/features/qr/components/TablesFilterTabs";
import { useTablesList } from "@/features/qr/hooks/useTablesList";

import type { QrCode } from "@/features/qr/interfaces/qrCode";

export default function MesasPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useActiveTenant();

  const list = useTablesList(activeTenant?.id ?? null);

  const [showCreate, setShowCreate] = useState(false);
  const [createdTable, setCreatedTable] = useState<QrCode | null>(null);
  const [previewTable, setPreviewTable] = useState<QrCode | null>(null);

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  function openCreate() {
    setCreatedTable(null);
    setShowCreate(true);
  }
  function closeCreate() {
    setShowCreate(false);
    setCreatedTable(null);
  }

  const createModalTitle = createdTable ? "Mesa creada" : "Nueva mesa";
  const createContent = createdTable ? (
    <CreatedQrSuccess
      qr={createdTable}
      onCreateAnother={() => setCreatedTable(null)}
      onDone={closeCreate}
    />
  ) : (
    <QrCreateForm
      tenantId={activeTenant.id}
      defaultKind="table"
      lockKind
      onSuccess={setCreatedTable}
      onCancel={closeCreate}
    />
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            Mesas
          </h1>
          <p className="text-sm text-muted-foreground">
            Cada mesa tiene un QR único para que tus clientes ordenen y paguen.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          Agregar mesa
        </button>
      </div>

      {/* Metrics */}
      {list.tables.length > 0 && (
        <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-surface p-4">
          <Metric label="Mesas totales" value={list.metrics.total} />
          <Metric
            label="En uso"
            value={list.metrics.occupied}
            tone="amber"
          />
          <Metric label="Libres" value={list.metrics.free} tone="emerald" />
        </div>
      )}

      {/* Filters */}
      {list.tables.length > 0 && (
        <TablesFilterTabs
          filter={list.filter}
          onChange={list.setFilter}
          counts={list.metrics}
        />
      )}

      <FormSheet
        isOpen={showCreate}
        onClose={closeCreate}
        title={createModalTitle}
      >
        {createContent}
      </FormSheet>

      <FormSheet
        isOpen={!!previewTable}
        onClose={() => setPreviewTable(null)}
        title={previewTable?.label ?? ""}
      >
        {previewTable && (
          <QrPreview
            token={previewTable.token}
            label={previewTable.label}
            kind="table"
            tableCapacity={previewTable.table_capacity}
            businessName={activeTenant.name}
          />
        )}
      </FormSheet>

      {/* Body */}
      {list.isLoading && list.tables.length === 0 ? (
        <p className="text-sm text-muted-foreground">Cargando mesas...</p>
      ) : list.tables.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Coffee className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Aún no tienes mesas
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Crea tu primera mesa para que tus clientes puedan escanear y
              ordenar desde su celular.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="mt-2 inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="h-4 w-4" />
            Crear primera mesa
          </button>
        </div>
      ) : list.filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No hay mesas en esta categoría.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.filtered.map((table) => (
            <TableListCard
              key={table.id}
              table={table}
              tenantSlug={tenantSlug}
              onViewQr={setPreviewTable}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "amber" | "emerald";
}) {
  const valueClass =
    tone === "amber"
      ? "text-amber-700"
      : tone === "emerald"
        ? "text-emerald-700"
        : "text-foreground";
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}
