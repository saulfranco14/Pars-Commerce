import Link from "next/link";

import { storeButtonSecondary } from "@/features/sitio/constants/storeClasses";

import type { StoreEmptyStateProps } from "@/features/sitio/interfaces/storeComponents";

export function StoreEmptyState({ icon: Icon, title, description, action }: StoreEmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-(--store-radius) bg-(--store-surface) px-6 py-16 text-center ring-1 ring-(--store-hairline)">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-(--store-well)">
        <Icon className="h-6 w-6 text-(--store-ink-2)" aria-hidden />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-(--store-ink)">{title}</h2>
      <p className="mt-1 max-w-sm text-[15px] text-(--store-ink-2)">{description}</p>
      {action ? (
        <Link href={action.href} className={`${storeButtonSecondary} mt-6`}>
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
