"use client";

import { useCallback, useEffect, useState } from "react";

const COPIED_MS = 1600;

/** Copies text and says «Copiado» for a moment; falls back silently where the clipboard is blocked. */
export function useCopyText() {
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(null), COPIED_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = useCallback(async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
    } catch {
      setCopied(null);
    }
  }, []);

  return { copied, copy };
}
