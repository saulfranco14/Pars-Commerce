"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { StudioCreatingScreenProps } from "../interfaces/ui";

/** Shown in the same tap as Crear and kept until the AI wait takes over, so there is one dark screen. */
export function StudioCreatingScreen({ name }: StudioCreatingScreenProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
  if (!mounted) return null;
  return createPortal(
    <div
      role="status"
      aria-label="Preparando tu anuncio"
      className="fixed inset-0 z-70 flex flex-col items-center justify-center gap-4 bg-[radial-gradient(120%_70%_at_50%_30%,#1d2a48_0%,#0b1020_70%)] px-[6vw] text-white"
    >
      <p className="studio-ai-text text-center text-lg font-bold">
        Preparando tu anuncio…
      </p>
      <span
        className="studio-skeleton-dark block aspect-4/5 w-full max-w-md rounded-2xl"
        style={{ maxHeight: "62vh", width: "min(100%, calc(62vh * 0.8))" }}
        aria-hidden
      />
      <p className="truncate text-sm text-white/65">{name}</p>
    </div>,
    document.body,
  );
}
