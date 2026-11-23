"use client";
import Image from "next/image";
import { ChevronRight, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { STUDIO_SOURCES } from "../constants/studio";
import type { StudioIdeasProps } from "../interfaces/ui";

export function StudioIdeas({
  ideas,
  loading,
  starting,
  disabled,
  onStart,
}: StudioIdeasProps) {
  if (!loading && !ideas.length) return null;
  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <div>
        <h2 className="text-sm font-bold">Ideas listas para ti</h2>
        <p className="text-xs text-muted-foreground">
          Un toque y te damos el anuncio hecho con tus datos.
        </p>
      </div>
      {loading ? (
        <div
          className="grid grid-cols-1 gap-2 sm:grid-cols-3"
          aria-label="Buscando ideas"
        >
          <Skeleton className="h-18 rounded-xl" />
          <Skeleton className="h-18 rounded-xl" />
          <Skeleton className="h-18 rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {ideas.map((idea) => {
            const Icon =
              STUDIO_SOURCES.find((s) => s.value === idea.sourceType)?.icon ??
              STUDIO_SOURCES[0].icon;
            return (
              <button
                key={idea.key}
                type="button"
                disabled={disabled}
                onClick={() => onStart(idea)}
                className="flex min-h-18 w-full min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left transition-colors hover:border-accent/50 hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-accent/10 text-accent">
                  {idea.imageUrl ? (
                    <Image
                      src={idea.imageUrl}
                      alt=""
                      fill
                      unoptimized
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <Icon className="h-5 w-5" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">
                    {idea.title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {idea.detail}
                  </span>
                </span>
                {starting === idea.key ? (
                  <Loader2
                    className="h-4 w-4 shrink-0 animate-spin text-accent"
                    aria-label="Preparando"
                  />
                ) : (
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
