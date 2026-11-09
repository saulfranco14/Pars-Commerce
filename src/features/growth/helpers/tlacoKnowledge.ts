import { ACTIVATION_STAGES } from "@/features/growth/constants/activation";
import { TOUR_VIDEO_SUMMARY } from "@/features/growth/constants/tlacoAi";
import { FAQS } from "@/features/landing/constants/faqs";
import {
  PLATFORM_CAPABILITIES,
  PLATFORM_GROUPS,
} from "@/features/landing/constants/platform";
import { planCapabilities } from "@/features/landing/constants/pricing";
import {
  MP_FEE_FIXED_MXN,
  MP_FEE_PERCENT,
  TARIFA_DE_SERVICIO_LABEL,
  TLACO_SERVICE_FEE_PERCENT,
} from "@/constants/commissionConfig";

import type { BillingPlan } from "@/features/billing/entitlements";
import type { StudioPlan } from "@/features/studio/interfaces/studio";
import type { FrequentQuestionId } from "@/features/growth/interfaces/tlacoAi";

const money = (amount: number) =>
  `$${amount.toLocaleString("es-MX", { maximumFractionDigits: 2 })}`;
const percent = (rate: number) =>
  `${(rate * 100).toLocaleString("es-MX", { maximumFractionDigits: 2 })} %`;

/** Written in «usted» so the prospector can forward it to the business as is. */
function priceAnswer(plans: BillingPlan[]): string {
  const free = plans.find((plan) => plan.amount_mxn === 0);
  const paid = plans.filter((plan) => plan.amount_mxn > 0);
  const start = free
    ? `Puede empezar con Tlaco ${free.name}, $0 al mes y sin tarjeta.`
    : "";
  const list = paid.map(
    (plan) =>
      `${plan.name} ${money(plan.amount_mxn)} al mes (unos ${money(Math.round(plan.amount_mxn / 30))} al día)`,
  );
  const options = list.length
    ? ` Si después necesita más, ${list.length === 1 ? "hay un plan" : `hay ${list.length} planes`}: ${list.join(", ")}.`
    : "";
  return `${start}${options} Lo cambia o lo cancela desde su panel, sin hablar con soporte.`.trim();
}

/** From the same constants the checkout charges with, so it never drifts from what the business pays. */
function commissionAnswer(): string {
  const own =
    TLACO_SERVICE_FEE_PERCENT === 0
      ? "Tlaco no cobra comisión por venta."
      : `Tlaco cobra ${percent(TLACO_SERVICE_FEE_PERCENT)} por venta.`;
  return [
    own,
    `Cuando su cliente paga con tarjeta, la red de pagos cobra ${percent(MP_FEE_PERCENT)} + ${money(MP_FEE_FIXED_MXN)} por pago, con IVA incluido.`,
    `En su tienda en línea y en los links de pago esa comisión se le suma a su cliente como «${TARIFA_DE_SERVICIO_LABEL}»; en los pedidos con QR la absorbe usted.`,
    "Los meses sin intereses tienen un costo extra según el plazo, que se ve al pagar.",
  ].join(" ");
}

function activeAnswer(): string {
  const active = ACTIVATION_STAGES[ACTIVATION_STAGES.length - 1];
  return `Va por pasos: ${ACTIVATION_STAGES.map((stage) => stage.label.toLowerCase()).join(", ")}. Cuenta como ${active.label.toLowerCase()} con ${active.hint
    .replace(/\s*Listo\.$/, "")
    .replace(/\.$/, "")
    .toLowerCase()}.`;
}

const FIXED: Record<
  Exclude<FrequentQuestionId, "precio" | "comision" | "activo">,
  { answer: string; source: string }
> = {
  terminal: {
    answer:
      "No. Su cliente escanea el QR con la cámara de su celular y todo se abre en el navegador, sin descargar nada ni crear cuenta. Tampoco necesita terminal ni lector: su cliente paga desde su propio teléfono.",
    source: "Preguntas frecuentes de tlaco.app",
  },
  registro: {
    answer:
      "Al registrarse tiene su catálogo de productos y servicios, su tienda en línea con su propio enlace, promociones como 2x1 y paquetes, y cobro con tarjeta sin terminal, donde sus clientes pueden dividir la cuenta.",
    source: "Video «Tlaco te lo enseña»",
  },
  giros: {
    answer:
      "Sí. Lo usan autolavados, talleres, estéticas, tiendas y negocios de servicios. Usted define su catálogo y el flujo es el mismo: su cliente pide, usted marca el avance y le pagan.",
    source: "Preguntas frecuentes de tlaco.app",
  },
  pagos: {
    answer:
      "Sus clientes pagan con tarjeta de crédito, débito y otros métodos, incluso a meses sin intereses. El cobro lo procesa una red de pagos certificada y el dinero se deposita en la cuenta bancaria que usted registre.",
    source: "Preguntas frecuentes de tlaco.app",
  },
};

/** The fixed answer to one of the frequent questions; prices and fees always come from the platform itself. */
export function frequentAnswer(
  id: FrequentQuestionId,
  plans: BillingPlan[],
  studioPlans: StudioPlan[] = [],
): { answer: string; source: string } {
  if (id === "precio")
    return {
      answer: [
        priceAnswer(plans),
        ...(studioPlans.length
          ? [
              `Tlaco Studio se contrata por separado por negocio: ${studioPlans.map((p) => `${p.name} ${money(p.amount_mxn)} al mes con ${p.monthly_tlacos} Tlacos`).join(", ")}. Precios finales con IVA incluido.`,
            ]
          : []),
      ].join(" "),
      source: "Planes de Tlaco",
    };
  if (id === "comision")
    return {
      answer: commissionAnswer(),
      source: "Comisiones de la plataforma",
    };
  if (id === "activo")
    return { answer: activeAnswer(), source: "Pasos de activación" };
  return FIXED[id];
}

/** What Tlaco IA knows, read from the platform's own sources (plans, fees, features, FAQ, activation); it answers only from this. */
export function buildKnowledge(
  plans: BillingPlan[],
  studioPlans: StudioPlan[] = [],
  studioAvailability = { ai: false, publish: false, checkout: false },
): string {
  return [
    "QUÉ HACE TLACO",
    ...PLATFORM_GROUPS.map(
      (group) => `- ${group.label}: ${group.headline}. ${group.description}`,
    ),
    ...PLATFORM_CAPABILITIES.filter(
      (item) =>
        !item.availability ||
        (item.availability === "studio" && studioPlans.length > 0),
    ).map(
      (item) =>
        `- ${item.title}: ${item.owner}${item.customer ? ` Su cliente: ${item.customer}` : ""}`,
    ),
    "",
    "PLANES",
    ...plans.map(
      (plan) =>
        `- ${plan.name}: ${money(plan.amount_mxn)} al mes. ${planCapabilities(plan).join(". ")}.`,
    ),
    priceAnswer(plans),
    ...(studioPlans.length
      ? [
          "TLACO STUDIO (COMPLEMENTO)",
          ...studioPlans.map(
            (p) =>
              `- ${p.name}: ${money(p.amount_mxn)} MXN al mes, IVA incluido; ${p.monthly_tlacos} Tlacos mensuales.`,
          ),
          "Crear y editar requiere membresía Studio vigente por negocio. Edición manual y exportación: 0 Tlacos. IA económica 1, premium 2, con costo confirmado. Mensuales vencen por periodo; recargas se conservan. Al vencer se consulta y descarga lo existente. No publica automáticamente en redes. Información: /studio.",
          studioAvailability.ai
            ? "Generación y diagnóstico IA habilitados, sujetos a membresía, saldo y cuotas."
            : "La IA no está habilitada en este momento. No ofrecer generaciones ni diagnósticos como disponibles.",
          studioAvailability.publish
            ? "Publicación interna habilitada en las superficies de sitio y QR compatibles."
            : "La publicación interna no está habilitada. Solo ofrecer descarga y compartir archivos.",
          studioAvailability.checkout
            ? "Contratación Studio habilitada."
            : "La contratación de Studio no está habilitada. Se puede explorar el producto sin realizar cargos.",
        ]
      : []),
    "",
    "COMISIONES",
    commissionAnswer(),
    "",
    "PREGUNTAS FRECUENTES",
    ...FAQS.map((faq) => `- ${faq.question} ${faq.answer}`),
    ...Object.values(FIXED).map((entry) => `- ${entry.answer}`),
    "",
    "PASOS PARA ACTIVAR UN NEGOCIO",
    ...ACTIVATION_STAGES.map((stage) => `- ${stage.label}: ${stage.hint}`),
    "",
    `VIDEO «TLACO TE LO ENSEÑA»: ${TOUR_VIDEO_SUMMARY}. Muestra el catálogo de productos y servicios, las promociones, cobrar sin terminal con tarjeta y dividir la cuenta, y que se empieza con $0 al mes.`,
  ].join("\n");
}
