"use client";
import { useState } from "react";
import { Check, ScanEye, Wrench } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Notification } from "@/components/ui/Notification";
import {
  adminActionButtonAi,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { reviewStudioScene } from "../../helpers/scene";
import { reviewVersion } from "../../services/studioClientService";
import type { StudioFinding, StudioScene } from "../../interfaces/scene";

export function StudioAiReviewPanel({
  scene,
  tenantId,
  enabled,
  disabled,
  prepareVersion,
  onApply,
}: {
  scene: StudioScene;
  tenantId: string;
  enabled: boolean;
  disabled: boolean;
  prepareVersion: () => Promise<string>;
  onApply: (finding: StudioFinding) => void;
}) {
  const findings = reviewStudioScene(scene),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [review, setReview] = useState<Awaited<
      ReturnType<typeof reviewVersion>
    > | null>(null),
    [reviewedScene, setReviewedScene] = useState<string | null>(null);
  const changed =
    reviewedScene !== null && reviewedScene !== JSON.stringify(scene);
  async function evaluate() {
    setBusy(true);
    setError(null);
    try {
      const id = await prepareVersion();
      setReview(await reviewVersion(tenantId, id));
      setReviewedScene(JSON.stringify(scene));
      setConsent(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos evaluar el diseño.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-bold">Diagnóstico de tu anuncio</h3>
      <p className="text-xs leading-5 text-muted-foreground">
        Comprobaciones automáticas, sin costo.
      </p>
      {!findings.length ? (
        <p className="flex items-center gap-2 text-sm">
          <Check className="h-4 w-4 text-emerald-600" />
          Sin problemas geométricos detectados
        </p>
      ) : (
        findings.map((finding, i) => (
          <div
            key={`${finding.code}:${finding.nodeId}:${i}`}
            className="rounded-xl border border-border p-3"
          >
            <p className="text-xs leading-5">{finding.message}</p>
            {finding.action && (
              <button
                className={`${adminActionButtonSecondary} mt-2 w-full sm:w-auto`}
                disabled={disabled}
                onClick={() => onApply(finding)}
              >
                <Wrench className="h-4 w-4" />
                Corregir
              </button>
            )}
          </div>
        ))
      )}
      {enabled && (
        <button
          className={`${adminActionButtonAi} w-full sm:w-auto`}
          disabled={disabled || busy}
          onClick={() => setConsent(true)}
        >
          <ScanEye className="h-4 w-4" />
          {busy ? "Analizando…" : "Analizar"}
        </button>
      )}
      {error && <Notification tone="error" message={error} />}{" "}
      {review && (
        <div className="space-y-2 rounded-xl border border-border p-3">
          <p className="text-sm font-bold">
            {review.status === "ready"
              ? "Listo para compartir"
              : review.status === "improvable"
                ? "Se puede mejorar"
                : review.status === "processing"
                  ? "Diagnóstico en proceso"
                  : "Revisar antes de compartir"}
          </p>
          {changed && (
            <p className="text-xs text-amber-700">
              Esta evaluación corresponde a una composición anterior.
            </p>
          )}
          {review.findings.map((finding, i) => (
            <p key={i} className="text-xs leading-5">
              {finding}
            </p>
          ))}
          {review.recommendations.map((r, i) => (
            <p key={i} className="text-xs leading-5 text-muted-foreground">
              {r.explanation}
            </p>
          ))}
        </div>
      )}
      <ConfirmDialog
        isOpen={consent}
        onClose={() => setConsent(false)}
        title="Analizar esta composición con IA"
        description="Enviaremos una imagen de tu anuncio al proveedor configurado. Se incluyen hasta dos diagnósticos por diseño, sujetos a tu cuota mensual. No consume Tlacos."
        confirmLabel="Analizar"
        loading={busy}
        onConfirm={evaluate}
        icon={ScanEye}
      />
    </section>
  );
}
