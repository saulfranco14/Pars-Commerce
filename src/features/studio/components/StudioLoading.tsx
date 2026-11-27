"use client";
import { useStudioCreating } from "../hooks/useStudioCreating";
import { Skeleton } from "@/components/ui/Skeleton";
import { StudioCreatingScreen } from "./StudioCreatingScreen";

export function StudioLoading() {
  const creating = useStudioCreating();
  if (creating) return <StudioCreatingScreen name={creating} />;
  return (
    <div aria-label="Cargando Studio" className="space-y-5">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-5 w-72 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((n) => (
          <Skeleton key={n} className="h-32 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}
