"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import useSWR from "swr";

import { useWizardSteps } from "@/hooks/useWizardSteps";
import { usePromotionCatalog } from "@/features/promociones/hooks/usePromotionCatalog";

import {
  EMPTY_WIZARD_VALUES,
  toPromotionPayload,
  valuesFromPromotion,
  valuesFromTemplate,
} from "@/features/promociones/helpers/offerWizardMapping";
import { suggestPromotionName } from "@/features/promociones/helpers/promotionNaming";
import { findTemplate } from "@/features/promociones/helpers/templateSuggestions";
import {
  createPromotion,
  getPromotion,
  updatePromotion,
} from "@/features/promociones/services/promotionsClientService";
import { offerWizardSchema, STEP_FIELDS } from "@/features/promociones/validations/offerWizardSchema";

import type { OfferWizardStep, OfferWizardValues } from "@/features/promociones/interfaces/offerWizard";

const CREATE_STEPS: OfferWizardStep[] = ["plantilla", "mecanica", "productos", "detalles", "revisar"];
const EDIT_STEPS: OfferWizardStep[] = ["mecanica", "productos", "detalles", "revisar"];

interface UseOfferWizardParams {
  tenantId: string | null;
  promotionId?: string | null;
  templateKey?: string | null;
  onClose: () => void;
  onSaved: (id: string) => void;
}

export function useOfferWizard({ tenantId, promotionId, templateKey, onClose, onSaved }: UseOfferWizardParams) {
  const isEdit = Boolean(promotionId);
  const steps = isEdit ? EDIT_STEPS : CREATE_STEPS;
  const wizard = useWizardSteps({ total: steps.length, onClose });
  const catalog = usePromotionCatalog(tenantId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<OfferWizardValues>({
    resolver: yupResolver(offerWizardSchema),
    mode: "onChange",
    defaultValues: templateKey ? valuesFromTemplate(templateKey) : EMPTY_WIZARD_VALUES,
  });

  const { data: existing, isLoading: loadingExisting } = useSWR(
    promotionId ? ["promotion", promotionId] : null,
    () => getPromotion(promotionId as string),
    { revalidateOnFocus: false },
  );
  useEffect(() => {
    if (existing) form.reset(valuesFromPromotion(existing));
  }, [existing, form]);

  // A template link (?template=…) already chose the starting point.
  useEffect(() => {
    if (!isEdit && findTemplate(templateKey)?.kind === "promotion" && wizard.step === 0) wizard.setStep(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on first render
  }, []);

  const stepKey = steps[wizard.step];
  const values = form.watch();
  const nameOf = useMemo(() => (id: string) => catalog.itemsById.get(id)?.name, [catalog.itemsById]);

  function chooseTemplate(key: string | null) {
    form.reset(key ? valuesFromTemplate(key) : { ...EMPTY_WIZARD_VALUES });
    wizard.goForward();
  }

  async function save(status: "active" | "draft") {
    if (!tenantId) return;
    setError(null);
    const valid = await form.trigger();
    if (!valid) {
      setError("Revisa los datos marcados antes de guardar.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = toPromotionPayload(form.getValues(), status);
      const result = promotionId
        ? await updatePromotion(promotionId, payload)
        : await createPromotion({ ...payload, tenant_id: tenantId });
      onSaved(result.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar la promoción.");
    } finally {
      setSubmitting(false);
    }
  }

  async function next() {
    setError(null);
    if (stepKey === "revisar") return save("active");
    const ok = await form.trigger(STEP_FIELDS[stepKey]);
    if (!ok) return;
    if (stepKey === "productos" && !form.getValues("name").trim()) {
      form.setValue("name", suggestPromotionName(form.getValues(), nameOf), { shouldValidate: true });
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
    catalog,
    nameOf,
    submitting,
    error,
    chooseTemplate,
    next,
    back,
    saveDraft: () => save("draft"),
    suggestName: () => form.setValue("name", suggestPromotionName(form.getValues(), nameOf), { shouldValidate: true }),
  };
}
