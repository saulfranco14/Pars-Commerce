"use client";

import { useRef, useState } from "react";

import { sendParaEvent } from "@/features/growth/services/paraClient";

import type { ParaObjection } from "@/features/growth/interfaces/para";

/** Each answer is reported once, even if the owner taps around between them. */
export function useParaObjection({ token }: { token: string }) {
  const [selected, setSelected] = useState<ParaObjection | null>(null);
  const reported = useRef(new Set<ParaObjection>());

  function choose(reason: ParaObjection) {
    setSelected(reason);
    if (reported.current.has(reason)) return;
    reported.current.add(reason);
    sendParaEvent(token, "objection_chosen", { payload: { reason } });
  }

  return { selected, choose };
}
