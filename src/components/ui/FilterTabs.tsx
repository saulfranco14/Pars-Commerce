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
        className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 from-background to-transparent"
        aria-hidden
      />
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
              className={`inline-flex shrink-0 items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 ${
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
