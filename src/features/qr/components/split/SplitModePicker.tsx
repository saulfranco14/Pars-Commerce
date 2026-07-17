import type { SplitMode } from "@/features/qr/interfaces/splitBill";

interface SplitModePickerProps {
  mode: SplitMode;
  onChange: (mode: SplitMode) => void;
}

const OPTIONS: { value: SplitMode; label: string; hint: string }[] = [
  {
    value: "by_device",
    label: "Lo que pidió cada quien",
    hint: "Cada persona paga sus propios productos.",
  },
  {
    value: "equal",
    label: "Partes iguales",
    hint: "El total se reparte parejo entre todos.",
  },
  {
    value: "items",
    label: "Elegir quién paga qué",
    hint: "Asignas cada producto a una persona.",
  },
];

/**
 * Human-language split-mode picker. Full-width rows with a label + one-line
 * explanation so nobody needs to know a technical term. Monochrome — accent
 * only on the selected row (DESIGN_SYSTEM.md §2.1).
 */
export function SplitModePicker({ mode, onChange }: SplitModePickerProps) {
  return (
    <div className="space-y-2">
      {OPTIONS.map((opt) => {
        const active = mode === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`flex w-full min-h-[56px] cursor-pointer flex-col justify-center rounded-2xl border-2 px-4 py-2.5 text-left transition-colors ${
              active
                ? "border-accent bg-accent/5"
                : "border-border bg-surface hover:border-accent/40"
            }`}
          >
            <span className="text-sm font-bold text-foreground">
              {opt.label}
            </span>
            <span className="text-xs text-muted-foreground">{opt.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
