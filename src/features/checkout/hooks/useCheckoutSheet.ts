import { useCallback, useEffect, useState } from "react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

const SHEET_TRANSITION_MS = 250;

export function useCheckoutSheet() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const close = useCallback(() => {
    setVisible(false);
    setTimeout(() => setMounted(false), SHEET_TRANSITION_MS);
  }, []);

  const open = useCallback(() => {
    setMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  }, []);

  useBodyScrollLock(mounted);
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [mounted, close]);

  return { mounted, visible, open, close };
}
