"use client";

export interface FilterTabItem {
  value: string;
  label: string;
}

interface FilterTabsProps {
  tabs: FilterTabItem[];
  activeValue: string;
  onTabChange: (value: string) => void;
  ariaLabel: string;
}

export function FilterTabs({
  tabs,
  activeValue,
  onTabChange,
  ariaLabel,
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
              onClick={() => onTabChange(tab.value)}
              className={`inline-flex shrink-0 min-h-(--touch-target,44px) items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/30 md:min-h-0 md:py-1.5 md:px-3 ${
                isActive
                  ? "bg-foreground text-background"
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
