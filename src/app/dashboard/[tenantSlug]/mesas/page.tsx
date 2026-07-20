"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Plus, RefreshCw, Store } from "lucide-react";

import { useActiveTenant } from "@/stores/useTenantStore";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { pageHeaderCta } from "@/components/admin/actionButtonClasses";
import { FabSpeedDial } from "@/components/ui/FabSpeedDial";
import { FormSheet } from "@/components/ui/FormSheet";
import { QrCreateForm } from "@/features/qr/components/qr-create/QrCreateForm";
import { CreatedQrSuccess } from "@/features/qr/components/qr-create/CreatedQrSuccess";
import { QrPreview } from "@/features/qr/components/qr-create/QrPreview";
import { MesaDetailContent } from "@/features/qr/components/table/MesaDetailContent";
import { TableListCard } from "@/features/qr/components/table/TableListCard";
import { TablesFilterTabs } from "@/features/qr/components/table/TablesFilterTabs";
import { useActiveTables } from "@/features/qr/hooks/useActiveTables";
import { useTablesList } from "@/features/qr/hooks/useTablesList";

import type { QrCode } from "@/features/qr/interfaces/qrCode";

const primaryCta = pageHeaderCta;

export default function MesasPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useActiveTenant();

  const list = useTablesList(activeTenant?.id ?? null);
  // Total + preparation state per occupied table (drives each card's total
  // line, status badge, and one-shot "ready" celebration) — separate
  // polling from the occupied/free list above, which intentionally has
  // none (see useTablesList).
  const activeTables = useActiveTables(activeTenant?.id ?? null);
  const activeByQrId = new Map(
    activeTables.tables.map((t) => [t.qr_code_id, t]),
  );

  const [showCreate, setShowCreate] = useState(false);
  const [createdTable, setCreatedTable] = useState<QrCode | null>(null);
  const [previewTable, setPreviewTable] = useState<QrCode | null>(null);
  const [detailTableId, setDetailTableId] = useState<string | null>(null);
  // Re-resolve from the live list on every render (not a frozen snapshot from
  // the click moment) so the modal reflects e.g. the table freeing up while
  // it's open, same as the standalone detail page does via its own SWR read.
  const detailTable = detailTableId
    ? (list.tables.find((t) => t.id === detailTableId) ?? null)
    : null;

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
    <div className="space-y-4">
      <div className="space-y-1.5">
        <PageHeader
          title="Mesas"
          description="Cada mesa tiene un QR único para que tus clientes ordenen y paguen."
          action={
            // Desktop: both actions in the header. Mobile: a single FAB speed-dial
            // (below) — never the same action duplicated in header + FAB.
            <div className="hidden flex-wrap items-center gap-2 md:flex">
              <Link
                href={`/dashboard/${tenantSlug}/pedidos/nuevo`}
                className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-border-soft/40"
              >
                <ClipboardList className="h-4 w-4" />
                Tomar pedido
              </Link>
              <button type="button" onClick={openCreate} className={primaryCta}>
                <Plus className="h-4 w-4" />
                Agregar mesa
              </button>
            </div>
          }
        />

        {hasTables && (
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <TablesFilterTabs
                filter={list.filter}
                onChange={list.setFilter}
                counts={list.metrics}
              />
            </div>
            <button
              type="button"
              onClick={() => list.refresh()}
              disabled={list.isRefreshing}
              aria-label="Actualizar estado de las mesas"
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:bg-border-soft/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${list.isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Mobile: one FAB that expands to both create actions. */}
      <FabSpeedDial
        aria-label="Acciones"
        actions={[
          { label: "Agregar mesa", icon: Plus, onClick: openCreate },
          {
            label: "Tomar pedido",
            icon: ClipboardList,
            href: `/dashboard/${tenantSlug}/pedidos/nuevo`,
          },
        ]}
      />

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

      {/* Detail modal — same content as the standalone /mesas/[mesaId] page,
          opened in place so staff never leave the list (no back-navigation
          round trip for a quick check). */}
      <FormSheet
        isOpen={!!detailTable}
        onClose={() => setDetailTableId(null)}
        title=""
        maxWidth="max-w-2xl"
      >
        {detailTable && (
          <MesaDetailContent
            qr={detailTable}
            qrList={list.tables}
            tenantName={activeTenant.name}
            orderHref={(orderId) =>
              `/dashboard/${tenantSlug}/pedidos/nuevo?table_order_id=${orderId}`
            }
            onClosed={() => setDetailTableId(null)}
          />
        )}
      </FormSheet>

      {list.isLoading && !hasTables ? (
        <p className="text-sm text-muted-foreground">Cargando mesas...</p>
      ) : !hasTables ? (
        <EmptyState
          icon={Store}
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
              onViewQr={setPreviewTable}
              onViewDetail={setDetailTableId}
              active={activeByQrId.get(table.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
