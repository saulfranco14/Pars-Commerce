"use client";

import Link from "next/link";
import useSWR from "swr";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ArrowRight, DollarSign, Info, Tag, Users } from "lucide-react";

import { FormInput } from "@/components/ui/FormInput";
import { Notification } from "@/components/ui/Notification";
import { useCreateQr } from "@/features/qr/hooks/useCreateQr";
import { QrKindSelector } from "@/features/qr/components/QrKindSelector";
import { qrCodeSchema } from "@/features/qr/validations/qrCodeSchema";
import { buildQrCodesKey } from "@/features/qr/helpers/buildQrKey";
import { labelClass } from "@/features/configuracion/constants/formClasses";
import { swrFetcher } from "@/lib/swrFetcher";

import type { QrCodeFormValues } from "@/features/qr/validations/qrCodeSchema";
import type { QrCode } from "@/features/qr/interfaces/qrCode";

interface QrCreateFormProps {
  tenantId: string;
  tenantSlug?: string;
  defaultKind?: "payment" | "table";
  lockKind?: boolean;
  onSuccess: (qr: QrCode) => void;
  onCancel?: () => void;
}

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

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<QrCodeFormValues>({
    resolver: yupResolver(qrCodeSchema) as unknown as Resolver<QrCodeFormValues>,
    defaultValues: {
      kind: defaultKind,
      label: "",
      table_capacity: defaultKind === "table" ? 4 : null,
      preset_amount: null,
      preset_concept: null,
      allow_amount_override: true,
    },
  });

  const kind = watch("kind");

  async function onSubmit(values: QrCodeFormValues) {
    const qr = await create({
      tenant_id: tenantId,
      kind: values.kind,
      label: values.label,
      table_capacity:
        values.kind === "table" ? (values.table_capacity ?? null) : null,
      preset_amount:
        values.kind === "payment" ? (values.preset_amount ?? null) : null,
    });
    if (qr) onSuccess(qr);
  }

  const showTablesHint = !lockKind && kind === "table";
  const tablesList = existingTables ?? [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {!lockKind && (
        <div className="space-y-2">
          <span className={labelClass}>Tipo de QR</span>
          <Controller
            name="kind"
            control={control}
            render={({ field }) => (
              <QrKindSelector
                value={field.value}
                onChange={field.onChange}
                disabled={loading}
              />
            )}
          />
        </div>
      )}

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

      <FormInput
        label={kind === "table" ? "Nombre de la mesa" : "Etiqueta del QR"}
        icon={Tag}
        placeholder={
          kind === "table" ? "Ej. Mesa 5, Terraza A" : "Ej. Caja principal, Propinas"
        }
        error={errors.label?.message}
        {...register("label")}
      />

      {kind === "table" && (
        <FormInput
          label="Capacidad"
          hint="Número de personas"
          icon={Users}
          type="number"
          min={1}
          placeholder="4"
          error={errors.table_capacity?.message}
          {...register("table_capacity")}
        />
      )}

      {kind === "payment" && (
        <FormInput
          label="Monto sugerido"
          optional
          hint="Déjalo vacío para que el cliente decida"
          icon={DollarSign}
          type="number"
          min={0}
          step="0.01"
          placeholder="0.00"
          error={errors.preset_amount?.message}
          {...register("preset_amount")}
        />
      )}

      {!showTablesHint && (
        <div className="flex items-start gap-2 rounded-xl bg-border-soft/40 px-3 py-2 text-[11px] text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            Después de crear el QR podrás verlo, imprimirlo y compartirlo con
            tus clientes.
          </p>
        </div>
      )}

      {error && <Notification tone="error" message={error} />}

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
          disabled={loading}
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
