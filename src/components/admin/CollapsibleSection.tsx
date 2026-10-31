"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface CollapsibleSectionProps {
  title: ReactNode;
  /** One line under the title saying what the block is for. */
  description?: ReactNode;
  icon?: LucideIcon;
  /** Short status on the right of the header (a count or a badge); never a control. */
  aside?: ReactNode;
  defaultOpen?: boolean;
  /** Phones start with this instead of `defaultOpen`, so long screens stay scannable. */
  defaultOpenOnMobile?: boolean;
  /** Controlled mode, for callers that remember the state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  tone?: "default" | "accent";
  children: ReactNode;
}

const MOBILE_QUERY = "(max-width: 1023px)";

/** A titled block that opens and closes; the header always says what is inside. */
export function CollapsibleSection({
  title,
  description,
  icon: Icon,
  aside,
  defaultOpen = true,
  defaultOpenOnMobile,
  open: controlledOpen,
  onOpenChange,
  tone = "default",
  children,
}: CollapsibleSectionProps) {
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const bodyId = useId();
  const open = controlledOpen ?? ownOpen;

  useEffect(() => {
    if (defaultOpenOnMobile !== undefined && window.matchMedia(MOBILE_QUERY).matches) setOwnOpen(defaultOpenOnMobile);
  }, [defaultOpenOnMobile]);

  function toggle() {
    setOwnOpen(!open);
    onOpenChange?.(!open);
  }

  return (
    <section className={`rounded-2xl border ${tone === "accent" ? "border-accent/30 bg-accent/5" : "border-border bg-surface"}`}>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={toggle}
          className="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-border-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 sm:px-5"
        >
          {Icon ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Icon className="h-4.5 w-4.5" aria-hidden />
            </span>
          ) : null}
          <span className="grid min-w-0 flex-1 gap-0.5">
            <span className="text-base font-bold tracking-tight text-foreground">{title}</span>
            {description ? <span className="text-xs leading-snug text-muted-foreground sm:text-sm">{description}</span> : null}
          </span>
          {aside ? <span className="inline-flex shrink-0">{aside}</span> : null}
          <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </h3>
      <div id={bodyId} hidden={!open} className="border-t border-border-soft px-4 pt-4 pb-4 sm:px-5 sm:pb-5">
        {children}
      </div>
    </section>
  );
}
