import { Check } from "lucide-react";
export function StudioWizardProgress({ step }: { step: number }) {
  return (
    <ol
      aria-label="Pasos del diseño"
      className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-surface p-3"
    >
      {["¿Qué vas a anunciar?", "Diseña y mejora", "Revisa y comparte"].map(
        (label, i) => (
          <li
            key={label}
            aria-current={step === i + 1 ? "step" : undefined}
            className={`flex flex-col gap-2 text-xs sm:flex-row sm:items-center ${step === i + 1 ? "font-bold text-accent" : "text-muted-foreground"}`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${step > i + 1 ? "bg-accent/10 text-accent" : step === i + 1 ? "bg-accent text-accent-foreground" : "bg-border-soft"}`}
            >
              {step > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span>{label}</span>
          </li>
        ),
      )}
    </ol>
  );
}
