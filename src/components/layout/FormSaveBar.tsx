"use client";

import { MobileActionBar } from "@/components/layout/MobileActionBar";

interface FormSaveBarProps {
  children: React.ReactNode;
  align?: "center" | "end";
}

const safePadding = {
  paddingBottom: "max(1rem, calc(1rem + env(safe-area-inset-bottom)))",
};

export function FormSaveBar({ children, align = "center" }: FormSaveBarProps) {
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
      <MobileActionBar className={`md:hidden ${justifyClass}`} contentClassName={innerClass}>
        {children}
      </MobileActionBar>

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
