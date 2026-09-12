"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { registerInterest } from "@/services/featureInterestService";
import type { Novedad } from "@/features/novedades/constants/catalog";

interface NovedadCardProps {
  novedad: Novedad;
  tenantId: string;
  alreadyInterested: boolean;
  onInterested: (key: string) => void;
}

export function NovedadCard({
  novedad,
  tenantId,
  alreadyInterested,
  onInterested,
}: NovedadCardProps) {
  const Icon = novedad.icon;
  const [saving, setSaving] = useState(false);
  const [interested, setInterested] = useState(alreadyInterested);

  async function handleInterest() {
    if (interested || saving) return;
    setSaving(true);
    try {
      await registerInterest({ tenant_id: tenantId, feature_key: novedad.key });
      setInterested(true);
      onInterested(novedad.key);
    } finally {
      setSaving(false);
    }
  }

  const isNew = novedad.status === "new";

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Icon className="h-5 w-5" />
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
            isNew
              ? "bg-emerald-100 text-emerald-700"
              : "bg-accent/10 text-accent"
          }`}
        >
          {!isNew && <Sparkles className="h-3 w-3" />}
          {isNew ? "Nuevo" : "Próximamente"}
        </span>
      </div>

      <h3 className="mt-4 text-base font-bold tracking-tight text-foreground">
        {novedad.title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {novedad.description}
      </p>

      <div className="mt-4">
        <novedad.Mockup />
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-accent">
        <Check className="h-3.5 w-3.5" />
        {novedad.highlight}
      </div>

      <div className="mt-4 pt-1">
        {isNew && novedad.href ? (
          <Link
            href={novedad.href}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Ábrelo
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : interested ? (
          <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
            <Check className="h-4 w-4" />
            Te avisaremos cuando esté
          </span>
        ) : (
          <button
            type="button"
            onClick={handleInterest}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft/40 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Me interesa"}
          </button>
        )}
      </div>
    </div>
  );
}
