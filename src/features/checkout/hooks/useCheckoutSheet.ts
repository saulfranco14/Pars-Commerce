import { useCallback, useEffect, useState } from "react";

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

  useEffect(() => {
    if (!mounted) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [mounted, close]);

  return { mounted, visible, open, close };
}
