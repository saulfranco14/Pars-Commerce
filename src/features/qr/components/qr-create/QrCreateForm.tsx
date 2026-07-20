"use client";

import Link from "next/link";
import useSWR from "swr";
import { ArrowRight, Info } from "lucide-react";

import { Notification } from "@/components/ui/Notification";
import { useSchemaForm } from "@/lib/forms/useSchemaForm";
import { SchemaFormFields } from "@/lib/forms/SchemaFormFields";
import { useCreateQr } from "@/features/qr/hooks/useCreateQr";
import { buildQrFields } from "@/features/qr/validations/qrFieldSchema";
import { buildQrCodesKey } from "@/features/qr/helpers/buildQrKey";
import { swrFetcher } from "@/lib/swrFetcher";

import type { QrFieldValues } from "@/features/qr/validations/qrFieldSchema";
import type { QrCode } from "@/features/qr/interfaces/qrCode";

interface QrCreateFormProps {
  tenantId: string;
  tenantSlug?: string;
  defaultKind?: "payment" | "table";
  lockKind?: boolean;
  onSuccess: (qr: QrCode) => void;
  onCancel?: () => void;
}

/**
 * "Nuevo QR" — homologated onto the schema-driven engine. Also reused by
 * "Agregar mesa" (via `lockKind`, which hides the kind picker and only ever
 * submits `kind: "table"`). `kind`'s conditional required/visible rules on
 * `table_capacity`/`preset_amount` are declared in qrFieldSchema.tsx
 * (`showWhen`/`requiredWhen`) instead of hand-written JSX branches.
 */
export function QrCreateForm({
  tenantId,
  tenantSlug,
  defaultKind = "payment",
  lockKind = false,
  onSuccess,
  onCancel,
}: QrCreateFormProps) {
  const { create, loading, error } = useCreateQr(tenantId);

  const tablesKey = !lockKind ? buildQrCodesKey(tenantId, "table") : null;
  const { data: existingTables } = useSWR<QrCode[]>(tablesKey, swrFetcher, {
    fallbackData: [],
    revalidateOnFocus: false,
  });

  const fields = buildQrFields({ lockKind, defaultKind });

  const form = useSchemaForm<QrFieldValues>(fields, async (values) => {
    const kind = lockKind ? "table" : values.kind;
    const qr = await create({
      tenant_id: tenantId,
      kind,
      label: values.label,
      table_capacity: kind === "table" ? values.table_capacity ?? null : null,
      preset_amount: kind === "payment" ? values.preset_amount ?? null : null,
    });
    if (qr) onSuccess(qr);
  });

  const kind = form.watch("kind" as never) as unknown as string;
  const showTablesHint = !lockKind && kind === "table";
  const tablesList = existingTables ?? [];

  return (
    <form onSubmit={form.handleSubmit(form.submit)} noValidate className="space-y-5">
      {showTablesHint && tenantSlug && (
        <Notification
          tone="info"
          title={
            tablesList.length > 0
              ? `Ya tienes ${tablesList.length} mesa${tablesList.length === 1 ? "" : "s"} registrada${tablesList.length === 1 ? "" : "s"}.`
              : "Aún no tienes mesas registradas."
          }
          message={
            <>
              {tablesList.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {tablesList.slice(0, 5).map((t) => (
                    <span
                      key={t.id}
                      className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-foreground"
                    >
                      {t.label}
                    </span>
                  ))}
                  {tablesList.length > 5 && (
                    <span className="text-xs text-muted-foreground">
                      +{tablesList.length - 5} más
                    </span>
                  )}
                </div>
              )}
              <p>
                Te recomendamos crear y administrar mesas desde la sección
                dedicada.
              </p>
              <Link
                href={`/dashboard/${tenantSlug}/mesas`}
                className="mt-1 inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-accent hover:underline"
              >
                Ir a Mesas
                <ArrowRight className="h-3 w-3" />
              </Link>
            </>
          }
        />
      )}

      <SchemaFormFields
        fields={fields}
        register={form.register}
        errors={form.errors}
        watch={form.watch}
        setValue={form.setValue}
        control={form.control}
      />

      {!showTablesHint && (
        <div className="flex items-start gap-2 rounded-xl bg-border-soft/40 px-3 py-2 text-[11px] text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            Después de crear el QR podrás verlo, imprimirlo y compartirlo con
            tus clientes.
          </p>
        </div>
      )}

      {(error || form.submitError) && (
        <Notification tone="error" message={error ?? form.submitError ?? ""} />
      )}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex min-h-[48px] cursor-pointer items-center justify-center rounded-2xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-border-soft/60 disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-[140px]"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !form.isValid}
          className="flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground shadow-md shadow-accent/20 hover:bg-accent/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 transition-all sm:max-w-[220px]"
        >
          {loading
            ? "Creando..."
            : kind === "table"
              ? "Crear mesa"
              : "Crear código QR"}
        </button>
      </div>
    </form>
  );
}
