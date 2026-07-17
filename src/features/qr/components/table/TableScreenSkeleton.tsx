import { Skeleton } from "@/components/ui/Skeleton";
import { OrderTrackerSkeleton } from "@/features/qr/components/order-tracker/OrderTrackerSkeleton";

/**
 * Full-screen placeholder for the mesa screen while `/api/qr/resolve` runs.
 * Mirrors the real layout (accent header → tracker card → search → product
 * cards) so the loaded screen replaces it in place with no jump — a skeleton
 * screen instead of a spinner (better perceived performance).
 */
export function TableScreenSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
        {/* Accent header — real brand color from the first frame */}
        <header className="rounded-b-[28px] bg-accent px-5 pb-6 pt-5 shadow-sm">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24 bg-white/25" />
            <Skeleton className="h-6 w-20 bg-white/25" />
          </div>
          <div className="mt-4 flex items-center gap-2.5">
            <Skeleton className="h-10 w-10 rounded-xl bg-white/25" />
            <div className="space-y-1.5">
              <Skeleton className="h-2.5 w-14 bg-white/25" />
              <Skeleton className="h-4 w-24 bg-white/25" />
            </div>
          </div>
          <Skeleton className="mt-6 h-3 w-28 bg-white/25" />
          <Skeleton className="mt-2.5 h-8 w-52 rounded-xl bg-white/25" />
        </header>

        <main className="flex-1 space-y-4 px-5 pb-10 pt-5">
          <OrderTrackerSkeleton />
          {/* Search bar */}
          <Skeleton className="h-12 w-full rounded-2xl" />
          {/* Product cards */}
          {[0, 1, 2].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </main>
      </div>
    </div>
  );
}

/** Mirrors MenuProductCard's shape (photo left, text right). */
function ProductCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-surface p-2.5 shadow-sm">
      <Skeleton className="h-24 w-24 shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col py-1">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="mt-2 h-3 w-1/2" />
        <Skeleton className="mt-auto h-4 w-16" />
      </div>
    </div>
  );
}
