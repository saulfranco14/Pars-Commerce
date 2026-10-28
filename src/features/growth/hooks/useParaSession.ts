"use client";

import { useEffect } from "react";

import { rememberProspect, sendParaEvent } from "@/features/growth/services/paraClient";

import type { ParaAction, ParaSection } from "@/features/growth/interfaces/para";

/** One «Para ti» visit: blocks seen, buttons and products tapped (data-para-* attributes), reported on leaving. */
export function useParaSession(token: string): void {
  useEffect(() => {
    const startedAt = Date.now();
    const sections = new Set<ParaSection>();
    const actions = new Set<ParaAction>();
    const items = new Set<string>();
    let lastReport = "";

    rememberProspect(token);
    sendParaEvent(token, "para_viewed");

    // A new report only when something changed, so coming back to the tab and leaving again stays quiet.
    const report = () => {
      const payload = { sections: [...sections], actions: [...actions], items: [...items] };
      const snapshot = JSON.stringify(payload);
      if (snapshot === lastReport) return;
      lastReport = snapshot;
      sendParaEvent(token, "para_left", { seconds: (Date.now() - startedAt) / 1000, payload });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          sections.add((entry.target as HTMLElement).dataset.paraSection as ParaSection);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "-25% 0px -25% 0px" },
    );
    document.querySelectorAll("[data-para-section]").forEach((element) => observer.observe(element));

    const onClick = (event: MouseEvent) => {
      const action = (event.target as Element | null)?.closest<HTMLElement>("[data-para-action]")?.dataset.paraAction as ParaAction | undefined;
      if (!action) return;
      actions.add(action);
      const [kind, placement] = action.split(":");
      if (kind === "claim" || kind === "help") sendParaEvent(token, kind === "claim" ? "claim_clicked" : "help_clicked", { payload: { placement } });
    };
    // Product cards are not links, and iOS only sends click to elements that are.
    const onPointerUp = (event: PointerEvent) => {
      const item = (event.target as Element | null)?.closest<HTMLElement>("[data-para-item]")?.dataset.paraItem;
      if (item) items.add(item);
    };
    const onHidden = () => {
      if (document.visibilityState === "hidden") report();
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", report);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", report);
      // «Activar» is a client-side navigation: no pagehide, only this unmount. Skip dev's strict-mode remount.
      if (Date.now() - startedAt > 1000) report();
    };
  }, [token]);
}
