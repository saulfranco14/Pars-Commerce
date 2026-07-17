"use client";

import { Check, Link2, Loader2, X } from "lucide-react";

interface IncomingProps {
  kind: "incoming";
  /** Label of the table asking to join. */
  otherLabel: string;
  busy: boolean;
  onApprove: () => void;
  onDecline: () => void;
}

interface OutgoingProps {
  kind: "outgoing";
  /** Label of the table we asked to join. */
  otherLabel: string;
  busy: boolean;
  onCancel: () => void;
}

type MergeRequestBannerProps = IncomingProps | OutgoingProps;

/**
 * Consent prompt shown on the bill. Two shapes:
 *  - incoming (this table's owner decides): "X quiere unir su cuenta" + accept/decline.
 *  - outgoing (this table is waiting): "Esperando a que X acepte" + cancel.
 */
export function MergeRequestBanner(props: MergeRequestBannerProps) {
  if (props.kind === "incoming") {
    return (
      <section className="rounded-2xl border-2 border-accent bg-accent/5 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Link2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">
              {props.otherLabel} quiere unir su cuenta con la tuya
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Si aceptas, sus productos pasarán a esta cuenta y pagarán juntos.
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={props.onDecline}
            disabled={props.busy}
            className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft/40 disabled:opacity-60"
          >
            <X className="h-4 w-4" />
            Rechazar
          </button>
          <button
            type="button"
            onClick={props.onApprove}
            disabled={props.busy}
            className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-accent px-4 text-sm font-bold text-accent-foreground shadow-md shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.99] disabled:opacity-60"
          >
            {props.busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Aceptar
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-border-soft/60 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">
            Esperando a {props.otherLabel}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Le pedimos que una su cuenta. En cuanto acepte, se combinarán.
          </p>
        </div>
        <button
          type="button"
          onClick={props.onCancel}
          disabled={props.busy}
          className="shrink-0 cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </section>
  );
}
