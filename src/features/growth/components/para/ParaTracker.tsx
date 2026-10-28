"use client";

import { useParaSession } from "@/features/growth/hooks/useParaSession";

/** Counts real visits from the browser only: link-preview crawlers don't run JS. */
export function ParaTracker({ token }: { token: string }) {
  useParaSession(token);
  return null;
}
