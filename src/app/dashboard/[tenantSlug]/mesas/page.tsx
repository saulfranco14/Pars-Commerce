"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Clock, Coffee, LayoutGrid, Plus } from "lucide-react";

import { useActiveTenant } from "@/stores/useTenantStore";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricsStrip } from "@/components/admin/MetricsStrip";
import { PageHeader } from "@/components/admin/PageHeader";
import { FormSheet } from "@/components/ui/FormSheet";
import { QrCreateForm } from "@/features/qr/components/QrCreateForm";
import { CreatedQrSuccess } from "@/features/qr/components/CreatedQrSuccess";
import { QrPreview } from "@/features/qr/components/QrPreview";
import { TableListCard } from "@/features/qr/components/TableListCard";
import { TablesFilterTabs } from "@/features/qr/components/TablesFilterTabs";
import { useTablesList } from "@/features/qr/hooks/useTablesList";

import type { QrCode } from "@/features/qr/interfaces/qrCode";

const primaryCta =
  "inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground shadow-md shadow-accent/20 hover:bg-accent/90 active:scale-[0.99] transition-all";

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

  const hasTables = list.tables.length > 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mesas"
        description="Cada mesa tiene un QR único para que tus clientes ordenen y paguen."
        action={
          <button
            type="button"
            onClick={openCreate}
            className={primaryCta}
          >
            <Plus className="h-4 w-4" />
            Agregar mesa
          </button>
        }
      />

      {hasTables && (
        <MetricsStrip
          metrics={[
            {
              label: "Mesas totales",
              value: list.metrics.total,
              icon: LayoutGrid,
            },
            {
              label: "En uso",
              value: list.metrics.occupied,
              tone: "amber",
              icon: Clock,
            },
            {
              label: "Libres",
              value: list.metrics.free,
              tone: "emerald",
              icon: CheckCircle2,
            },
          ]}
        />
      )}

      {hasTables && (
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

      {list.isLoading && !hasTables ? (
        <p className="text-sm text-muted-foreground">Cargando mesas...</p>
      ) : !hasTables ? (
        <EmptyState
          icon={Coffee}
          title="Aún no tienes mesas"
          description="Crea tu primera mesa para que tus clientes puedan escanear y ordenar desde su celular."
          action={
            <button
              type="button"
              onClick={openCreate}
              className={primaryCta}
            >
              <Plus className="h-4 w-4" />
              Crear primera mesa
            </button>
          }
        />
      ) : list.filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
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
