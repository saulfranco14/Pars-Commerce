import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Placeholder for the "Tu pedido" tracker while its detail loads (the bill read
 * is async on return-to-screen). Prevents the layout jump where the menu paints
 * instantly and the order card pops in a beat later. Matches the real card's
 * shape (header row, stepper, two item rows) so the swap is seamless.
 */
export function OrderTrackerSkeleton() {
  return (
    <section
      className="rounded-2xl border border-border bg-surface p-4 shadow-sm"
      aria-hidden
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Stepper placeholder */}
      <div className="mt-4 flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-1 items-center gap-2">
            <Skeleton className="h-8 w-8 shrink-0" />
            {i < 2 && <Skeleton className="h-0.5 flex-1" />}
          </div>
        ))}
      </div>

      {/* Item rows placeholder */}
      <div className="mt-4 space-y-3 border-t border-border-soft pt-3">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3.5 w-14" />
          </div>
        ))}
      </div>
    </section>
  );
}
