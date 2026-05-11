"use client";

import { useMemo, useState } from "react";

import type { SplitMode } from "@/features/qr/interfaces/splitBill";

export function useSplitBill() {
  const [mode, setMode] = useState<SplitMode>("by_device");
  const [peopleCount, setPeopleCount] = useState(2);

  const canSubmit = useMemo(() => {
    if (mode === "equal") return peopleCount >= 2;
    return true;
  }, [mode, peopleCount]);

  return { mode, setMode, peopleCount, setPeopleCount, canSubmit };
}
