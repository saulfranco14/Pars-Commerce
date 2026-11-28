"use client";

import { useState } from "react";

import { fetchAdFiles, saveFiles, shareFiles } from "@/features/growth/helpers/adFiles";

import type { AdKind } from "@/features/growth/interfaces/prospectAds";

type Notice = { tone: "success" | "info" | "error"; message: string } | null;

/**
 * The four ad images of one prospect for the operator: share them to WhatsApp after opening the chat.
 * `urlFor` decides where they come from (the dashboard route or the public «Para ti» token).
 */
export function useAdImages(urlFor: (kind: AdKind, version: number) => string, onNext?: () => Promise<unknown>) {
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState<"share" | "next" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  async function share() {
    setBusy("share");
    setNotice(null);
    try {
      const files = await fetchAdFiles((kind) => urlFor(kind, version));
      const outcome = await shareFiles(files);
      if (outcome === "unsupported") {
        await saveFiles(files);
        setNotice({ tone: "info", message: "Este navegador no comparte imágenes: se descargaron. Adjúntalas en el chat desde tu galería." });
      }
    } catch {
      setNotice({ tone: "error", message: "No se pudieron preparar las imágenes. Intenta de nuevo." });
    } finally {
      setBusy(null);
    }
  }

  async function next() {
    if (!onNext) return;
    setBusy("next");
    try {
      await onNext();
      setVersion((current) => current + 1);
    } catch (err) {
      setNotice({ tone: "error", message: err instanceof Error ? err.message : "No pudimos cambiar los fondos." });
    } finally {
      setBusy(null);
    }
  }

  return { src: (kind: AdKind) => urlFor(kind, version), share, next, busy, notice, clearNotice: () => setNotice(null) };
}
