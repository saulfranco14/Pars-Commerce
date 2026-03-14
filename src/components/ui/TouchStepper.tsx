"use client";

interface TouchStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  compact?: boolean;
}

export function TouchStepper({
  value,
  onChange,
  min = 1,
  max = 999,
  disabled = false,
  compact = false,
}: TouchStepperProps) {
  const handleDecrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  const btnClass = `flex shrink-0 items-center justify-center rounded-xl border border-border bg-surface-raised text-foreground transition-colors hover:bg-border-soft disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
    compact
      ? "h-9 w-9 text-sm"
      : "min-h-(--touch-target,44px) min-w-(--touch-target,44px)"
  }`;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className={btnClass}
        aria-label="Disminuir cantidad"
      >
        −
      </button>
      <span
        className={`text-center font-semibold tabular-nums ${compact ? "min-w-7 text-sm" : "min-w-10 text-base"}`}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className={btnClass}
        aria-label="Aumentar cantidad"
      >
        +
      </button>
    </div>
  );
}
