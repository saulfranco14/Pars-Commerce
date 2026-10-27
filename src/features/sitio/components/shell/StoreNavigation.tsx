"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { StoreNavigationContext } from "@/features/sitio/hooks/useStoreNavigation";
import { StoreNavigationBar } from "@/features/sitio/components/shell/StoreNavigationBar";

import { internalNavigationTarget } from "@/features/sitio/helpers/navigationIntent";

import type { NavigationSettledProps, StoreNavigationProps } from "@/features/sitio/interfaces/storeNavigation";

// A navigation that never lands (offline, aborted) must not leave the bar running forever.
const SAFETY_TIMEOUT_MS = 12000;

function NavigationSettled({ onSettle }: NavigationSettledProps) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => onSettle(), [pathname, search, onSettle]);
  return null;
}

/** Gives every storefront tap instant feedback while the next page renders on the server. */
export function StoreNavigation({ children }: StoreNavigationProps) {
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const settle = useCallback(() => setPendingHref(null), []);

  useEffect(() => {
    if (!pendingHref) return;
    const timer = window.setTimeout(settle, SAFETY_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [pendingHref, settle]);

  const onClick = (event: React.MouseEvent) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as Element).closest?.("a[href]");
    if (!(anchor instanceof HTMLAnchorElement)) return;
    const opensElsewhere = (anchor.target !== "" && anchor.target !== "_self") || anchor.hasAttribute("download");
    const target = internalNavigationTarget(anchor.getAttribute("href") ?? "", window.location.href, opensElsewhere);
    if (target) setPendingHref(target);
  };

  const onSubmit = (event: React.FormEvent) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.getAttribute("action") || form.method.toLowerCase() !== "get") return;
    const url = new URL(form.action, window.location.href);
    new FormData(form).forEach((value, key) => {
      if (typeof value === "string" && value) url.searchParams.set(key, value);
    });
    const target = internalNavigationTarget(url.toString(), window.location.href, false);
    if (target) setPendingHref(target);
  };

  return (
    <StoreNavigationContext.Provider value={{ pendingHref }}>
      <div className="contents" onClick={onClick} onSubmit={onSubmit}>
        {children}
      </div>
      <Suspense fallback={null}>
        <NavigationSettled onSettle={settle} />
      </Suspense>
      <StoreNavigationBar active={pendingHref !== null} />
    </StoreNavigationContext.Provider>
  );
}
