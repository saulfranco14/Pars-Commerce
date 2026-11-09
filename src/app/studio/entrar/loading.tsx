import { Skeleton } from "@/components/ui/Skeleton";
import { StudioWordmark } from "@/features/studio/components/landing/StudioWordmark";

export default function StudioEntryLoading() {
  return (
    <main
      className="flex min-h-dvh items-center justify-center bg-background px-5 py-12"
      aria-busy="true"
    >
      <section className="w-full max-w-lg space-y-6 rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <StudioWordmark />
        <p role="status" className="text-sm text-muted-foreground">
          Preparando tu acceso a Studio…
        </p>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </section>
    </main>
  );
}
