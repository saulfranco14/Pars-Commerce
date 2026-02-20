"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import {
  btnPrimaryFlex,
  btnSecondaryFlex,
} from "@/components/ui/buttonClasses";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const CreateIcon = createIcon ?? (
    <Plus className="h-4 w-4 shrink-0" aria-hidden />
  );
  const CancelIcon = cancelIcon ?? (
    <X className="h-4 w-4 shrink-0" aria-hidden />
  );

  return (
    <>
      {mounted &&
        createPortal(
          <div
            className="fixed bottom-0 left-0 right-0 z-40 flex flex-col gap-3 rounded-t-2xl bg-surface px-4 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden"
            style={{
              paddingBottom:
                "max(1rem, calc(1rem + env(safe-area-inset-bottom)))",
              paddingLeft: "max(1rem, env(safe-area-inset-left, 1rem))",
              paddingRight: "max(1rem, env(safe-area-inset-right, 1rem))",
            }}
          >
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
          </div>,
          document.body,
        )}

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
