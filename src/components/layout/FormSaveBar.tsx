"use client";

interface FormSaveBarProps {
  children: React.ReactNode;
  align?: "center" | "end";
}

const barBaseClass =
  "flex shrink-0 border-t border-border bg-surface px-4 pt-4 rounded-t-2xl md:rounded-none shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:shadow-none";
const fixedBarClass =
  "fixed bottom-0 left-0 right-0 z-40 md:static md:left-auto md:right-auto md:bottom-auto";

export function FormSaveBar({ children, align = "center" }: FormSaveBarProps) {
  const justifyClass = align === "end" ? "justify-end" : "justify-center";
  return (
    <div
      className={`${barBaseClass} ${justifyClass} ${fixedBarClass}`}
      style={{
        paddingBottom: "max(1rem, calc(1rem + env(safe-area-inset-bottom)))",
      }}
    >
      <div
        className={`w-full max-w-4xl mx-auto md:max-w-none md:px-6 ${align === "end" ? "flex justify-end" : "md:w-auto"}`}
      >
        {children}
      </div>
    </div>
  );
}
