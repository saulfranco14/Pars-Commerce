"use client";
import { useEffect } from "react";
import { FeedbackLink as Link } from "@/components/navigation/FeedbackLink";
import { ArrowRight } from "lucide-react";
import { track } from "@vercel/analytics";
import { getAcquisitionProps } from "@/lib/acquisition";
import { studioEntryHref } from "../../helpers/entry";

export function StudioEntryCta({
  location,
  plan,
  label = "Crear mi primer diseño",
}: {
  location: string;
  plan?: string;
  label?: string;
}) {
  return (
    <Link
      href={studioEntryHref(plan)}
      onClick={() => {
        try {
          track("studio_cta_click", {
            location,
            plan: plan ?? "none",
            ...getAcquisitionProps(),
          });
        } catch {
          /* Analytics must not block navigation. */
        }
      }}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      {label}
      <ArrowRight className="h-4 w-4" aria-hidden />
    </Link>
  );
}
export function StudioLandingAnalytics() {
  useEffect(() => {
    try {
      track("studio_landing_view", getAcquisitionProps());
    } catch {
      /* Best-effort attribution. */
    }
    const examples = document.getElementById("ejemplos");
    if (!examples) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          try {
            track("studio_example_view", {
              location: "landing",
              ...getAcquisitionProps(),
            });
          } catch {
            /* Best-effort attribution. */
          }
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(examples);
    return () => observer.disconnect();
  }, []);
  return null;
}
