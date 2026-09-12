import type { SplitGroup } from "@/features/qr/interfaces/splitBill";

export function computeSplitTotals(groups: SplitGroup[]) {
  return groups.reduce(
    (acc, group) => {
      acc.total += Number(group.total ?? 0);
      acc.paid += Number(group.paid_total ?? 0);
      acc.balance += Number(group.balance_due ?? 0);
      return acc;
    },
    { total: 0, paid: 0, balance: 0 },
  );
}
