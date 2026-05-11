import type { SplitMode } from "@/features/qr/interfaces/splitBill";

interface SplitModePickerProps {
  mode: SplitMode;
  onChange: (mode: SplitMode) => void;
}

export function SplitModePicker({ mode, onChange }: SplitModePickerProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <button
        type="button"
        onClick={() => onChange("by_device")}
        className={`min-h-[44px] rounded-lg border px-3 py-2 text-sm ${
          mode === "by_device" ? "border-accent bg-accent/20" : "border-border"
        }`}
      >
        Por dispositivo
      </button>
      <button
        type="button"
        onClick={() => onChange("equal")}
        className={`min-h-[44px] rounded-lg border px-3 py-2 text-sm ${
          mode === "equal" ? "border-accent bg-accent/20" : "border-border"
        }`}
      >
        Partes iguales
      </button>
      <button
        type="button"
        onClick={() => onChange("items")}
        className={`min-h-[44px] rounded-lg border px-3 py-2 text-sm ${
          mode === "items" ? "border-accent bg-accent/20" : "border-border"
        }`}
      >
        Por items
      </button>
    </div>
  );
}
