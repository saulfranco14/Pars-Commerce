"use client";
import { useEffect, useRef, useState } from "react";
import { StudioFadingPreview } from "./StudioFadingPreview";
import { STUDIO_FORMATS } from "../../constants/studio";
import type { StudioDesignCarouselProps } from "../../interfaces/ui";

/** Share of the row one design takes, so the next one peeks in. */
const CARD_SHARE = 0.82;
const CARD_MAX_VH = 0.44;
const SETTLE_MS = 140;

/** The six designs side by side; swiping to one or tapping it applies it. */
export function StudioDesignCarousel({
  options,
  active,
  onPick,
  assets,
  tenantId,
  disabled,
  overlay,
  generating = false,
  dark = false,
  endCard,
  cardShare = CARD_SHARE,
  maxVh = CARD_MAX_VH,
}: StudioDesignCarouselProps) {
  const track = useRef<HTMLDivElement>(null),
    activeRef = useRef(active),
    settle = useRef<ReturnType<typeof setTimeout> | null>(null),
    frame = useRef(0),
    [rowWidth, setRowWidth] = useState(0),
    [viewport, setViewport] = useState(800),
    [centered, setCentered] = useState(Math.max(0, active));
  activeRef.current = active;
  const format = STUDIO_FORMATS[options[0]?.scene.format ?? "square"],
    ratio = format.width / format.height,
    card = Math.min(rowWidth * cardShare, viewport * maxVh * ratio),
    pad = Math.max(0, (rowWidth - card) / 2);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setRowWidth(entry.contentRect.width);
      setViewport(window.innerHeight);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function center(index: number, smooth: boolean) {
    const el = track.current,
      item = el?.children[index] as HTMLElement | undefined;
    if (!el || !item) return;
    el.scrollTo({
      left: item.offsetLeft - (el.clientWidth - item.offsetWidth) / 2,
      behavior: smooth ? "smooth" : "auto",
    });
  }

  const placed = useRef(false);
  useEffect(() => {
    if (!card || active < 0) return;
    center(active, placed.current);
    placed.current = true;
    setCentered(active);
  }, [active, card]);

  function onScroll() {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = track.current;
      if (!el) return;
      const middle = el.scrollLeft + el.clientWidth / 2;
      let nearest = 0,
        distance = Infinity;
      Array.from(el.children).forEach((child, i) => {
        const item = child as HTMLElement,
          d = Math.abs(item.offsetLeft + item.offsetWidth / 2 - middle);
        if (d < distance) {
          distance = d;
          nearest = i;
        }
      });
      setCentered(nearest);
      if (settle.current) clearTimeout(settle.current);
      settle.current = setTimeout(() => {
        if (
          !disabled &&
          nearest < options.length &&
          nearest !== activeRef.current
        )
          onPick(nearest);
      }, SETTLE_MS);
    });
  }

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      if (settle.current) clearTimeout(settle.current);
    },
    [],
  );

  return (
    <div
      ref={track}
      onScroll={onScroll}
      role="listbox"
      aria-label="Diseños de tu anuncio"
      aria-orientation="horizontal"
      className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ paddingInline: pad }}
    >
      {options.map((option, i) => {
        const chosen = i === active;
        return (
          <div
            key={option.id}
            role="option"
            aria-selected={chosen}
            aria-label={`${option.name}, diseño ${i + 1} de ${options.length}`}
            className={`flex shrink-0 snap-center flex-col gap-1.5 transition-opacity duration-200 motion-reduce:transition-none ${i === centered ? "" : "opacity-55"}`}
            style={{ width: card || `${cardShare * 100}%` }}
          >
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                center(i, true);
                if (!chosen) onPick(i);
              }}
              className={`relative block cursor-pointer overflow-hidden rounded-2xl shadow-sm ring-accent ring-offset-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 disabled:cursor-default ${chosen ? "ring-2" : ""}`}
            >
              <StudioFadingPreview
                scene={option.scene}
                assets={assets}
                tenantId={tenantId}
              />
              {generating && (
                <span
                  className="studio-generating-veil pointer-events-none absolute inset-0"
                  aria-hidden
                />
              )}
              {chosen && overlay}
            </button>
            <p
              className={`flex items-center justify-center gap-2 text-sm font-semibold ${dark ? "text-white/85" : ""}`}
            >
              {option.name}
              {i === 0 && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
                  Recomendada
                </span>
              )}
            </p>
          </div>
        );
      })}
      {endCard && (
        <div
          className="flex shrink-0 snap-center flex-col"
          style={{ width: card || `${cardShare * 100}%` }}
        >
          {endCard}
        </div>
      )}
    </div>
  );
}
