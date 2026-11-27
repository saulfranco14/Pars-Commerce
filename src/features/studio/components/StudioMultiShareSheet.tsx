"use client";
import { MessageCircle, Share2 } from "lucide-react";
import { FormSheet } from "@/components/ui/FormSheet";
import { Notification } from "@/components/ui/Notification";
import { StudioShareTile } from "./editor/StudioShareTile";
import { STUDIO_MULTI_SHARE } from "../constants/studio";
import type { StudioMultiShareSheetProps } from "../interfaces/ui";

const ICONS = { chats: MessageCircle, status: Share2 } as const;

/** One question before the phone's share menu: chats or Estado. */
export function StudioMultiShareSheet({
  open,
  onClose,
  count,
  waiting,
  busy,
  error,
  onShare,
}: StudioMultiShareSheetProps) {
  return (
    <FormSheet
      isOpen={open}
      onClose={onClose}
      title={count === 1 ? "Compartir 1 anuncio" : `Compartir ${count} anuncios`}
      description="Elige dónde los vas a poner. Van juntos, con un solo mensaje."
      icon={Share2}
    >
      <div className="space-y-3 pb-3">
        {error && <Notification tone="error" message={error} />}
        <div className="grid grid-cols-2 gap-3">
          {STUDIO_MULTI_SHARE.map((option) => (
            <StudioShareTile
              key={option.id}
              icon={ICONS[option.id]}
              tone={option.id === "chats" ? "success" : "accent"}
              title={option.label}
              detail={option.detail}
              disabled={busy}
              waiting={waiting}
              onClick={() => onShare(option.id)}
            />
          ))}
        </div>
      </div>
    </FormSheet>
  );
}
