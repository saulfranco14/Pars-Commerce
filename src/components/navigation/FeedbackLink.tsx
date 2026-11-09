"use client";

import Link, { useLinkStatus } from "next/link";
import { LoaderCircle } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

function LinkContent({ children }: { children: ReactNode }) {
  const { pending } = useLinkStatus();
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ gap: "inherit" }}
      aria-busy={pending}
    >
      <span
        className={`inline-flex items-center ${pending ? "opacity-0" : "opacity-100"}`}
        style={{ gap: "inherit" }}
      >
        {children}
      </span>
      {pending && (
        <span
          className="absolute inset-0 flex items-center justify-center"
          role="status"
        >
          <LoaderCircle
            className="h-4 w-4 animate-spin motion-reduce:animate-none"
            aria-hidden
          />
          <span className="sr-only">Abriendo página…</span>
        </span>
      )}
    </span>
  );
}

/** Uses Next's actual navigation status; anchors and modified clicks keep Link semantics. */
export function FeedbackLink({
  children,
  className = "",
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={`transition-[background-color,color,transform] active:scale-[.98] motion-reduce:transform-none motion-reduce:transition-none ${className}`}
    >
      <LinkContent>{children}</LinkContent>
    </Link>
  );
}
