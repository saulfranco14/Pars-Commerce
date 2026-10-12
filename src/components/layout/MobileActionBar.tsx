"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

type MobileActionBarProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

/**
 * The one mobile action boundary for Tlaco.
 *
 * It is portaled to `body` so transformed page shells cannot trap `fixed`
 * positioning. Every screen using it gets the same safe-area, elevation and
 * top radius; each page must reserve matching bottom space for its content.
 */
export function MobileActionBar({
  children,
  className = "",
  contentClassName = "",
}: MobileActionBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-x-0 bottom-0 z-20 rounded-t-[28px] border-x border-t border-border bg-white px-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-12px_32px_rgba(15,23,42,0.14)] sm:left-1/2 sm:right-auto sm:w-[min(42rem,calc(100%-3rem))] sm:-translate-x-1/2 ${className}`}
    >
      <div className={`mx-auto w-full max-w-4xl ${contentClassName}`}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
