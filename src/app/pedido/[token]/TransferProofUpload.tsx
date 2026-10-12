"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Upload } from "lucide-react";

export function TransferProofUpload({
  token,
  total,
  replacement = false,
  onSubmitted,
}: {
  token: string;
  total: number;
  replacement?: boolean;
  onSubmitted?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!file || sending || submitted) {
      if (!file) setError("Selecciona tu comprobante.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("proof", file);
      form.set("amount", String(total));
      const response = await fetch(
        `/api/pedido/${encodeURIComponent(token)}/comprobante`,
        { method: "POST", body: form },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "No se pudo subir el comprobante.");
      }
      setSubmitted(true);
      window.setTimeout(() => onSubmitted?.(), 550);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo subir el comprobante.",
      );
    } finally {
      setSending(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-center text-emerald-900">
        <CheckCircle2 className="mx-auto h-8 w-8" aria-hidden />
        <p className="mt-2 font-bold">Comprobante enviado</p>
        <p className="mt-1 text-sm leading-5">
          Ya está en revisión. No necesitas volver a enviarlo.
        </p>
      </div>
    );
  }

  return (
    <section>
      <p className="text-sm leading-6 text-muted-foreground">
        {replacement
          ? "Adjunta un comprobante nuevo. El anterior seguirá en el historial de revisión."
          : `Adjunta una imagen o PDF de tu transferencia por $${total.toFixed(2)}.`}
      </p>
      <label className="mt-4 flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:border-blue-300">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Upload className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate">
          {file?.name ?? "Elegir imagen o PDF"}
        </span>
        <input
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setError(null);
          }}
        />
      </label>
      {error ? (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void submit()}
        disabled={sending || !file}
        aria-busy={sending}
        className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-base font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {sending
          ? "Enviando comprobante…"
          : replacement
            ? "Enviar nuevo comprobante"
            : "Enviar comprobante"}
      </button>
    </section>
  );
}
