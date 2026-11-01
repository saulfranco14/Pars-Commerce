"use client";

import { useEffect, useState } from "react";

import { TlacoMascot } from "@/components/brand/TlacoMascot";

import { mexicoDayKey } from "@/features/growth/helpers/leadPipeline";

import type { TlacoAiFabProps } from "@/features/growth/interfaces/tlacoAi";

const TEASE_KEY = "tlaco_ai_tease";
const TEASE_MS = 4000;

/** Tlaco IA floating at the bottom right, like a store's assistant: one tap opens its sheet. */
export function TlacoAiFab({ visible, teaser, onOpen }: TlacoAiFabProps) {
  const [teasing, setTeasing] = useState(false);

  useEffect(() => {
    if (!visible) {
      setTeasing(false);
      return;
    }
    const today = mexicoDayKey(new Date());
    try {
      if (window.localStorage.getItem(TEASE_KEY) === today) return;
      window.localStorage.setItem(TEASE_KEY, today);
    } catch {
      // Without storage it may greet again next time; harmless.
    }
    setTeasing(true);
    const timer = window.setTimeout(() => setTeasing(false), TEASE_MS);
    return () => window.clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;
  return (
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex items-end gap-2 md:bottom-6 md:right-6">
      {teasing ? (
        <span role="status" className="page-enter mb-2 max-w-52 rounded-2xl rounded-br-sm bg-foreground px-3 py-2 text-[13px] font-semibold text-background shadow-lg">
          {teaser}
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => {
          setTeasing(false);
          onOpen();
        }}
        aria-label="Preguntarle a Tlaco IA"
        className="tlaco-fab relative grid h-15 w-15 shrink-0 cursor-pointer place-items-center rounded-full border border-accent/30 bg-linear-to-br from-surface to-accent/15 shadow-xl shadow-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        <TlacoMascot size={44} className="tlaco-fab-mascot" />
      </button>
    </div>
  );
}
