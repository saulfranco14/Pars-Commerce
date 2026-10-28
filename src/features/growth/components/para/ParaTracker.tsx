"use client";

import { useEffect } from "react";

import { rememberProspect, sendParaEvent } from "@/features/growth/services/paraClient";

/** Counts real visits from the browser only: link-preview crawlers don't run JS. */
export function ParaTracker({ token }: { token: string }) {
  useEffect(() => {
    const startedAt = Date.now();
    let reported = false;
    rememberProspect(token);
    sendParaEvent(token, "para_viewed");

    const report = () => {
      if (reported) return;
      reported = true;
      sendParaEvent(token, "para_seconds", (Date.now() - startedAt) / 1000);
    };
    const onHidden = () => {
      if (document.visibilityState === "hidden") report();
    };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", report);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", report);
    };
  }, [token]);

  return null;
}
