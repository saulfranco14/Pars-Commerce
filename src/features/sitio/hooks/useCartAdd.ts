"use client";

import { useEffect, useRef, useState } from "react";

import { useFingerprint } from "@/hooks/useFingerprint";
import { dispatchCartUpdated } from "@/lib/cartEvents";

export type CartAddStatus = "idle" | "adding" | "added" | "error";

const ADDED_FEEDBACK_MS = 1800;

/** Shared add-to-cart state machine for product and promotion cards. */
export function useCartAdd({
  add,
  successLabel,
}: {
  add: (fingerprint: string) => Promise<unknown>;
  successLabel: string;
}) {
  const fingerprint = useFingerprint();
  const [status, setStatus] = useState<CartAddStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
  }, []);

  const trigger = async () => {
    if (!fingerprint || status === "adding") return;
    setStatus("adding");
    setErrorMessage(null);
    try {
      await add(fingerprint);
      dispatchCartUpdated({ label: successLabel });
      setStatus("added");
    } catch (cause) {
      setErrorMessage(cause instanceof Error ? cause.message : null);
      setStatus("error");
    }
    resetTimer.current = window.setTimeout(() => setStatus("idle"), ADDED_FEEDBACK_MS);
  };

  return { status, trigger, ready: Boolean(fingerprint), errorMessage };
}
