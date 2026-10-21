"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, BadgePercent, CalendarClock, CirclePause, Plus, Sparkles } from "lucide-react";

import { useActiveTenant, usePermission } from "@/stores/useTenantStore";
import { useOffersList } from "@/features/promociones/hooks/useOffersList";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricsStrip } from "@/components/admin/MetricsStrip";
import { PageHeader } from "@/components/admin/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FAB } from "@/components/ui/FAB";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";
import { Toast } from "@/components/ui/Toast";
import { OfferListCard } from "@/features/promociones/components/OfferListCard";

import { pageHeaderCta } from "@/components/admin/actionButtonClasses";
import { templatesFor } from "@/features/promociones/helpers/templateSuggestions";

import type { PromotionListItem } from "@/features/promociones/services/promotionsClientService";

export function OffersPage({ tenantSlug }: { tenantSlug: string }) {
  const router = useRouter();
  const tenant = useActiveTenant();
  const can = usePermission();
  const canWrite = can("promotions.write");
  const list = useOffersList(tenant?.id ?? null);
  const [toArchive, setToArchive] = useState<PromotionListItem | null>(null);

  const base = `/dashboard/${tenantSlug}/promociones`;
  const storeBase = tenant?.public_store_enabled && tenant.site_slug ? `/sitio/${tenant.site_slug}/promociones` : null;
  const quickStarts = [...templatesFor(tenant?.business_type).forYou, ...templatesFor(null).universal]
    .filter((template) => template.available)
    .slice(0, 3);

  if (!tenant) return <p className="text-sm text-muted-foreground">Selecciona un negocio para continuar.</p>;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Promociones"
        description="Descuentos, 2x1 y paquetes que tus clientes ven y aprovechan en tu tienda en línea."
        action={
          canWrite ? (
            <Link href={`${base}/nueva`} className={`${pageHeaderCta} hidden md:inline-flex`}>
              <Plus className="h-4 w-4" aria-hidden />
              Crear promoción
            </Link>
          ) : null
        }
      />

      {list.hasAny ? (
        <MetricsStrip
          metrics={[
            { label: "Activas", value: list.counts.active, tone: "emerald", icon: BadgePercent },
            { label: "Programadas", value: list.counts.scheduled, tone: "accent", icon: CalendarClock },
            { label: "Pausadas", value: list.counts.paused, tone: list.counts.paused > 0 ? "amber" : "default", icon: CirclePause },
            { label: "Borradores", value: list.counts.draft, icon: Sparkles },
          ]}
        />
      ) : null}

      {list.hasAny ? (
        <FilterTabs tabs={list.tabs} activeValue={list.filter} onTabChange={list.setFilter} ariaLabel="Filtrar promociones" />
      ) : null}

      {list.loadError ? <Notification tone="error" message="No pudimos cargar tus promociones. Intenta de nuevo." /> : null}

      {list.isLoading ? (
        <LoadingBlock variant="skeleton" skeletonRows={4} />
      ) : !list.hasAny ? (
        <EmptyState
          icon={BadgePercent}
          title="Crea tu primera promoción"
          description="Elige una idea y en pocos pasos queda publicada en tu tienda."
          action={
            canWrite ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                {quickStarts.map((template) => (
                  <Link
                    key={template.key}
                    href={`${base}/nueva?template=${template.key}`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:border-accent/40"
                  >
                    <template.icon className="h-4 w-4 text-accent" aria-hidden />
                    {template.title}
                  </Link>
                ))}
              </div>
            ) : null
          }
        />
      ) : list.entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No hay promociones en este filtro.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.entries.map((entry) => (
            <li key={entry.promotion.id}>
              <OfferListCard
                entry={entry}
                storeUrl={storeBase ? `${storeBase}/${entry.promotion.slug ?? entry.promotion.id}` : null}
                busy={list.busyId === entry.promotion.id}
                onEdit={() => router.push(`${base}/${entry.promotion.id}/editar`)}
                onPause={() => void list.pause(entry.promotion.id)}
                onActivate={() => void list.activate(entry.promotion.id)}
                onDuplicate={async () => {
                  const id = await list.duplicate(entry.promotion.id);
                  if (id) router.push(`${base}/${id}/editar`);
                }}
                onArchive={() => setToArchive(entry.promotion)}
              />
            </li>
          ))}
        </ul>
      )}

      {canWrite ? (
        <FAB href={`${base}/nueva`} aria-label="Crear promoción">
          <Plus className="h-6 w-6 shrink-0" />
        </FAB>
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(toArchive)}
        onClose={() => setToArchive(null)}
        onConfirm={async () => {
          if (toArchive) await list.archive(toArchive.id);
          setToArchive(null);
        }}
        title="¿Archivar esta promoción?"
        description="Deja de verse en tu tienda. Los pedidos que ya la usaron la conservan."
        confirmLabel="Archivar"
        variant="danger"
        icon={Archive}
        loading={Boolean(toArchive && list.busyId === toArchive.id)}
      />

      {list.notice ? <Toast message={list.notice.message} tone={list.notice.tone} onDone={list.clearNotice} /> : null}
    </div>
  );
}
