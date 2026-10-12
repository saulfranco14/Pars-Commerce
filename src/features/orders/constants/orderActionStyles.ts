import {
  btnDanger,
  btnPrimary,
  btnSecondary,
} from "@/components/ui/buttonClasses";

const controlShape =
  "min-h-12 rounded-xl px-4 py-3 font-semibold active:scale-[0.98]";

export const orderActionWidth = "w-full min-w-0 shrink-0 sm:w-auto";

export const orderActionStyles = {
  primary: `${btnPrimary} ${controlShape}`,
  success: `${btnPrimary} ${controlShape} bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-500`,
  accent: `${btnPrimary} ${controlShape} bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-500`,
  secondary: `${btnSecondary} ${controlShape} bg-surface`,
  destructive: `${btnDanger} ${controlShape} bg-surface`,
} as const;

export type OrderActionTone = keyof typeof orderActionStyles;

export function orderActionClass(tone: OrderActionTone): string {
  return `${orderActionWidth} ${orderActionStyles[tone]}`;
}

export const orderWhatsAppContainerClass = "w-full sm:w-auto";
export const orderWhatsAppButtonClass =
  "h-12 w-full rounded-xl px-4 py-3 font-semibold sm:w-auto";
