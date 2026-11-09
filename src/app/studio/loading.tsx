import { Skeleton } from "@/components/ui/Skeleton";
import { StudioWordmark } from "@/features/studio/components/landing/StudioWordmark";

export default function StudioLoading() {
  return (
    <div className="min-h-dvh bg-background px-5 py-6" aria-busy="true">
      <div className="mx-auto max-w-6xl">
        <StudioWordmark />
      </div>
      <p className="sr-only" role="status">
        Cargando Tlaco Studio…
      </p>
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 py-20">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-14 w-full max-w-2xl" />
        <Skeleton className="h-14 w-3/4" />
        <Skeleton className="mt-3 h-5 w-2/3" />
        <Skeleton className="h-12 w-52 rounded-xl" />
        <Skeleton className="mt-12 h-80 w-full rounded-2xl" />
      </div>
    </div>
  );
}
