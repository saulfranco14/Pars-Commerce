"use client";

export interface FilterTabItem {
  value: string;
  label: string;
}

interface FilterTabsProps {
  tabs: readonly FilterTabItem[];
  activeValue: string;
  onTabChange: (value: string) => void;
  ariaLabel: string;
  /** `touch` keeps 44px on wide screens too; `default` shrinks from `md`. */
  density?: "default" | "touch";
  disabled?: boolean;
}

export function FilterTabs({
  tabs,
  activeValue,
  onTabChange,
  ariaLabel,
  density = "default",
  disabled = false,
}: FilterTabsProps) {
  return (
    <div className="relative">
      <div
        className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide"
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => {
          const isActive = activeValue === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={disabled}
              onClick={() => onTabChange(tab.value)}
              className={`inline-flex shrink-0 min-h-(--touch-target,44px) items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-55 ${
                density === "default" ? "md:min-h-0 md:py-1.5 md:px-3" : ""
              } ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-border-soft hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
