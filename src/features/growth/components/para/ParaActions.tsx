"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

import { sendParaEvent } from "@/features/growth/services/paraClient";

interface ParaActionsProps {
  token: string;
  claimUrl: string;
  helpUrl: string | null;
}

export function ParaActions({ token, claimUrl, helpUrl }: ParaActionsProps) {
  return (
    <div className="grid gap-3">
      <Link
        href={claimUrl}
        onClick={() => sendParaEvent(token, "claim_clicked")}
        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-accent px-6 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 transition active:scale-[0.99]"
      >
        Reclamar mi tienda
        <ArrowRight className="h-5 w-5" aria-hidden />
      </Link>
      <p className="text-center text-sm text-muted-foreground">Se crea con estos productos y los cambias cuando quieras. Toma 2 minutos.</p>
      {helpUrl ? (
        <a
          href={helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => sendParaEvent(token, "help_clicked")}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-5 text-sm font-semibold text-foreground transition hover:bg-border-soft/50"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          Prefiero que me ayuden por WhatsApp
        </a>
      ) : null}
    </div>
  );
}
