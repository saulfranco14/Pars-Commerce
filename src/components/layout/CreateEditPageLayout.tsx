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
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}

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
  onSubmit,
  children,
}: CreateEditPageLayoutProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <div className="mx-auto w-full max-w-2xl flex-1 flex flex-col px-1 md:px-0">
        <CreateEditHeader title={title} backHref={backHref} />
        <p className="mb-4 text-sm leading-relaxed text-muted">{description}</p>

        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col gap-0 pb-40"
        >
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 alert-error">
              {error}
            </div>
          )}
          {children}
          <div className="mt-6 flex flex-col gap-3 pt-6 md:flex-row md:gap-3">
            <CreateCancelActions
              createLabel={createLabel}
              cancelHref={cancelHref}
              loading={loading}
              loadingLabel={loadingLabel}
              createIcon={createIcon}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
