"use client";

import Link from "next/link";
import { Plus, X } from "lucide-react";
import {
  btnPrimaryFlex,
  btnSecondaryFlex,
} from "@/components/ui/buttonClasses";
import { MobileActionBar } from "@/components/layout/MobileActionBar";

interface CreateCancelActionsProps {
  createLabel: string;
  cancelHref: string;
  loading?: boolean;
  disabled?: boolean;
  createIcon?: React.ReactNode;
  cancelIcon?: React.ReactNode;
  loadingLabel?: string;
  formId?: string;
}

export function CreateCancelActions({
  createLabel,
  cancelHref,
  loading = false,
  disabled = false,
  createIcon,
  cancelIcon,
  loadingLabel = "Guardando…",
  formId,
}: CreateCancelActionsProps) {
  const CreateIcon = createIcon ?? (
    <Plus className="h-4 w-4 shrink-0" aria-hidden />
  );
  const CancelIcon = cancelIcon ?? (
    <X className="h-4 w-4 shrink-0" aria-hidden />
  );

  return (
    <>
      <MobileActionBar className="md:hidden" contentClassName="flex flex-col gap-3">
            <button
              type="submit"
              form={formId}
              disabled={loading || disabled}
              className={`${btnPrimaryFlex} w-full`}
            >
              {CreateIcon}
              {loading ? loadingLabel : createLabel}
            </button>
            <Link href={cancelHref} className={`${btnSecondaryFlex} w-full`}>
              {CancelIcon}
              Cancelar
            </Link>
      </MobileActionBar>

      <div className="hidden md:flex md:flex-row-reverse md:items-center md:gap-3 md:px-6 md:pb-6">
        <button
          type="submit"
          disabled={loading || disabled}
          className={`${btnPrimaryFlex} md:w-auto md:flex-none`}
        >
          {CreateIcon}
          {loading ? loadingLabel : createLabel}
        </button>
        <Link
          href={cancelHref}
          className={`${btnSecondaryFlex} md:w-auto md:flex-none`}
        >
          {CancelIcon}
          Cancelar
        </Link>
      </div>
    </>
  );
}
