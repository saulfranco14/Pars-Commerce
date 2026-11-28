import { AD_KINDS } from "@/features/growth/constants/prospectAds";

import type { AdKind } from "@/features/growth/interfaces/prospectAds";

export type ShareOutcome = "shared" | "cancelled" | "unsupported";

/** The four ad PNGs, in sending order, as files the browser can save or share. */
export async function fetchAdFiles(urlFor: (kind: AdKind) => string): Promise<File[]> {
  return Promise.all(
    AD_KINDS.map(async (kind, index) => {
      const response = await fetch(urlFor(kind), { cache: "no-store" });
      if (!response.ok) throw new Error(`ad ${kind}: ${response.status}`);
      return new File([await response.blob()], `anuncio-${index + 1}-${kind}.png`, { type: "image/png" });
    }),
  );
}

/** One save per file, spaced so phones don't drop the later ones. */
export async function saveFiles(files: File[]): Promise<void> {
  for (const file of files) {
    const url = URL.createObjectURL(file);
    Object.assign(document.createElement("a"), { href: url, download: file.name }).click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
}

/** The phone's share sheet with the images (WhatsApp, Estado…); some browsers can't share files. */
export async function shareFiles(files: File[], text?: string): Promise<ShareOutcome> {
  if (!navigator.canShare?.({ files })) return "unsupported";
  try {
    await navigator.share({ files, ...(text ? { text } : {}) });
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    throw error;
  }
}
