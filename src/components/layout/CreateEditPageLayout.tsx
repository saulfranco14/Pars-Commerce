"use client";

import { CreateEditHeader } from "@/components/layout/CreateEditHeader";
import { CreateCancelActions } from "@/components/layout/CreateCancelActions";

interface CreateEditPageLayoutProps {
  title: string;
  backHref: string;
  description: React.ReactNode;
  cancelHref: string;
  createLabel: string;
  loading?: boolean;
  loadingLabel?: string;
  createIcon?: React.ReactNode;
  error?: React.ReactNode;
  maxWidth?: "default" | "wide";
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}

const maxWidthClass = {
  default: "max-w-2xl",
  wide: "max-w-4xl",
};

export function CreateEditPageLayout({
  title,
  backHref,
  description,
  cancelHref,
  createLabel,
  loading = false,
  loadingLabel = "Guardando…",
  createIcon,
  error,
  maxWidth = "default",
  onSubmit,
  children,
}: CreateEditPageLayoutProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <div
        className={`mx-auto w-full flex-1 flex flex-col px-1 md:px-0 mb-4 ${maxWidthClass[maxWidth]}`}
      >
        <CreateEditHeader title={title} backHref={backHref} />
        <p className="mb-4 text-sm leading-relaxed text-muted">{description}</p>

        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col gap-0 pb-40 md:pb-0"
        >
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 alert-error">
              {error}
            </div>
          )}
          <div className="overflow-hidden rounded-xl bg-surface shadow-md">
            {children}
            <div className="flex flex-col gap-3 px-4 pb-4 pt-6 md:flex-row md:items-center md:justify-end md:gap-3 md:px-6 md:pb-6">
              <CreateCancelActions
                createLabel={createLabel}
                cancelHref={cancelHref}
                loading={loading}
                loadingLabel={loadingLabel}
                createIcon={createIcon}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
