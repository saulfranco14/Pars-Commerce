import * as yup from "yup";

import { FREQUENT_QUESTIONS, QUESTION_MAX } from "@/features/growth/constants/tlacoAi";

import type { FrequentQuestionId } from "@/features/growth/interfaces/tlacoAi";

const count = () => yup.number().typeError("Número inválido.").integer().min(0).max(100_000).required();

export const todayPlanSchema = yup.object({
  dueToday: count(),
  overdue: count(),
  replied: count(),
  hot: count(),
  cold: count(),
  sentToday: count(),
  dailyGoal: count(),
  visitsToday: count(),
  repliedName: yup.string().trim().max(120).nullable().default(null),
});

export const askQuestionSchema = yup.object({
  question: yup.string().trim().min(3, "Escribe tu duda.").max(QUESTION_MAX, `Máximo ${QUESTION_MAX} caracteres.`).required("Escribe tu duda."),
});

export type AskTlacoFormValues = yup.InferType<typeof askQuestionSchema>;

/** The route also accepts which frequent question was tapped. */
export const askTlacoSchema = askQuestionSchema.shape({
  id: yup.mixed<FrequentQuestionId>().oneOf(FREQUENT_QUESTIONS.map((item) => item.id)).optional(),
});
