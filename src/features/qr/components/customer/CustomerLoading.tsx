"use client";

interface CustomerLoadingProps {
  message?: string;
}

/**
 * Branded full-screen loading state for customer QR screens. A soft pulsing
 * accent orb with concentric rings — friendlier than a bare "Cargando..."
 * line, and consistent across every /q screen while data resolves.
 */
export function CustomerLoading({
  message = "Cargando...",
}: CustomerLoadingProps) {
  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-6"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-accent/20" />
        <span className="absolute inset-2 animate-pulse rounded-full bg-accent/30" />
        <span className="relative h-6 w-6 rounded-full bg-accent" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </main>
  );
}
