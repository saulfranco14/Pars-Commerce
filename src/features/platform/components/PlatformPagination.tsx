import { ChevronLeft, ChevronRight } from "lucide-react";

export function PlatformPagination({
  page,
  totalPages,
  total,
  itemLabel,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  itemLabel: string;
  onChange: (page: number) => void;
}) {
  return (
    <footer className="flex flex-col gap-3 border-t border-border-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {total} {itemLabel} · Página {page} de {totalPages}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Anterior
        </button>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </footer>
  );
}
