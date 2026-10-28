"use client";

import { useState } from "react";

import { requestParaVisit } from "@/features/growth/services/paraClient";

import type { ParaVisitRequest, ParaVisitSlot } from "@/features/growth/interfaces/para";

type Status = "idle" | "sending" | "done" | "error";

export function useParaVisit({ token }: { token: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<ParaVisitSlot | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState<ParaVisitRequest | null>(null);

  async function submit() {
    if (!day || !slot || status === "sending") return;
    setStatus("sending");
    setError(null);
    try {
      setBooked(await requestParaVisit(token, { day, slot }));
      setStatus("done");
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : "No pudimos pedir la visita. Intente de nuevo.");
      setStatus("error");
    }
  }

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    day,
    setDay,
    slot,
    setSlot,
    sending: status === "sending",
    error,
    booked,
    canSubmit: Boolean(day && slot) && status !== "sending",
    submit,
  };
}
