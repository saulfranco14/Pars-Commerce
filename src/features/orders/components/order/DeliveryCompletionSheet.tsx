"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Loader2, Truck, X } from "lucide-react";

import { OptionalAssigneeField } from "@/features/orders/components/payment/OptionalAssigneeField";

import type { DeliveryCompletionSheetProps } from "@/features/orders/interfaces/deliveryCompletion";

export function DeliveryCompletionSheet({
  open,
  busy = false,
  onClose,
  onSubmit,
  team = [],
  assignedTo = null,
}: DeliveryCompletionSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [assignee, setAssignee] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) {
      setPhoto(null);
      setNote("");
      setAssignee(null);
    }
  }, [open]);
  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(photo);
    setPhotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delivery-completion-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={busy ? undefined : onClose}
        aria-label="Cerrar"
      />
      <section className="relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-surface shadow-2xl sm:max-w-lg sm:rounded-3xl">
        <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-border sm:hidden" />
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 pb-4 pt-4 sm:px-6 sm:pt-6">
          <div className="flex min-w-0 gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Truck className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2
                id="delivery-completion-title"
                className="text-lg font-bold text-foreground"
              >
                Pedido entregado
              </h2>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Confirma el cierre con una foto del paquete entregado. El cliente
                podrá verla en el seguimiento privado de su pedido.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
          <label className="block">
            <span className="text-sm font-semibold text-foreground">
              Foto de entrega
            </span>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
              Toma o elige una foto que confirme la entrega. Máximo 8 MB.
            </span>
            <span
              className="relative mt-3 flex min-h-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/60 bg-cover bg-center px-4 text-center text-blue-800"
              style={photoPreview ? { backgroundImage: `linear-gradient(rgba(15,23,42,.42),rgba(15,23,42,.42)),url(${photoPreview})` } : undefined}
            >
              <Camera className={`h-6 w-6 ${photoPreview ? "text-white" : ""}`} aria-hidden />
              <span className="mt-2 text-sm font-semibold">
                <span className={photoPreview ? "text-white" : ""}>
                  {photo ? "Cambiar fotografía" : "Tomar o elegir foto"}
                </span>
              </span>
              {photo ? (
                <span className={`mt-1 text-xs ${photoPreview ? "text-white/90" : ""}`}>
                  {(photo.size / 1024 / 1024).toFixed(1)} MB
                </span>
              ) : null}
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
            />
          </label>

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-foreground">
              Nota de entrega (opcional)
            </span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Ej. Se entregó a la persona indicada."
              className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          {!assignedTo && team.length > 0 ? (
            <div className="mt-5">
              <OptionalAssigneeField team={team} value={assignee} onChange={setAssignee} disabled={busy} />
            </div>
          ) : null}
        </div>

        <footer
          className="border-t border-border bg-surface px-5 pt-3 sm:px-6"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <button
            type="button"
            disabled={!photo || busy}
            onClick={() => photo && void onSubmit(photo, note.trim(), assignee)}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Camera className="h-4 w-4" aria-hidden />
            )}
            Marcar pedido entregado
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
