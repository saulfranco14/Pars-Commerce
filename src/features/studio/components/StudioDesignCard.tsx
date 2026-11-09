"use client";
import Link from "next/link";
import { Archive, Copy, Download, Pencil, WandSparkles } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { STUDIO_FORMATS } from "../constants/studio";
import type { StudioDesign } from "../interfaces/studio";

export function StudioDesignCard({
  design,
  base,
  active,
  busy,
  onDuplicate,
  onArchive,
  onDownload,
}: {
  design: StudioDesign;
  base: string;
  active: boolean;
  busy: boolean;
  onDuplicate: () => void;
  onArchive: () => void;
  onDownload: () => void;
}) {
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <WandSparkles className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-bold">{design.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {STUDIO_FORMATS[design.draft_scene.format]?.label} ·{" "}
            {new Date(design.updated_at).toLocaleDateString("es-MX")}
          </p>
        </div>
      </div>
      <div className="mt-3">
        <StatusBadge
          tone={design.status === "ready" ? "success" : "neutral"}
          label={
            design.status === "ready"
              ? "Listo"
              : design.status === "archived"
                ? "Archivado"
                : "Borrador"
          }
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`${base}/disenos/${design.id}`}
          className={adminActionButtonSecondary}
        >
          <Pencil className="h-4 w-4" />
          {active ? "Editar" : "Consultar"}
        </Link>
        <button
          onClick={onDownload}
          disabled={busy}
          className={adminActionButtonSecondary}
        >
          <Download className="h-4 w-4" />
          Descargar
        </button>
        {active && (
          <>
            <button
              aria-label={`Duplicar ${design.title}`}
              onClick={onDuplicate}
              disabled={busy}
              className={adminActionButtonSecondary}
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              aria-label={`Archivar ${design.title}`}
              onClick={onArchive}
              disabled={busy}
              className={adminActionButtonSecondary}
            >
              <Archive className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </article>
  );
}
