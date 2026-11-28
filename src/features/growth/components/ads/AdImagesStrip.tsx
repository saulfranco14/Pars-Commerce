"use client";

import { Images, Shuffle } from "lucide-react";

import { useAdImages } from "@/features/growth/hooks/useAdImages";
import { actionPair, adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { Notification } from "@/components/ui/Notification";

import { AD_KIND_LABEL, AD_KINDS } from "@/features/growth/constants/prospectAds";

import type { AdKind } from "@/features/growth/interfaces/prospectAds";

/**
 * The prospect's four gift ads next to its message. WhatsApp can't attach images from a link,
 * so the operator opens the chat first and then shares the images to it.
 */
export function AdImagesStrip({ urlFor, onNext }: { urlFor: (kind: AdKind, version: number) => string; onNext?: () => Promise<unknown> }) {
  const images = useAdImages(urlFor, onNext);
  return (
    <div className="grid gap-2">
      <ul className="grid grid-cols-4 gap-1.5">
        {AD_KINDS.map((kind) => (
          <li key={kind} className="overflow-hidden rounded-lg bg-border-soft/50">
            {/* eslint-disable-next-line @next/next/no-img-element -- server-drawn PNG of this prospect. */}
            <img src={images.src(kind)} alt={AD_KIND_LABEL[kind]} width={1080} height={1350} loading="lazy" className="aspect-4/5 h-auto w-full object-cover" />
          </li>
        ))}
      </ul>
      <div className={onNext ? actionPair : "grid"}>
        {onNext ? (
          <button type="button" disabled={Boolean(images.busy)} onClick={() => void images.next()} className={adminActionButtonSecondary}>
            <Shuffle className="h-4 w-4" aria-hidden />
            {images.busy === "next" ? "Cambiando…" : "Otro"}
          </button>
        ) : null}
        <button type="button" disabled={Boolean(images.busy)} onClick={() => void images.share()} className={adminActionButtonSecondary}>
          <Images className="h-4 w-4" aria-hidden />
          {images.busy === "share" ? "Preparando…" : "Imágenes"}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">Primero manda el mensaje; luego toca Imágenes y elige su chat, que sale primero.</p>
      {images.notice ? <Notification tone={images.notice.tone} message={images.notice.message} onDismiss={images.clearNotice} /> : null}
    </div>
  );
}
