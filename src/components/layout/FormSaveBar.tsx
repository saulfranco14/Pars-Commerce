"use client";

interface FormSaveBarProps {
  children: React.ReactNode;
}

const barClass =
  "flex shrink-0 justify-center border-t border-border bg-surface px-4 pt-4 rounded-t-2xl md:rounded-none shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:shadow-none";
const fixedBarClass =
  "fixed bottom-0 left-0 right-0 z-40 md:static md:left-auto md:right-auto md:bottom-auto";

export function FormSaveBar({ children }: FormSaveBarProps) {
  return (
    <div
      className={`${barClass} ${fixedBarClass}`}
      style={{
        paddingBottom: "max(1rem, calc(1rem + env(safe-area-inset-bottom)))",
      }}
    >
      <div className="w-full max-w-4xl mx-auto md:max-w-none md:w-auto md:px-6">
        {children}
      </div>
    </div>
  );
}
