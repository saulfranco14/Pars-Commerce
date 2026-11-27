"use client";
import { useSyncExternalStore } from "react";

/**
 * The ad being created right now, from the tap on Crear until its own screen
 * takes over; it keeps one dark screen across the page change.
 */
let creating: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export function startStudioCreating(name: string) {
  creating = name;
  emit();
}

export function endStudioCreating() {
  if (creating === null) return;
  creating = null;
  emit();
}

export function useStudioCreating(): string | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => creating,
    () => null,
  );
}
