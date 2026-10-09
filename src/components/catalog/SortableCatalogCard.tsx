"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";

import { btnDanger, btnSecondaryFlex } from "@/components/ui/buttonClasses";

interface SortableCatalogCardProps {
  id: string;
  name: string;
  imageUrl?: string | null;
  price: number;
  detail: string;
  tag?: string | null;
  disabled?: boolean;
  editHref: string;
  deleting?: boolean;
  onDelete: () => void;
}

/**
 * Mobile catalog ordering is deliberately attached only to the grip. This
 * keeps normal page scrolling and opening the item effortless, while the
 * business owner has one clear, tactile place to grab when arranging their
 * virtual shelf.
 */
export function SortableCatalogCard({
  id,
  name,
  imageUrl,
  price,
  detail,
  tag,
  disabled = false,
  editHref,
  deleting = false,
  onDelete,
}: SortableCatalogCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-2xl border bg-surface-raised p-3 shadow-sm transition-shadow ${
        isDragging
          ? "z-10 border-accent/50 opacity-80 shadow-lg"
          : "border-border"
      }`}
    >
      <div className="flex gap-2.5">
        <button
          ref={setActivatorNodeRef}
          type="button"
          disabled={disabled}
          className="flex h-14 w-10 shrink-0 touch-none items-center justify-center rounded-xl border border-border bg-surface text-muted transition-colors active:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label={`Mantén presionado y arrastra ${name} para cambiar su posición`}
          title="Arrastra para ordenar"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" aria-hidden />
        </button>

        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-border-soft">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs text-muted">
              —
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{name}</p>
          {tag ? (
            <span className="mt-0.5 inline-flex rounded-md bg-accent/10 px-1.5 py-0.5 text-[11px] font-medium text-accent">
              {tag}
            </span>
          ) : null}
          <p className="mt-1 text-sm font-bold text-foreground">
            ${Number(price).toFixed(2)}
          </p>
          <p className="truncate text-xs text-muted">{detail}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border-soft pt-3">
        <Link href={editHref} className={btnSecondaryFlex}>
          <Pencil className="h-4 w-4 shrink-0" aria-hidden />
          Editar
        </Link>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className={btnDanger}
          aria-label={`Eliminar ${name}`}
        >
          <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
          {deleting ? "..." : "Eliminar"}
        </button>
      </div>
    </article>
  );
}
