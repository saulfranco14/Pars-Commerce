"use client";
import Link from "next/link";
import { Check, Send } from "lucide-react";
import { StudioScenePreview } from "./editor/StudioScenePreview";
import { STUDIO_AD_STATES } from "../constants/studio";
import type { StudioAdCardProps } from "../interfaces/ui";

/** One ad in «Anuncios»: opens it, or gets picked for a group share. */
export function StudioAdCard({
  design,
  state,
  href,
  tenantId,
  selecting,
  picked,
  blocked,
  sent,
  onToggle,
}: StudioAdCardProps) {
  const chip = STUDIO_AD_STATES[state],
    body = (
      <>
        <span
          className={`pointer-events-none relative block overflow-hidden rounded-xl transition-shadow ${picked ? "ring-3 ring-accent ring-offset-2 ring-offset-background" : ""}`}
        >
          <StudioScenePreview
            scene={design.draft_scene}
            assets={[]}
            tenantId={tenantId}
          />
          {selecting && !blocked && (
            <span
              aria-hidden
              className={`absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full border-2 ${picked ? "border-accent bg-accent text-accent-foreground" : "border-white bg-black/30"}`}
            >
              {picked && <Check className="h-4 w-4" />}
            </span>
          )}
          {sent && (
            <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white">
              <Send className="h-3 w-3" aria-hidden />
              Enviado
            </span>
          )}
        </span>
        <span className="flex items-center justify-between gap-2 text-xs font-semibold">
          <span className="truncate">{design.title}</span>
          <span
            className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${chip.tone}`}
          >
            {chip.label}
          </span>
        </span>
        {selecting && blocked && (
          <span className="text-[11px] leading-snug text-muted-foreground">
            {blocked}
          </span>
        )}
      </>
    );
  if (!selecting)
    return (
      <Link
        href={href}
        className="flex min-w-0 flex-col gap-1.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {body}
      </Link>
    );
  return (
    <button
      type="button"
      aria-pressed={picked}
      disabled={Boolean(blocked)}
      onClick={onToggle}
      className="flex min-w-0 cursor-pointer flex-col gap-1.5 rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
    >
      {body}
    </button>
  );
}
