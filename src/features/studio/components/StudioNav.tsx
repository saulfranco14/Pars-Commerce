"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStudioContext } from "./StudioProvider";
import { STUDIO_NAV } from "../constants/studio";

/** Studio's four tabs. Inside an ad, `current` marks the list it came from. */
export function StudioNav({ current }: { current?: string }) {
  const { tenantSlug } = useStudioContext(),
    pathname = usePathname(),
    base = `/dashboard/${tenantSlug}/studio`,
    on = current ?? pathname.slice(base.length);
  return (
    <nav
      aria-label="Tlaco Studio"
      className="grid grid-cols-4 gap-1 rounded-xl bg-border-soft/70 p-1"
    >
      {STUDIO_NAV.map((item) => (
        <Link
          key={item.path}
          href={`${base}${item.path}`}
          aria-current={on === item.path ? "page" : undefined}
          className={`inline-flex min-h-10 min-w-0 items-center justify-center truncate rounded-lg px-1 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-accent ${on === item.path ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
