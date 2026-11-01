"use client";

import { useRef } from "react";
import { MapPinnedIcon } from "@animateicons/react/lucide/map-pinned-icon";
import { MessageCircleReplyIcon } from "@animateicons/react/lucide/message-circle-reply-icon";
import { RocketIcon } from "@animateicons/react/lucide/rocket-icon";
import { StoreIcon } from "@animateicons/react/lucide/store-icon";

import type { LeadView } from "@/features/growth/interfaces/lead";
import type { AnimatedIconHandle, SectionCardItem, SectionCardsProps } from "@/features/growth/interfaces/prospects";

const ICONS = {
  seguimiento: MessageCircleReplyIcon,
  activacion: RocketIcon,
  contactar: StoreIcon,
  mapa: MapPinnedIcon,
} satisfies Record<LeadView, unknown>;

function SectionCard({ item, active, onSelect }: { item: SectionCardItem; active: boolean; onSelect: (value: LeadView) => void }) {
  const icon = useRef<AnimatedIconHandle>(null);
  const Icon = ICONS[item.value];
  return (
    <button
      type="button"
      aria-pressed={active}
      onMouseEnter={() => icon.current?.startAnimation()}
      onClick={() => {
        icon.current?.startAnimation();
        onSelect(item.value);
      }}
      className={`relative grid min-h-24 min-w-0 cursor-pointer grid-cols-[auto_minmax(0,1fr)] content-center items-center gap-x-3 gap-y-0.5 rounded-2xl border p-3 text-left transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
        active ? "border-accent bg-accent text-accent-foreground shadow-md shadow-accent/20" : "border-border bg-surface text-foreground hover:border-accent/50"
      }`}
    >
      <span className={`row-span-2 flex h-11 w-11 items-center justify-center rounded-xl ${active ? "bg-white/20" : "bg-surface-raised"}`}>
        <Icon ref={icon} size={24} />
      </span>
      <span className="truncate text-sm font-bold">{item.label}</span>
      <span className={`truncate text-xs ${active ? "text-accent-foreground/85" : "text-muted-foreground"}`}>{item.hint}</span>
      {item.count ? (
        <span
          className={`absolute -right-1.5 -top-2 rounded-full border-2 border-background px-2 py-px text-xs font-bold tabular-nums ${
            active ? "bg-surface text-accent" : item.alert ? "bg-red-600 text-white" : "bg-foreground text-background"
          }`}
        >
          {item.count}
        </span>
      ) : null}
    </button>
  );
}

/** The four sections as cards, two per row on phones; each icon moves once when tapped or hovered. */
export function SectionCards({ items, active, onSelect }: SectionCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4" role="group" aria-label="Sección">
      {items.map((item) => <SectionCard key={item.value} item={item} active={item.value === active} onSelect={onSelect} />)}
    </div>
  );
}
