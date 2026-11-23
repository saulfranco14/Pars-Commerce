"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Clock,
  LayoutGrid,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Notification } from "@/components/ui/Notification";
import {
  actionPair,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { STUDIO_BATCH_IMAGE_ESTIMATE_MS } from "../constants/studio";
import type {
  StudioBatchProgressProps,
  StudioBatchRow,
} from "../interfaces/ui";

/** Each image weighs more than building its ad, so the bar moves at the real pace. */
const IMAGE_WEIGHT = 4;

const STATUS: Record<
  StudioBatchRow["status"],
  { label: string; tone: string }
> = {
  waiting: { label: "En espera", tone: "text-muted-foreground" },
  creating: { label: "Armando anuncio…", tone: "text-accent" },
  queued: { label: "Espera su imagen", tone: "text-muted-foreground" },
  image: { label: "Haciendo imagen…", tone: "text-accent" },
  done: { label: "Listo", tone: "text-emerald-700 dark:text-emerald-400" },
  failed: { label: "No salió", tone: "text-amber-700 dark:text-amber-400" },
  later: { label: "Pendiente", tone: "text-muted-foreground" },
};

function RowIcon({ status }: { status: StudioBatchRow["status"] }) {
  if (status === "creating")
    return <Loader2 className="h-4 w-4 animate-spin text-accent" aria-hidden />;
  if (status === "image")
    return (
      <Sparkles
        className="h-4 w-4 animate-pulse text-accent motion-reduce:animate-none"
        aria-hidden
      />
    );
  if (status === "done")
    return (
      <Check
        className="h-4 w-4 text-emerald-700 dark:text-emerald-400"
        aria-hidden
      />
    );
  if (status === "failed")
    return (
      <AlertTriangle
        className="h-4 w-4 text-amber-700 dark:text-amber-400"
        aria-hidden
      />
    );
  return <Clock className="h-4 w-4 text-muted-foreground" aria-hidden />;
}

/** One row per item with its real step, a bar that keeps moving while the AI works, and links once done. */
export function StudioBatchProgress({
  phase,
  mode,
  rows,
  imageStartedAt,
  error,
  base,
  onReset,
}: StudioBatchProgressProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!imageStartedAt) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [imageStartedAt]);
  const each = mode === "each",
    total = rows.length,
    built = rows.filter((r) => !["waiting", "creating"].includes(r.status)),
    finished = rows.filter((r) =>
      ["done", "failed", "later"].includes(r.status),
    ),
    ready = rows.filter((r) => r.status === "done").length,
    making = rows.find((r) => r.status === "image"),
    imagesTotal = each ? rows.filter((r) => r.designId).length : 0,
    imagesDone = each
      ? rows.filter(
          (r) => r.designId && ["done", "failed", "later"].includes(r.status),
        ).length
      : 0,
    partial =
      making && imageStartedAt
        ? Math.min(0.9, (now - imageStartedAt) / STUDIO_BATCH_IMAGE_ESTIMATE_MS)
        : 0,
    units = total * (each ? 1 + IMAGE_WEIGHT : 1),
    doneUnits =
      built.length +
      (each
        ? (imagesDone + partial) * IMAGE_WEIGHT +
          (total - imagesTotal) * IMAGE_WEIGHT
        : 0),
    percent =
      phase === "done"
        ? 100
        : units
          ? Math.max(3, Math.round((doneUnits / units) * 100))
          : 3,
    buildingAds = rows.some((r) => ["waiting", "creating"].includes(r.status));
  const step =
    phase === "done"
      ? "Ya están en tu biblioteca, listos para revisar y compartir."
      : buildingAds || !each
        ? `${each ? "Paso 1 de 2 · " : ""}Armando los anuncios y sus frases (${built.length} de ${total})`
        : `Paso 2 de 2 · La IA hace la imagen ${Math.min(imagesDone + 1, imagesTotal)} de ${imagesTotal}`;
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface p-5">
      <div className="space-y-1">
        <p className="text-lg font-bold">
          {phase === "done"
            ? `Listo: ${ready} de ${total} anuncios`
            : `Creando ${total} anuncios`}
        </p>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {step}
        </p>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-border-soft"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Avance de la tanda"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
      <ul className="max-h-80 divide-y divide-border-soft overflow-y-auto rounded-xl border border-border">
        {rows.map((row) => {
          const meta = STATUS[row.status],
            content = (
              <>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-border-soft">
                  {row.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <RowIcon status={row.status} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {row.name}
                  </span>
                  <span className={`block truncate text-xs ${meta.tone}`}>
                    {row.reason ?? meta.label}
                  </span>
                </span>
              </>
            );
          return (
            <li key={row.id}>
              {phase === "done" && row.designId ? (
                <Link
                  href={`${base}/disenos/${row.designId}`}
                  className="flex min-h-14 items-center gap-3 px-3 py-2 transition-colors hover:bg-accent/5"
                >
                  {content}
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              ) : (
                <div className="flex min-h-14 items-center gap-3 px-3 py-2">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {phase === "creating" && (
        <p className="text-xs text-muted-foreground">
          {buildingAds
            ? "Mantén esta pantalla abierta mientras armamos los anuncios."
            : "Puedes salir: las imágenes que falten se terminan cuando vuelvas a Studio."}
        </p>
      )}
      {error && <Notification tone="error" message={error} />}
      {phase === "done" && finished.length > 0 && (
        <div className={actionPair}>
          <button
            type="button"
            className={adminActionButtonSecondary}
            onClick={onReset}
          >
            <LayoutGrid className="h-4 w-4" />
            Otra tanda
          </button>
          <Link href={`${base}/disenos`} className={adminActionButtonPrimary}>
            <Check className="h-4 w-4" />
            Biblioteca
          </Link>
        </div>
      )}
    </section>
  );
}
