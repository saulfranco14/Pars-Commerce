interface PhoneFrameProps {
  children: React.ReactNode;
  /** Bumped on every step change to replay the fade-in of the screen content. */
  screenKey: string;
}

/**
 * Device chrome for the landing demo. Fixed aspect so the screen never jumps
 * height between steps (a jumping frame reads as a bug, not as an animation).
 */
export function PhoneFrame({ children, screenKey }: PhoneFrameProps) {
  return (
    <div className="mx-auto w-full max-w-[260px] sm:max-w-[280px]">
      <div className="rounded-[2.25rem] border border-border bg-surface-raised p-2 shadow-card">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-surface">
          <span
            className="absolute left-1/2 top-2 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-foreground/15"
            aria-hidden
          />
          <div key={screenKey} className="animate-fade-in-up h-[420px] pt-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
