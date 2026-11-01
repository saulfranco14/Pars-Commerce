import { useEffect, useState } from "react";

const STORAGE_KEY = "tlaco_growth_guide_seen";

/** The guide opens by itself the first time only: it counts as seen as soon as it shows, not when closed. */
export function useGuideOnce(): [boolean, (open: boolean) => void] {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Private mode: better to stay closed than to open on every visit.
      return;
    }
    setOpen(true);
  }, []);

  return [open, setOpen];
}
