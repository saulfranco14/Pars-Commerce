"use client";
import { useState } from "react";
import {
  ChevronDown,
  Download,
  Search,
  Share2,
  Store,
  WandSparkles,
} from "lucide-react";
import { useStudioAds } from "../hooks/useStudioAds";
import { useStudioBulkPublish } from "../hooks/useStudioBulkPublish";
import { useStudioMultiShare } from "../hooks/useStudioMultiShare";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormInput } from "@/components/ui/FormInput";
import { Notification } from "@/components/ui/Notification";
import { Toast } from "@/components/ui/Toast";
import { useStudioContext } from "./StudioProvider";
import { StudioActionBar } from "./StudioActionBar";
import { StudioAdCard } from "./StudioAdCard";
import { StudioLoading } from "./StudioLoading";
import { StudioMultiShareSheet } from "./StudioMultiShareSheet";
import { StudioYourImages } from "./StudioYourImages";
import {
  actionPair,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import {
  STUDIO_ACTION_BAR_SPACE,
  STUDIO_AD_FILTERS,
  STUDIO_SHARE_MAX,
} from "../constants/studio";
import { canShareStudioAd, toggleStudioPick } from "../helpers/adState";
import { trackStudioFunnel } from "../services/studioAnalyticsClient";

/**
 * Everything the merchant has made: find one, see where it is, and pick
 * several to share or publish together. After a share the picks clear and
 * the next group can go right away.
 */
export function StudioAdsPage() {
  const { tenantId, tenantSlug } = useStudioContext(),
    ads = useStudioAds(),
    [selecting, setSelecting] = useState(false),
    [picked, setPicked] = useState<string[]>([]),
    [sheet, setSheet] = useState<"share" | "publish" | null>(null),
    [toast, setToast] = useState<string | null>(null),
    multi = useStudioMultiShare(tenantId, picked),
    bulk = useStudioBulkPublish(() => ads.refresh()),
    base = `/dashboard/${tenantSlug}/studio`;

  const pickedDesigns = ads.all
      .filter((a) => picked.includes(a.design.id))
      .map((a) => a.design),
    publishable = ads.all
      .filter(
        (a) =>
          picked.includes(a.design.id) &&
          a.state === "ready" &&
          a.design.source_type === "product",
      )
      .map((a) => a.design),
    full = picked.length >= STUDIO_SHARE_MAX,
    storeUrl = pickedDesigns[0]?.destination_url ?? "",
    status = !picked.length
      ? `Elige hasta ${STUDIO_SHARE_MAX} para compartirlos juntos.`
      : !multi.allReady
        ? `Preparando ${multi.done} de ${picked.length}…`
        : `${picked.length} de ${STUDIO_SHARE_MAX} · listos para compartir`;

  function stopSelecting() {
    setSelecting(false);
    setPicked([]);
  }

  async function share(kind: "chats" | "status") {
    const ok = await multi.share(pickedDesigns, kind, storeUrl);
    if (!ok) return;
    trackStudioFunnel("studio_shared", {
      channel: `group_${kind}`,
      count: pickedDesigns.length,
    });
    setSheet(null);
    setPicked([]);
    setToast(
      multi.canShareFiles
        ? "Listo. Elige otros para el siguiente envío."
        : "Descargamos tus imágenes. Elige otros si quieres más.",
    );
  }

  if (ads.library.isLoading) return <StudioLoading />;
  return (
    <div className={`space-y-5 ${selecting ? STUDIO_ACTION_BAR_SPACE : ""}`}>
      <PageHeader
        compact
        title="Anuncios"
        action={
          ads.all.length > 0 ? (
            <button
              type="button"
              className="min-h-11 cursor-pointer px-2 text-sm font-semibold text-accent"
              onClick={() => (selecting ? stopSelecting() : setSelecting(true))}
            >
              {selecting ? "Cancelar" : "Seleccionar"}
            </button>
          ) : undefined
        }
      />
      <FormInput
        label="Buscar anuncio"
        icon={Search}
        value={ads.search}
        onChange={(e) => ads.setSearch(e.target.value)}
      />
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filtrar anuncios"
      >
        {STUDIO_AD_FILTERS.filter(
          (f) => f.id !== "updating" || ads.hasUpdating,
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={ads.filter === f.id}
            onClick={() => ads.setFilter(f.id)}
            className={`min-h-9 cursor-pointer rounded-full px-3.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent ${ads.filter === f.id ? "bg-foreground text-background" : "bg-border-soft/70 text-muted-foreground hover:text-foreground"}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {ads.hasUpdating && (
        <Notification
          tone="info"
          message="Cambiaste el precio o el nombre de algunos productos. Estamos actualizando sus anuncios; la imagen se queda igual."
        />
      )}
      {(ads.library.error || bulk.error || multi.failed.length > 0) && (
        <Notification
          tone="warning"
          message={
            ads.library.error ??
            bulk.error ??
            "Uno no se pudo preparar. Quítalo y vuelve a elegirlo."
          }
          onDismiss={bulk.error ? bulk.clearError : undefined}
        />
      )}
      {ads.items.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {ads.items.map(({ design, state }) => {
            const isPicked = picked.includes(design.id);
            return (
              <StudioAdCard
                key={design.id}
                design={design}
                state={state}
                href={`${base}/disenos/${design.id}`}
                tenantId={tenantId}
                selecting={selecting}
                picked={isPicked}
                blocked={
                  !canShareStudioAd(state)
                    ? state === "updating"
                      ? "Se está actualizando."
                      : "Termínalo primero."
                    : full && !isPicked
                      ? `Ya elegiste ${STUDIO_SHARE_MAX}.`
                      : null
                }
                sent={multi.wasSent(design.id)}
                onToggle={() =>
                  setPicked((current) => toggleStudioPick(current, design.id))
                }
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={WandSparkles}
          title={
            ads.search || ads.filter !== "all"
              ? "Nada con ese filtro"
              : "Tu primer anuncio empieza con lo que ya vendes"
          }
          description={
            ads.search || ads.filter !== "all"
              ? "Prueba con otro nombre o vuelve a Todos."
              : "En Crear toca Crear en un producto y te lo damos hecho."
          }
        />
      )}
      {ads.library.hasMore && (
        <button
          type="button"
          onClick={ads.library.loadMore}
          className={`${adminActionButtonSecondary} w-full sm:w-auto`}
        >
          <ChevronDown className="h-4 w-4" />
          Más
        </button>
      )}
      {!selecting && <StudioYourImages />}
      {selecting && (
        <StudioActionBar status={status}>
          <div className={actionPair}>
            <button
              type="button"
              className={adminActionButtonSecondary}
              disabled={
                !ads.canPublish || !publishable.length || Boolean(bulk.progress)
              }
              onClick={() => setSheet("publish")}
            >
              <Store className="h-4 w-4" />
              {bulk.progress
                ? `Publicando ${bulk.progress.done + 1} de ${bulk.progress.total}…`
                : "Publicar"}
            </button>
            <button
              type="button"
              className={adminActionButtonPrimary}
              disabled={!picked.length}
              onClick={() => setSheet("share")}
            >
              {multi.canShareFiles ? (
                <Share2 className="h-4 w-4" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {multi.canShareFiles ? "Compartir" : "Descargar"}
            </button>
          </div>
        </StudioActionBar>
      )}
      <StudioMultiShareSheet
        open={sheet === "share"}
        onClose={() => {
          setSheet(null);
          multi.clearError();
        }}
        count={picked.length}
        waiting={!multi.allReady}
        busy={multi.busy}
        error={multi.error}
        onShare={(kind) => void share(kind)}
      />
      <ConfirmDialog
        isOpen={sheet === "publish"}
        onClose={() => setSheet(null)}
        title="Poner en tu tienda"
        description={`Cada uno será la foto principal de su producto: ${publishable.map((d) => d.title).join(", ")}. Puedes retirarlos cuando quieras.`}
        confirmLabel="Publicar"
        onConfirm={() => {
          setSheet(null);
          void bulk.publish(publishable);
        }}
      />
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
