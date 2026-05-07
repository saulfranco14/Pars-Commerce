export type CartFrequency = "weekly" | "biweekly" | "monthly";

export function freqLabel(freq: CartFrequency): string {
  if (freq === "weekly") return "Sem.";
  if (freq === "biweekly") return "Quinc.";
  return "Mens.";
}

export function freqToValues(freq: CartFrequency): {
  frequency: number;
  frequency_type: "weeks" | "months";
} {
  if (freq === "weekly") return { frequency: 1, frequency_type: "weeks" };
  if (freq === "biweekly") return { frequency: 2, frequency_type: "weeks" };
  return { frequency: 1, frequency_type: "months" };
}

export function freqPeriodLabel(freq: CartFrequency): string {
  if (freq === "weekly") return "/ sem";
  if (freq === "biweekly") return "/ quinc";
  return "/ mes";
}
