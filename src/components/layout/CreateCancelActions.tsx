"use client";

import Link from "next/link";
import { Plus, X } from "lucide-react";
import { btnPrimaryFlex, btnSecondaryFlex } from "@/components/ui/buttonClasses";

interface CreateCancelActionsProps {
  createLabel: string;
  cancelHref: string;
  loading?: boolean;
  disabled?: boolean;
  createIcon?: React.ReactNode;
  cancelIcon?: React.ReactNode;
  loadingLabel?: string;
}

const barClass =
  "flex flex-col gap-3 rounded-t-2xl border-t border-border bg-surface px-4 pt-4 pb-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:flex-row md:rounded-none md:gap-3";
const fixedBarClass = `fixed left-0 right-0 z-40 md:static md:rounded-none md:border-t-0 md:shadow-none md:pb-0 ${barClass}`;

export function CreateCancelActions({
  createLabel,
  cancelHref,
  loading = false,
  disabled = false,
  createIcon,
  cancelIcon,
  loadingLabel = "Guardando…",
}: CreateCancelActionsProps) {
  const CreateIcon = createIcon ?? <Plus className="h-4 w-4 shrink-0" aria-hidden />;
  const CancelIcon = cancelIcon ?? <X className="h-4 w-4 shrink-0" aria-hidden />;

  return (
    <div
      className={fixedBarClass}
      style={{
        paddingBottom: "max(1rem, calc(1rem + env(safe-area-inset-bottom)))",
      }}
    >
      <button
        type="submit"
        disabled={loading || disabled}
        className={`${btnPrimaryFlex} w-full md:w-auto md:flex-1`}
      >
        {CreateIcon}
        {loading ? loadingLabel : createLabel}
      </button>
      <Link
        href={cancelHref}
        className={`${btnSecondaryFlex} w-full md:w-auto md:flex-1`}
      >
        {CancelIcon}
        Cancelar
      </Link>
    </div>
  );
}
