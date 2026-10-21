import * as yup from "yup";

import { MAX_PLAN_PRICE } from "@/features/planes/constants/planOptions";

import type { PlanWizardStep, PlanWizardValues } from "@/features/planes/interfaces/planWizard";

export const planWizardSchema: yup.ObjectSchema<PlanWizardValues> = yup.object({
  templateKey: yup.string().nullable().defined(),
  items: yup
    .array(yup.object({ product_id: yup.string().required(), quantity: yup.number().integer().min(1).max(999).required() }))
    .min(1, "Agrega al menos un producto al plan.")
    .required(),
  price: yup
    .string()
    .required("Escribe el precio de cada periodo.")
    .test("positive", "Escribe un precio mayor a $0.", (value) => Number(value) > 0)
    .test("max", "El precio es demasiado alto.", (value) => Number(value) <= MAX_PLAN_PRICE),
  intervalUnit: yup.mixed<"week" | "month">().oneOf(["week", "month"]).required(),
  intervalCount: yup.number().integer().min(1).max(12).required(),
  maxPeriods: yup.number().integer().min(1).max(120).nullable().defined(),
  fulfillmentMethods: yup
    .array(yup.mixed<"pickup" | "delivery">().oneOf(["pickup", "delivery"]).required())
    .min(1, "Elige cómo recibe el cliente su plan.")
    .required(),
  preferredWeekday: yup.number().integer().min(0).max(6).nullable().defined(),
  renewalLeadDays: yup.number().integer().min(0).max(14).required(),
  graceDays: yup.number().integer().min(0).max(30).required(),
  maxActiveMembers: yup
    .string()
    .defined()
    .test("members", "El cupo debe ser un número mayor a 0.", (value) => !value || Number.parseInt(value, 10) > 0),
  name: yup.string().trim().min(3, "El nombre debe tener al menos 3 caracteres.").max(80).required("Ponle nombre al plan."),
  description: yup.string().max(500, "La descripción admite hasta 500 caracteres.").defined(),
  imageUrl: yup.string().defined(),
});

export const PLAN_STEP_FIELDS: Record<PlanWizardStep, Array<keyof PlanWizardValues>> = {
  plantilla: [],
  incluye: ["items"],
  precio: ["price", "intervalUnit", "intervalCount", "maxPeriods"],
  entrega: ["fulfillmentMethods", "preferredWeekday", "maxActiveMembers"],
  presentacion: ["name", "description"],
  revisar: [],
};
