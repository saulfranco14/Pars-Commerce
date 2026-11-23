"use client";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import {
  STUDIO_GENERATING_STEPS,
  STUDIO_IMAGE_SECONDS,
} from "../../constants/studio";

/** What Gemini is doing, step by step, while the person waits for the image. */
export function StudioGeneratingOverlay() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = Date.now(),
      timer = setInterval(() => setElapsed((Date.now() - started) / 1000), 400);
    return () => clearInterval(timer);
  }, []);
  const step = Math.min(
      STUDIO_GENERATING_STEPS.length - 1,
      Math.floor(
        (elapsed / STUDIO_IMAGE_SECONDS) * STUDIO_GENERATING_STEPS.length,
      ),
    ),
    progress = Math.min(92, (elapsed / STUDIO_IMAGE_SECONDS) * 85 + 5);
  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-0 overflow-hidden rounded-2xl"
    >
      <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-md" />
      <div className="studio-generating absolute inset-0 opacity-70 mix-blend-screen" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center text-white">
        <span className="studio-pulse flex h-14 w-14 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/40">
          <Sparkles className="h-7 w-7" aria-hidden />
        </span>
        <p className="text-base font-bold drop-shadow">
          {STUDIO_GENERATING_STEPS[step]}…
        </p>
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-white transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-white/85">
          Tarda unos {STUDIO_IMAGE_SECONDS} segundos
        </p>
      </div>
    </div>
  );
}
