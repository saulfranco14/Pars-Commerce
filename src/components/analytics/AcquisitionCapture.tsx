"use client";

import { useEffect } from "react";

import { captureAcquisition } from "@/lib/acquisition";

/** Runs once per page load so any entry page (home, /soluciones/*) records the campaign. */
export function AcquisitionCapture() {
  useEffect(() => {
    captureAcquisition();
  }, []);
  return null;
}
