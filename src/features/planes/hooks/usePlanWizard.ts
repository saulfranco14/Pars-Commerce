"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import useSWR from "swr";

import { useWizardSteps } from "@/hooks/useWizardSteps";
import { usePromotionCatalog } from "@/features/promociones/hooks/usePromotionCatalog";

import { swrFetcher } from "@/lib/swrFetcher";
import { findTemplate } from "@/features/promociones/helpers/templateSuggestions";
import {
  EMPTY_PLAN_VALUES,
  planListValue,
  planValuesFromPlan,
  planValuesFromTemplate,
  suggestPlanName,
  toPlanPayload,
} from "@/features/planes/helpers/planWizardMapping";
import { createPlan, getPlan, updatePlan } from "@/features/planes/services/plansClientService";
import { PLAN_STEP_FIELDS, planWizardSchema } from "@/features/planes/validations/planWizardSchema";

import type { PlanWizardStep, PlanWizardValues } from "@/features/planes/interfaces/planWizard";

const CREATE_STEPS: PlanWizardStep[] = ["plantilla", "incluye", "precio", "entrega", "presentacion", "revisar"];
const EDIT_STEPS: PlanWizardStep[] = ["incluye", "precio", "entrega", "presentacion", "revisar"];

interface FulfillmentSettings {
  settings: { pickup_enabled?: boolean; delivery_enabled?: boolean; delivery_fee?: number | string } | null;
}

interface UsePlanWizardParams {
  tenantId: string | null;
  planId?: string | null;
  templateKey?: string | null;
  onClose: () => void;
  onSaved: (id: string) => void;
}

export function usePlanWizard({ tenantId, planId, templateKey, onClose, onSaved }: UsePlanWizardParams) {
  const isEdit = Boolean(planId);
  const steps = isEdit ? EDIT_STEPS : CREATE_STEPS;
  const wizard = useWizardSteps({ total: steps.length, onClose });
  const catalog = usePromotionCatalog(tenantId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<PlanWizardValues>({
    resolver: yupResolver(planWizardSchema),
    mode: "onChange",
    defaultValues: templateKey ? planValuesFromTemplate(templateKey) : EMPTY_PLAN_VALUES,
  });

  const { data: existing, isLoading: loadingExisting } = useSWR(
    planId ? ["offer-plan", planId] : null,
    () => getPlan(planId as string),
    { revalidateOnFocus: false },
  );
  useEffect(() => {
    if (existing) form.reset(planValuesFromPlan(existing));
  }, [existing, form]);

  const { data: fulfillment } = useSWR<FulfillmentSettings>(
    tenantId ? `/api/tenant-fulfillment?tenant_id=${encodeURIComponent(tenantId)}` : null,
    swrFetcher,
    { revalidateOnFocus: false },
  );

  // A template link (?template=…) already chose the starting point.
  useEffect(() => {
    if (!isEdit && findTemplate(templateKey)?.kind === "subscription" && wizard.step === 0) wizard.setStep(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on first render
  }, []);

  const stepKey = steps[wizard.step];
  const values = form.watch();
  const products = useMemo(() => catalog.items.filter((item) => item.type === "product"), [catalog.items]);
  const nameOf = (id: string) => catalog.itemsById.get(id)?.name;
  const listValue = planListValue(values.items, (id) => catalog.itemsById.get(id)?.price);

  function chooseTemplate(key: string | null) {
    form.reset(key ? planValuesFromTemplate(key) : { ...EMPTY_PLAN_VALUES });
    wizard.goForward();
  }

  async function save(status: "active" | "draft") {
    if (!tenantId) return;
    setError(null);
    if (!(await form.trigger())) {
      setError("Revisa los datos marcados antes de guardar.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = toPlanPayload(form.getValues(), status);
      const result = planId ? await updatePlan(planId, payload) : await createPlan({ ...payload, tenant_id: tenantId });
      onSaved(result.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar el plan.");
    } finally {
      setSubmitting(false);
    }
  }

  async function next() {
    setError(null);
    if (stepKey === "revisar") return save("active");
    if (!(await form.trigger(PLAN_STEP_FIELDS[stepKey]))) return;
    if (stepKey === "entrega" && !form.getValues("name").trim()) {
      form.setValue("name", suggestPlanName(form.getValues(), nameOf), { shouldValidate: true });
    }
    wizard.goForward();
  }

  function back() {
    setError(null);
    if (wizard.isFirstStep) onClose();
    else wizard.goBack();
  }

  return {
    form,
    values,
    steps,
    stepKey,
    step: wizard.step,
    isEdit,
    loading: isEdit && loadingExisting,
    products,
    itemsById: catalog.itemsById,
    listValue,
    pickupEnabled: fulfillment?.settings?.pickup_enabled === true,
    deliveryEnabled: fulfillment?.settings?.delivery_enabled === true,
    deliveryFee: Number(fulfillment?.settings?.delivery_fee ?? 0),
    submitting,
    error,
    chooseTemplate,
    next,
    back,
    saveDraft: () => save("draft"),
    suggestName: () => form.setValue("name", suggestPlanName(form.getValues(), nameOf), { shouldValidate: true }),
  };
}
