"use client";
import { useEffect, useRef } from "react";
import { trackStudioEvent } from "../services/studioAnalyticsClient";
import type { StudioSummary } from "../interfaces/studio";

export function useStudioTelemetry(
  tenantId: string,
  summary: StudioSummary | undefined,
): void {
  const entered = useRef<string | null>(null),
    previous = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (!summary) return;
    const query = new URLSearchParams(window.location.search);
    if (entered.current !== tenantId) {
      entered.current = tenantId;
      trackStudioEvent("studio_entry_resolved", {
        active: summary.active,
        plan: query.get("studio_plan") ?? "none",
      });
    }
    if (
      summary.active &&
      (previous.current === false || query.get("payment") === "pending")
    ) {
      const key = `studio:activation:${tenantId}:${summary.membership?.current_period_end}`;
      try {
        if (!sessionStorage.getItem(key)) {
          trackStudioEvent("studio_membership_activated", {
            plan: summary.membership?.plan_code ?? "none",
          });
          sessionStorage.setItem(key, "1");
        }
      } catch {
        /* The verified membership still works without browser storage. */
      }
    }
    previous.current = summary.active;
  }, [summary, tenantId]);
}
