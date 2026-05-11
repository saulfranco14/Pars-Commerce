interface BankTransferPanelProps {
  bankName: string | null;
  accountHolder: string | null;
  clabe: string | null;
}

export function BankTransferPanel({
  bankName,
  accountHolder,
  clabe,
}: BankTransferPanelProps) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold text-foreground">Pago por transferencia</h3>
      <dl className="mt-2 space-y-1 text-sm">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Banco</dt>
          <dd className="font-medium text-foreground">{bankName ?? "N/A"}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Titular</dt>
          <dd className="font-medium text-foreground">{accountHolder ?? "N/A"}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">CLABE</dt>
          <dd className="font-medium text-foreground">{clabe ?? "N/A"}</dd>
        </div>
      </dl>
    </section>
  );
}
