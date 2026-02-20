"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface FormSaveBarProps {
  children: React.ReactNode;
  align?: "center" | "end";
}

const barBase =
  "flex shrink-0 border-t border-border bg-surface px-4 pt-4 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)]";

const safePadding = {
  paddingBottom: "max(1rem, calc(1rem + env(safe-area-inset-bottom)))",
};

export function FormSaveBar({ children, align = "center" }: FormSaveBarProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const justifyClass = align === "end" ? "justify-end" : "justify-center";
  const innerClass = `w-full max-w-4xl mx-auto md:max-w-none md:px-6 ${
    align === "end" ? "flex justify-end" : "md:w-auto"
  }`;

  return (
    <>
      {/*
       * ── Mobile bar ────────────────────────────────────────────────
       * Portal at document.body to bypass ancestor transform containing
       * blocks (e.g. the page-enter animation wrapper).
       * Buttons inside must carry form={formId} so they can submit
       * the <form> even though they live outside it in the DOM.
       */}
      {mounted &&
        createPortal(
          <div
            className={`fixed bottom-0 left-0 right-0 z-40 ${barBase} ${justifyClass} md:hidden`}
            style={safePadding}
          >
            <div className={innerClass}>{children}</div>
          </div>,
          document.body
        )}

      {/*
       * ── Desktop bar ───────────────────────────────────────────────
       * Rendered inline inside the <form> so submit buttons work
       * without any extra attributes.
       */}
      <div
        className={`hidden md:flex md:shrink-0 md:border-t md:border-border md:bg-surface md:px-4 md:pt-4 ${justifyClass}`}
        style={safePadding}
      >
        <div className={innerClass}>{children}</div>
      </div>
    </>
  );
}
