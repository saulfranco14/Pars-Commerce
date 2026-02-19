"use client";

import Link from "next/link";

interface FABProps {
  href?: string;
  onClick?: () => void;
  "aria-label": string;
  children: React.ReactNode;
  className?: string;
}

export function FAB({
  href,
  onClick,
  "aria-label": ariaLabel,
  children,
  className = "",
}: FABProps) {
  const baseClass =
    "fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 md:hidden";
  const style = {
    bottom: "max(5.5rem, calc(5.5rem + env(safe-area-inset-bottom)))",
  };

  if (href) {
    return (
      <Link
        href={href}
        className={`${baseClass} ${className}`}
        style={style}
        aria-label={ariaLabel}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClass} ${className}`}
      style={style}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
