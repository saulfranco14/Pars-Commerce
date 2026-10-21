import * as yup from "yup";

import { MAX_PERCENTAGE_DISCOUNT } from "@/lib/offers/pricing";

import type { OfferWizardStep, OfferWizardValues } from "@/features/promociones/interfaces/offerWizard";

const money = (message: string) =>
  yup.string().test("positive-money", message, (value) => Number(value) > 0);

export const offerWizardSchema: yup.ObjectSchema<OfferWizardValues> = yup.object({
  templateKey: yup.string().nullable().defined(),
  mechanic: yup
    .mixed<OfferWizardValues["mechanic"]>()
    .oneOf(["percentage", "fixed_amount", "fixed_price", "nxm", "bundle_price", "event_badge"])
    .required("Elige cómo funciona la promoción."),
  appliesToAll: yup.boolean().defined(),
  productIds: yup
    .array(yup.string().defined())
    .defined()
    .when(["mechanic", "appliesToAll", "subcatalogIds"], ([mechanic, appliesToAll, subcatalogIds], schema) => {
      if (mechanic === "nxm") return schema.length(1, "El 2x1 se aplica a un producto; elige uno.");
      if (mechanic === "fixed_price") return schema.min(1, "Elige al menos un producto.");
      if (mechanic === "bundle_price" || mechanic === "event_badge") return schema;
      return appliesToAll || (subcatalogIds as string[]).length > 0
        ? schema
        : schema.min(1, "Elige productos, una categoría o toda la tienda.");
    }),
  subcatalogIds: yup.array(yup.string().defined()).defined(),
  packItems: yup
    .array(yup.object({ product_id: yup.string().required(), quantity: yup.number().min(1).max(999).required() }))
    .defined()
    .when("mechanic", ([mechanic], schema) =>
      mechanic === "bundle_price"
        ? schema.test("pack-size", "Un paquete necesita al menos 2 piezas.", (items) =>
            (items ?? []).reduce((sum, item) => sum + Number(item.quantity), 0) >= 2,
          )
        : schema,
    ),
  value: yup
    .string()
    .defined()
    .when("mechanic", ([mechanic], schema) => {
      if (mechanic === "percentage") {
        return schema.test(
          "percentage-range",
          `El descuento debe estar entre 1% y ${MAX_PERCENTAGE_DISCOUNT}%.`,
          (value) => Number(value) >= 1 && Number(value) <= MAX_PERCENTAGE_DISCOUNT,
        );
      }
      if (mechanic === "fixed_amount") return money("Indica cuántos pesos descontar.");
      if (mechanic === "fixed_price") return money("Indica el precio especial.");
      if (mechanic === "bundle_price") return money("Indica el precio del paquete.");
      return schema;
    }),
  buyQuantity: yup.number().integer().min(2).max(10).required(),
  payQuantity: yup
    .number()
    .integer()
    .min(1)
    .required()
    .test("pay-less", "Debe pagar menos piezas de las que lleva.", function (pay) {
      return this.parent.mechanic !== "nxm" || Number(pay) < Number(this.parent.buyQuantity);
    }),
  badgeLabel: yup
    .string()
    .defined()
    .when("mechanic", ([mechanic], schema) =>
      mechanic === "event_badge" ? schema.trim().min(2, "Escribe la etiqueta, por ejemplo Buen Fin.").max(30) : schema,
    ),
  validity: yup.mixed<OfferWizardValues["validity"]>().oneOf(["none", "weekend", "week", "month", "custom"]).required(),
  validFrom: yup.string().defined(),
  validUntil: yup
    .string()
    .defined()
    .test("after-start", "La fecha de fin debe ser después del inicio.", function (until) {
      const from = this.parent.validFrom as string;
      return !from || !until || until >= from;
    })
    .when(["validity", "mechanic"], ([validity, mechanic], schema) =>
      validity === "custom" || mechanic === "event_badge"
        ? schema.test("custom-dates", "Elige hasta cuándo dura.", (until) => Boolean(until))
        : schema,
    ),
  name: yup.string().trim().min(2, "Ponle un nombre.").max(80, "Máximo 80 caracteres.").required("Ponle un nombre."),
  description: yup.string().max(300, "Máximo 300 caracteres.").defined(),
  imageUrl: yup.string().defined(),
});

/** Fields validated before leaving each step. */
export const STEP_FIELDS: Record<OfferWizardStep, (keyof OfferWizardValues)[]> = {
  plantilla: [],
  mecanica: ["mechanic"],
  productos: ["productIds", "subcatalogIds", "packItems", "appliesToAll"],
  detalles: ["value", "buyQuantity", "payQuantity", "badgeLabel", "validity", "validFrom", "validUntil", "name", "description"],
  revisar: [],
};
