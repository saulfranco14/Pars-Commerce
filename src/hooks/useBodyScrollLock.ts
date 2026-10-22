"use client";

import { useEffect } from "react";

import { lockBodyScroll } from "@/lib/bodyScrollLock";

/** Keeps the page from scrolling behind an open sheet or dialog. */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => (active ? lockBodyScroll() : undefined), [active]);
}
