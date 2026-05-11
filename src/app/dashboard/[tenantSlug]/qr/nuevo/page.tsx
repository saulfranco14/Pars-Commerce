"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { createQrCode } from "@/features/qr/services/qrCodesService";
import { useActiveTenant } from "@/stores/useTenantStore";

export default function NewQrPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useActiveTenant();
  const [kind, setKind] = useState<"payment" | "table">("table");
  const [label, setLabel] = useState("");
  const [tableCapacity, setTableCapacity] = useState("4");
  const [presetAmount, setPresetAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubmitDisabled = useMemo(() => {
    if (!label.trim()) return true;
    return loading;
  }, [label, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTenant) return;
    setLoading(true);
    setError(null);
    try {
      await createQrCode({
        tenant_id: activeTenant.id,
        kind,
        label,
        table_capacity: kind === "table" ? Number(tableCapacity) : null,
        preset_amount: kind === "payment" ? Number(presetAmount || 0) : null,
      });
      router.push(`/dashboard/${tenantSlug}/qr`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear QR");
    } finally {
      setLoading(false);
    }
  }

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Nuevo QR</h1>
      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border p-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        <label className="block space-y-1">
          <span className="text-sm text-muted-foreground">Tipo</span>
          <select
            className="w-full rounded-lg border border-border px-3 py-2"
            value={kind}
            onChange={(e) => setKind(e.target.value as "payment" | "table")}
          >
            <option value="table">Mesa</option>
            <option value="payment">Cobro libre</option>
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-muted-foreground">Etiqueta</span>
          <input
            className="w-full rounded-lg border border-border px-3 py-2"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={kind === "table" ? "Mesa 5" : "Caja principal"}
          />
        </label>
        {kind === "table" ? (
          <label className="block space-y-1">
            <span className="text-sm text-muted-foreground">Capacidad</span>
            <input
              type="number"
              min={1}
              className="w-full rounded-lg border border-border px-3 py-2"
              value={tableCapacity}
              onChange={(e) => setTableCapacity(e.target.value)}
            />
          </label>
        ) : (
          <label className="block space-y-1">
            <span className="text-sm text-muted-foreground">
              Monto predeterminado (opcional)
            </span>
            <input
              type="number"
              step="0.01"
              min={0}
              className="w-full rounded-lg border border-border px-3 py-2"
              value={presetAmount}
              onChange={(e) => setPresetAmount(e.target.value)}
            />
          </label>
        )}
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="w-full min-h-[44px] rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Crear código QR"}
        </button>
      </form>
    </div>
  );
}
