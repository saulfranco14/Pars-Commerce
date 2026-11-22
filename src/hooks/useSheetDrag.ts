"use client";

import { useRef, useState } from "react";

import type { CSSProperties, MouseEvent, PointerEvent } from "react";

/** How far (px) or how fast (px/ms) a downward drag must go to dismiss the sheet. */
const CLOSE_DISTANCE = 110;
const CLOSE_VELOCITY = 0.6;

/**
 * Swipe-down-to-close for bottom sheets. Attach `handleProps` to the grabber
 * and header (never the scrolling body, so scrolling still works) and
 * `panelStyle` to the panel. Mouse drags are ignored: on desktop the sheet is
 * a centered modal.
 */
export function useSheetDrag(onClose: () => void, enabled = true) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ y: number; t: number } | null>(null);
  const moved = useRef(false);

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (!enabled || event.pointerType === "mouse") return;
    start.current = { y: event.clientY, t: event.timeStamp };
    moved.current = false;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    if (!start.current) return;
    const distance = Math.max(0, event.clientY - start.current.y);
    if (distance > 6) moved.current = true;
    setOffset(distance);
  }

  // A drag that springs back must not count as a tap on the grabber.
  function onClickCapture(event: MouseEvent<HTMLElement>) {
    if (!moved.current) return;
    moved.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  function finish(event: PointerEvent<HTMLElement>) {
    if (!start.current) return;
    const distance = Math.max(0, event.clientY - start.current.y);
    const velocity = distance / Math.max(1, event.timeStamp - start.current.t);
    start.current = null;
    setDragging(false);
    setOffset(0);
    if (distance > CLOSE_DISTANCE || (distance > 30 && velocity > CLOSE_VELOCITY)) onClose();
  }

  const panelStyle: CSSProperties = {
    transform: offset ? `translateY(${offset}px)` : undefined,
    transition: dragging ? "none" : "transform 200ms ease-out",
  };

  return {
    panelStyle,
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: finish,
      onClickCapture,
      style: { touchAction: "none" } as CSSProperties,
    },
  };
}
