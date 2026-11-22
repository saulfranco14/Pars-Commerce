"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { trackHomeEvent } from "@/features/landing/helpers/trackHomeEvent";

/** The one primary action on the home page; `location` tells the funnel which block converted. */
export function HomeCta({
  location,
  href = "/registro",
  label = "Crear mi cuenta gratis",
}: {
  location: string;
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      onClick={() => trackHomeEvent("home_cta_click", { location })}
      className="group inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-8 text-base font-semibold text-white transition-colors hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
    >
      {label}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}
