import type { StoreHighlight } from "@/features/sitio/interfaces/storeHome";

// One row that always fills the width, whatever the business configured.
const HIGHLIGHT_COLUMNS: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

export function StoreHighlights({ items }: { items: StoreHighlight[] }) {
  return (
    <ul
      className={`grid divide-y divide-(--store-hairline) overflow-hidden rounded-2xl bg-(--store-surface) shadow-sm ring-1 ring-(--store-hairline) sm:gap-4 sm:divide-y-0 sm:overflow-visible sm:rounded-none sm:bg-transparent sm:shadow-none sm:ring-0 ${
        HIGHLIGHT_COLUMNS[Math.min(items.length, 4)]
      }`}
    >
      {items.map(({ id, icon: Icon, title, detail }) => (
        <li
          key={id}
          className="flex items-center gap-3 px-4 py-3.5 sm:rounded-2xl sm:bg-(--store-surface) sm:p-5 sm:shadow-sm sm:ring-1 sm:ring-(--store-hairline)"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-bold leading-tight text-(--store-ink)">{title}</span>
            <span className="mt-0.5 block text-[13px] leading-snug text-(--store-ink-2)">{detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
