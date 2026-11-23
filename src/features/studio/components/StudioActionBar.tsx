"use client";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import type { StudioActionBarProps } from "../interfaces/ui";

/** Phones: the shared floating action bar. Desktop: the same actions closing the page. Pair with `STUDIO_ACTION_BAR_SPACE`. */
export function StudioActionBar({ status, children }: StudioActionBarProps) {
  const note = status ? (
    <p className="text-xs text-muted-foreground" role="status">
      {status}
    </p>
  ) : null;
  return (
    <>
      <MobileActionBar className="md:hidden" contentClassName="space-y-2">
        {note}
        {children}
      </MobileActionBar>
      <div className="hidden items-center justify-between gap-3 border-t border-border pt-4 md:flex">
        {note ?? <span />}
        {children}
      </div>
    </>
  );
}
