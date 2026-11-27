"use client";
import { useRef, useState } from "react";
import {
  Camera,
  Check,
  ImageOff,
  Loader2,
  Move,
  Palette,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { FormSheet } from "@/components/ui/FormSheet";
import { StudioFadingPreview } from "./StudioFadingPreview";
import {
  actionPair,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { trackStudioFunnel } from "../../services/studioAnalyticsClient";
import { STUDIO_TEXT_ONLY_DESIGNS } from "../../constants/designs";
import type { StudioDesignId } from "../../interfaces/scene";
import type {
  StudioChangeSheetProps,
  StudioChangeTab,
} from "../../interfaces/ui";

const TABS: Array<{ id: StudioChangeTab; label: string }> = [
  { id: "design", label: "Diseño" },
  { id: "photo", label: "Foto" },
  { id: "phrase", label: "Frase" },
];
const tile =
  "flex min-w-0 cursor-pointer flex-col gap-1 rounded-xl p-1 text-center text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60";
const picked = (on: boolean) =>
  on
    ? "bg-accent/10 text-accent ring-2 ring-accent"
    : "hover:bg-border-soft/60";

/** Design, photo and phrase in one sheet; each tap shows at once on the ad behind. */
export function StudioChangeSheet({
  open,
  onClose,
  disabled,
  photos,
  designs,
  ad,
  assets,
  tenantId,
  onByHand,
}: StudioChangeSheetProps) {
  const [tab, setTab] = useState<StudioChangeTab>("design"),
    camera = useRef<HTMLInputElement>(null);
  const options = designs.options
    .map((option, index) => ({ option, index }))
    .filter(
      ({ option }) =>
        photos.hasPhoto ||
        STUDIO_TEXT_ONLY_DESIGNS.includes(option.id as StudioDesignId),
    );
  const aiKind = photos.hasPhoto ? "photo" : ad.canIllustrate ? "scene" : null;
  return (
    <FormSheet
      isOpen={open}
      onClose={onClose}
      title="Cambiar"
      icon={Palette}
      footer={
        <div className={actionPair}>
          <button
            type="button"
            className={adminActionButtonSecondary}
            onClick={onByHand}
          >
            <Move className="h-4 w-4" />A mano
          </button>
          <button
            type="button"
            className={adminActionButtonPrimary}
            onClick={onClose}
          >
            <Check className="h-4 w-4" />
            Listo
          </button>
        </div>
      }
    >
      <div className="space-y-4 pb-3">
        <div
          className="grid grid-cols-3 gap-1 rounded-xl bg-border-soft/70 p-1"
          role="group"
          aria-label="Qué cambiar"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`min-h-10 cursor-pointer rounded-lg text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-accent ${tab === t.id ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "design" && (
          <div className="grid grid-cols-3 gap-2">
            {options.map(({ option, index }) => (
              <button
                key={option.id}
                type="button"
                disabled={disabled}
                aria-pressed={index === designs.activeIndex}
                onClick={() => {
                  designs.pick(index);
                  trackStudioFunnel("studio_design_changed", {
                    design: option.id,
                  });
                }}
                className={`${tile} ${picked(index === designs.activeIndex)}`}
              >
                <span className="block overflow-hidden rounded-lg">
                  <StudioFadingPreview
                    scene={option.scene}
                    assets={assets}
                    tenantId={tenantId}
                  />
                </span>
                {option.name}
              </button>
            ))}
          </div>
        )}

        {tab === "photo" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {photos.tiles.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  disabled={disabled}
                  aria-pressed={t.selected}
                  onClick={() => {
                    t.onPick();
                    trackStudioFunnel("studio_photo_changed", {
                      photo: t.badge ? "ai" : "own",
                    });
                  }}
                  className={`${tile} ${picked(t.selected)}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.url ?? undefined}
                    alt=""
                    loading="lazy"
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
              {ad.running && (
                <span
                  className={`${tile} text-muted-foreground`}
                  aria-live="polite"
                >
                  <span className="flex aspect-square w-full items-center justify-center rounded-lg bg-border-soft">
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  </span>
                  Haciendo…
                </span>
              )}
              <button
                type="button"
                disabled={disabled}
                aria-pressed={!photos.hasPhoto}
                onClick={() => {
                  photos.clear();
                  trackStudioFunnel("studio_photo_changed", { photo: "none" });
                }}
                className={`${tile} ${picked(!photos.hasPhoto)}`}
              >
                <span className="flex aspect-square w-full items-center justify-center rounded-lg bg-linear-to-b from-slate-900 to-accent text-white">
                  <ImageOff className="h-5 w-5" aria-hidden />
                </span>
                Sin foto
              </button>
            </div>
            <div className={actionPair}>
              <button
                type="button"
                className={adminActionButtonSecondary}
                disabled={disabled}
                onClick={() => camera.current?.click()}
              >
                <Camera className="h-4 w-4" />
                Tomar foto
              </button>
              <button
                type="button"
                className={adminActionButtonSecondary}
                disabled={
                  disabled ||
                  !aiKind ||
                  Boolean(ad.running) ||
                  !ad.aiActive ||
                  !ad.affordable
                }
                onClick={() => aiKind && void ad.runAi(aiKind)}
              >
                <Sparkles className="h-4 w-4" />
                Con IA
              </button>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Solo fotos de este anuncio. Con IA cuesta 1 Tlaco y, si no sale,
              no se cobra.
              {!aiKind &&
                " Para un producto la IA necesita tu foto: no inventa cómo se ve."}
            </p>
            <input
              ref={camera}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void ad.takePhoto(file);
              }}
            />
          </div>
        )}

        {tab === "phrase" && (
          <div className="space-y-3">
            {designs.phrases.length ? (
              <div className="flex flex-col gap-2">
                {designs.phrases.map((phrase) => (
                  <button
                    key={phrase}
                    type="button"
                    disabled={disabled}
                    aria-pressed={phrase === designs.current}
                    onClick={() => {
                      designs.choosePhrase(phrase);
                      trackStudioFunnel("studio_phrase_changed");
                    }}
                    className={`min-h-11 w-full cursor-pointer rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors ${phrase === designs.current ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface hover:bg-border-soft/50"}`}
                  >
                    {phrase.replace(/\n/g, " ")}
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-border-soft/60 p-3 text-sm text-muted-foreground">
                {designs.busy
                  ? "La IA escribe tus frases…"
                  : "Todavía no hay frases."}
              </p>
            )}
            <button
              type="button"
              className={`${adminActionButtonSecondary} w-full sm:w-auto`}
              disabled={disabled || designs.busy || designs.moreLeft <= 0}
              onClick={() => void designs.more()}
            >
              {designs.busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Otras
            </button>
            <p className="text-xs text-muted-foreground">
              {designs.moreLeft > 0
                ? `Gratis: la IA escribe 6 nuevas. Te quedan ${designs.moreLeft}.`
                : "Ya pediste 3 veces; escribe la tuya en A mano."}
            </p>
          </div>
        )}
      </div>
    </FormSheet>
  );
}
