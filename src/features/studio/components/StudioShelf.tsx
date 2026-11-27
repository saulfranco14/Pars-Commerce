"use client";
import Link from "next/link";
import { LayoutGrid, Megaphone, Package, Plus, Search } from "lucide-react";
import { useStudioAiPreference } from "../hooks/useStudioAiPreference";
import { useStudioShelf } from "../hooks/useStudioShelf";
import { EmptyState } from "@/components/admin/EmptyState";
import { FormInput } from "@/components/ui/FormInput";
import { Notification } from "@/components/ui/Notification";
import { Skeleton } from "@/components/ui/Skeleton";
import { useStudioContext } from "./StudioProvider";
import { StudioAiToggle } from "./StudioAiToggle";
import { StudioShelfRow } from "./StudioShelfRow";
import {
  actionPair,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { studioRechargeHref } from "../helpers/entry";

/** Studio opens here: the catalog, one Crear per item. */
export function StudioShelf() {
  const { tenantId, tenantSlug, summary } = useStudioContext(),
    shelf = useStudioShelf(),
    base = `/dashboard/${tenantSlug}/studio`,
    reason = !summary?.aiEnabled
      ? "inactive"
      : (summary.balance.available ?? 0) < 1
        ? "empty"
        : "ready",
    [ai, setAi] = useStudioAiPreference(tenantId, reason === "ready");
  return (
    <div className="space-y-4">
      <StudioAiToggle
        on={ai}
        onChange={setAi}
        reason={reason}
        rechargeHref={studioRechargeHref(tenantSlug, base)}
      />
      {shelf.total > 8 && (
        <FormInput
          label="Buscar en tu catálogo"
          icon={Search}
          value={shelf.query}
          onChange={(e) => shelf.setQuery(e.target.value)}
        />
      )}
      {shelf.error && (
        <Notification
          tone="error"
          message={shelf.error}
          onDismiss={shelf.clearError}
        />
      )}
      {shelf.loadError && (
        <Notification tone="error" message={shelf.loadError} />
      )}
      {shelf.isLoading ? (
        <div className="space-y-2" aria-label="Cargando tu catálogo">
          <Skeleton className="h-18 rounded-2xl" />
          <Skeleton className="h-18 rounded-2xl" />
          <Skeleton className="h-18 rounded-2xl" />
        </div>
      ) : shelf.items.length ? (
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {shelf.items.map((item) => (
            <StudioShelfRow
              key={`${item.type}:${item.id}`}
              item={item}
              creating={shelf.creating === item.id}
              disabled={Boolean(shelf.creating)}
              onCreate={() => void shelf.create(item, ai)}
            />
          ))}
        </div>
      ) : shelf.total ? (
        <p className="rounded-2xl bg-border-soft/60 p-4 text-sm text-muted-foreground">
          Nada coincide con «{shelf.query}».
        </p>
      ) : (
        <EmptyState
          icon={Package}
          title="Tu catálogo está vacío"
          description="Agrega tu primer producto con foto, o haz una campaña libre: un aviso o una temporada."
        />
      )}
      <div className={actionPair}>
        {shelf.total || shelf.isLoading ? (
          <Link href={`${base}/varios`} className={adminActionButtonSecondary}>
            <LayoutGrid className="h-4 w-4" />
            Varios
          </Link>
        ) : (
          <Link
            href={`/dashboard/${tenantSlug}/productos/nuevo`}
            className={adminActionButtonSecondary}
          >
            <Plus className="h-4 w-4" />
            Producto
          </Link>
        )}
        <Link
          href={`${base}/nuevo?source=custom`}
          className={
            shelf.total || shelf.isLoading
              ? adminActionButtonSecondary
              : adminActionButtonPrimary
          }
        >
          <Megaphone className="h-4 w-4" />
          Campaña
        </Link>
      </div>
    </div>
  );
}
