"use client";
import Link from "next/link";
import { LayoutGrid, Megaphone, Package, Plus, Search } from "lucide-react";
import { useStudioAiPreference } from "../hooks/useStudioAiPreference";
import { useStudioCreating } from "../hooks/useStudioCreating";
import { useStudioShelf } from "../hooks/useStudioShelf";
import { EmptyState } from "@/components/admin/EmptyState";
import { FormInput } from "@/components/ui/FormInput";
import { Notification } from "@/components/ui/Notification";
import { Skeleton } from "@/components/ui/Skeleton";
import { useStudioContext } from "./StudioProvider";
import { StudioAiToggle } from "./StudioAiToggle";
import { StudioCreatingScreen } from "./StudioCreatingScreen";
import { StudioShelfRow } from "./StudioShelfRow";
import {
  actionPair,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { studioRechargeHref } from "../helpers/entry";
import { STUDIO_SHELF_VIEWS } from "../constants/studio";

/** Studio opens here: the catalog, one Crear per item; what already has an ad sits behind a switch. */
export function StudioShelf() {
  const { tenantId, tenantSlug, summary } = useStudioContext(),
    shelf = useStudioShelf(),
    base = `/dashboard/${tenantSlug}/studio`,
    reason = !summary?.aiEnabled
      ? "inactive"
      : (summary.balance.available ?? 0) < 1
        ? "empty"
        : "ready",
    [ai, setAi] = useStudioAiPreference(tenantId, reason === "ready"),
    creatingName = useStudioCreating(),
    view = shelf.done.length ? shelf.view : "todo",
    list = shelf[view];
  return (
    <div className="space-y-4">
      {creatingName && <StudioCreatingScreen name={creatingName} />}
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
        <section className="space-y-3">
          {shelf.done.length > 0 && (
            <div
              role="group"
              aria-label="Tu catálogo"
              className="grid grid-cols-2 gap-1 rounded-xl bg-border-soft/70 p-1"
            >
              {STUDIO_SHELF_VIEWS.map((tab) => {
                const on = view === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => shelf.setView(tab.key)}
                    className={`inline-flex min-h-11 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-accent ${on ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <span className="truncate">{tab.label}</span>
                    <span
                      className={`rounded-full px-1.5 text-xs tabular-nums ${on ? "bg-accent/10 text-accent" : "bg-surface/60"}`}
                    >
                      {shelf[tab.key].length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {list.length ? (
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              {list.map((item) => (
                <StudioShelfRow
                  key={`${item.type}:${item.id}`}
                  item={item}
                  tenantId={tenantId}
                  adHref={
                    item.ad ? `${base}/disenos/${item.ad.designId}` : undefined
                  }
                  creating={shelf.creating === item.id}
                  disabled={Boolean(shelf.creating)}
                  onCreate={() => void shelf.create(item, ai)}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-border-soft/60 p-4 text-sm text-muted-foreground">
              {shelf.query
                ? `Nada coincide con «${shelf.query}».`
                : "Todo tu catálogo ya tiene anuncio."}
            </p>
          )}
        </section>
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
      <div className="sticky bottom-3 z-10 rounded-2xl border border-border bg-surface/95 p-2 shadow-lg backdrop-blur">
        <div className={actionPair}>
          {shelf.total || shelf.isLoading ? (
            <Link
              href={`${base}/varios`}
              className={adminActionButtonSecondary}
            >
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
    </div>
  );
}
