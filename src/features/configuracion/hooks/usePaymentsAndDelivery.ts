"use client";

import { useEffect, useState } from "react";

import {
  EMPTY_PAYMENTS_AND_DELIVERY,
  toPaymentsAndDeliveryForm,
  validatePickupPoint,
} from "@/features/configuracion/helpers/paymentsAndDeliveryForm";
import {
  getPaymentsAndDelivery,
  savePaymentsAndDelivery,
} from "@/features/configuracion/services/paymentsAndDeliveryClient";

import type {
  PaymentsAndDeliveryForm,
  PaymentsAndDeliverySnapshot,
  PickupPointDraft,
  PickupPointTab,
} from "@/features/configuracion/interfaces/paymentsAndDelivery";

const message = (cause: unknown, fallback: string) => (cause instanceof Error ? cause.message : fallback);

/** How the business charges and hands orders over: load, edit, pickup-point editor and save. */
export function usePaymentsAndDelivery(tenantId: string) {
  const [saved, setSaved] = useState<PaymentsAndDeliverySnapshot | null>(null);
  const [form, setForm] = useState<PaymentsAndDeliveryForm>(EMPTY_PAYMENTS_AND_DELIVERY);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pointEditor, setPointEditor] = useState<{ index: number | null; value: PickupPointDraft } | null>(null);
  const [pointTab, setPointTab] = useState<PickupPointTab>("location");
  const [pointError, setPointError] = useState<string | null>(null);

  async function load() {
    const next = await getPaymentsAndDelivery(tenantId);
    setSaved(next);
    setForm(toPaymentsAndDeliveryForm(next));
  }

  useEffect(() => {
    void load().catch((cause) => setError(message(cause, "No se pudo cargar la configuración.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when the business changes
  }, [tenantId]);

  function update<Key extends keyof PaymentsAndDeliveryForm>(key: Key, value: PaymentsAndDeliveryForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      await savePaymentsAndDelivery(tenantId, form);
      await load();
      setNotice("Guardado. Tu equipo y tus clientes ya ven solo las opciones activas.");
    } catch (cause) {
      setError(message(cause, "No se pudo guardar."));
    } finally {
      setSaving(false);
    }
  }

  return {
    loading: !saved && !error,
    saved,
    form,
    update,
    saving,
    notice,
    error,
    save,
    pickup: {
      editor: pointEditor,
      tab: pointTab,
      setTab: setPointTab,
      error: pointError,
      open(index: number | null, value: PickupPointDraft) {
        setPointTab("location");
        setPointError(null);
        setPointEditor({ index, value });
      },
      change(value: PickupPointDraft) {
        setPointError(null);
        setPointEditor((current) => (current ? { ...current, value } : current));
      },
      close() {
        setPointEditor(null);
        setPointError(null);
      },
      commit() {
        if (!pointEditor) return;
        const result = validatePickupPoint(pointEditor.value);
        if (!result.ok) {
          setPointError(result.message);
          setPointTab("location");
          return;
        }
        const { index } = pointEditor;
        setForm((current) => ({
          ...current,
          pickup_points:
            index === null ? [...current.pickup_points, result.point] : current.pickup_points.map((p, i) => (i === index ? result.point : p)),
        }));
        setPointEditor(null);
        setPointError(null);
      },
      remove(index: number) {
        setForm((current) => ({ ...current, pickup_points: current.pickup_points.filter((_, i) => i !== index) }));
      },
    },
  };
}
