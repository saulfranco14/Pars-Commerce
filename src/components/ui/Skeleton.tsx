/**
 * Shared loading-placeholder primitive. One pulsing block; compose several to
 * mirror the real component's shape so the content swap doesn't jump.
 *
 * Usage: <Skeleton className="h-4 w-24" /> — size/radius via className.
 * Default is a soft rounded bar on the neutral token; on accent surfaces pass
 * a bg override (e.g. `bg-white/25`).
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block animate-pulse rounded-full bg-border-soft ${className}`}
    />
  );
}
