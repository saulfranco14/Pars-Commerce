import { CalendarRange, FileCheck2 } from "lucide-react";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatMXN } from "@/lib/loanUtils";
import {
  CYCLE_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
} from "@/features/settlement/constants/labels";
import type { Settlement } from "@/types/settlement";

interface SettlementCardProps {
  settlement: Settlement;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  });
}

export function SettlementCard({ settlement: s }: SettlementCardProps) {
  const isReceived = s.status === "transfer_confirmed";

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarRange className="h-3.5 w-3.5" />
            <span>
              {fmtDate(s.period_start)} – {fmtDate(s.period_end)}
            </span>
            <span className="text-border">·</span>
            <span>{CYCLE_LABEL[s.cycle_type]}</span>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {formatMXN(s.amount_to_transfer)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            de {formatMXN(s.net_mp_amount)} neto · comisión{" "}
            {formatMXN(s.platform_commission)}
          </p>
        </div>
        <StatusBadge
          tone={STATUS_TONE[s.status]}
          label={STATUS_LABEL[s.status]}
        />
      </div>

      {isReceived && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <FileCheck2 className="h-4 w-4 shrink-0" />
          <span className="font-semibold">Recibido</span>
          {s.transfer_confirmed_at && (
            <span>
              el{" "}
              {new Date(s.transfer_confirmed_at).toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          )}
          {s.transfer_reference && (
            <span className="text-emerald-700">· Ref: {s.transfer_reference}</span>
          )}
          {s.transfer_proof_url && (
            <a
              href={s.transfer_proof_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto font-semibold underline"
            >
              Ver comprobante
            </a>
          )}
        </div>
      )}

      {s.transfer_note && isReceived && (
        <p className="mt-2 text-xs text-muted-foreground">
          Nota: {s.transfer_note}
        </p>
      )}
    </div>
  );
}
