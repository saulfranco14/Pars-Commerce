import Link from "next/link";

import type { QrCode } from "@/features/qr/interfaces/qrCode";

interface QRCodeCardProps {
  tenantSlug: string;
  code: QrCode;
}

export function QRCodeCard({ tenantSlug, code }: QRCodeCardProps) {
  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {code.kind === "table" ? "Mesa" : "Cobro"}
          </p>
          <h3 className="text-base font-semibold text-foreground">{code.label}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{code.token}</p>
        </div>
        <span className="rounded-full bg-accent px-2 py-1 text-xs font-medium text-foreground">
          {code.is_active ? "Activo" : "Inactivo"}
        </span>
      </div>
      <div className="mt-4">
        <Link
          href={`/dashboard/${tenantSlug}/qr/${code.id}`}
          className="inline-flex min-h-[44px] items-center rounded-lg bg-accent px-3 py-2 text-sm font-medium text-foreground"
        >
          Ver detalle
        </Link>
      </div>
    </article>
  );
}
