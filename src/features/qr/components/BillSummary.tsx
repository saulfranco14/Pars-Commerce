import type { SplitGroup } from "@/features/qr/interfaces/splitBill";

interface BillSummaryProps {
  total: number;
  groups: SplitGroup[];
}

export function BillSummary({ total, groups }: BillSummaryProps) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <h3 className="text-base font-semibold text-foreground">Resumen de cuenta</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Total: ${Number(total).toFixed(2)}
      </p>
      <div className="mt-3 space-y-2">
        {groups.map((group) => (
          <div
            key={group.id}
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
          >
            <span>{group.label}</span>
            <span className="font-medium">${Number(group.balance_due).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
