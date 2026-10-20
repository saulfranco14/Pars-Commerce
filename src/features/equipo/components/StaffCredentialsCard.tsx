"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";

import { btnWorkSuccess } from "@/components/ui/buttonClasses";

import { staffCredentialsMessage } from "@/features/equipo/helpers/staffCredentialsMessage";

import type { StaffCredentials } from "@/types/team";

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <code className="min-h-11 flex-1 break-all rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-base text-foreground">
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copiar ${label.toLowerCase()}`}
          className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-border-soft hover:text-foreground"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        </button>
      </div>
    </div>
  );
}

/** Login data the owner hands over, with a ready-made WhatsApp message. */
export function StaffCredentialsCard({ credentials, name }: { credentials: StaffCredentials; name: string }) {
  const message = staffCredentialsMessage(credentials, name, `${window.location.origin}/login`);

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-border-soft bg-surface-raised p-4">
        <CopyRow label={credentials.login.includes("@") ? "Email" : "Usuario"} value={credentials.login} />
        <CopyRow label="Contraseña" value={credentials.password} />
      </div>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btnWorkSuccess} w-full`}
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        Enviar por WhatsApp
      </a>
    </div>
  );
}
