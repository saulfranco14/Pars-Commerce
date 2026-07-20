import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Full-screen placeholder for the customer bill while its data loads. Mirrors
 * the real layout (accent hero with the big amount → products card → action
 * bar) so content replaces it in place without a jump.
 */
export function BillScreenSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
        {/* Accent hero */}
        <header className="rounded-b-[28px] bg-accent px-5 pb-6 pt-5 shadow-sm">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-20 bg-white/25" />
            <Skeleton className="h-3 w-24 bg-white/25" />
          </div>
          <div className="mt-4 flex items-center gap-2.5">
            <Skeleton className="h-10 w-10 rounded-xl bg-white/25" />
            <div className="space-y-1.5">
              <Skeleton className="h-2.5 w-16 bg-white/25" />
              <Skeleton className="h-4 w-24 bg-white/25" />
            </div>
          </div>
          <Skeleton className="mt-6 h-2.5 w-12 bg-white/25" />
          <Skeleton className="mt-2 h-10 w-44 rounded-xl bg-white/25" />
          <Skeleton className="mt-3 h-12 w-36 rounded-xl bg-white/20" />
        </header>

        <main className="flex-1 space-y-3 px-5 pb-10 pt-5">
          {/* Products card */}
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-4 w-6" />
            </div>
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3.5 w-14" />
                </div>
              ))}
            </div>
          </div>

          {/* Action bar */}
          <Skeleton className="h-[54px] w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </main>
      </div>
    </div>
  );
}
