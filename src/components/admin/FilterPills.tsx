"use client";

export interface FilterPill<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface FilterPillsProps<T extends string> {
  filters: FilterPill<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}

export function FilterPills<T extends string>({
  filters,
  value,
  onChange,
  ariaLabel,
}: FilterPillsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex flex-wrap gap-2"
    >
      {filters.map((f) => {
        const isActive = f.value === value;
        return (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(f.value)}
            className={`inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-accent text-accent-foreground shadow-sm shadow-accent/20"
                : "border border-border bg-surface text-foreground hover:bg-border-soft/40"
            }`}
          >
            {f.label}
            {typeof f.count === "number" && (
              <span
                className={`rounded-full px-1.5 text-xs font-bold ${
                  isActive
                    ? "bg-accent-foreground/20"
                    : "bg-border-soft text-muted-foreground"
                }`}
              >
                {f.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
