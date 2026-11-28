"use client";
import { useEffect, useState } from "react";
import { STUDIO_SEEN_KEY } from "../constants/studio";

const SEEN_EVENT = "tlaco:studio-seen";

/** Remembers on this device that the person already opened Studio. */
export function markStudioSeen() {
  try {
    localStorage.setItem(STUDIO_SEEN_KEY, "1");
  } catch {
    /* storage blocked */
  }
  window.dispatchEvent(new Event(SEEN_EVENT));
}

/** False until the person opens Studio on this device; the menu marks it «Nuevo». */
export function useStudioSeen(): boolean {
  const [seen, setSeen] = useState(true);
  useEffect(() => {
    const read = () => {
      try {
        setSeen(Boolean(localStorage.getItem(STUDIO_SEEN_KEY)));
      } catch {
        setSeen(true);
      }
    };
    read();
    window.addEventListener(SEEN_EVENT, read);
    return () => window.removeEventListener(SEEN_EVENT, read);
  }, []);
  return seen;
}
