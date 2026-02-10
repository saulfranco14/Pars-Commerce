"use client";

interface LoadingBlockProps {
  message?: string;
  variant?: "message" | "skeleton";
  skeletonRows?: number;
}

export function LoadingBlock({
  message = "Cargando…",
  variant = "message",
  skeletonRows = 5,
}: LoadingBlockProps) {
  if (variant === "skeleton") {
    return (
      <div
        className="overflow-hidden rounded-xl border border-border bg-surface-raised"
        role="status"
        aria-label={message}
      >
        <div className="border-b border-border-soft px-4 py-3">
          <div className="h-4 w-32 animate-loading-pulse rounded bg-border-soft" />
        </div>
        <div className="divide-y divide-border-soft">
          {Array.from({ length: skeletonRows }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="h-4 flex-1 max-w-[40%] animate-loading-pulse rounded bg-border-soft" />
              <div className="h-4 w-20 animate-loading-pulse rounded bg-border-soft" />
              <div className="h-4 w-24 animate-loading-pulse rounded bg-border-soft" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-8"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="h-1 w-16 animate-loading-pulse rounded-full bg-border" />
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}
