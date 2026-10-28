import * as yup from "yup";

import type { FollowUpAction } from "@/features/growth/interfaces/lead";

export const FOLLOW_UP_ACTIONS: FollowUpAction[] = ["schedule_visit", "reschedule_visit", "cancel_visit", "remind", "pause", "resume", "note"];
const DATED: FollowUpAction[] = ["schedule_visit", "reschedule_visit", "remind", "pause"];

export const followUpBodySchema = yup.object({
  action: yup.mixed<FollowUpAction>().oneOf(FOLLOW_UP_ACTIONS, "Acción no válida.").required("Acción no válida."),
  at: yup
    .string()
    .nullable()
    .test("iso", "Fecha no válida.", (value) => !value || !Number.isNaN(Date.parse(value)))
    .when("action", { is: (action: FollowUpAction) => DATED.includes(action), then: (schema) => schema.required("Elige la fecha.") }),
  note: yup.string().trim().max(280, "La nota no puede pasar de 280 caracteres.").nullable(),
});

export type FollowUpBody = yup.InferType<typeof followUpBodySchema>;

/** The sheet asks for a date only where the action needs one, and for a note only when it is the whole point. */
export function followUpFormSchema(action: FollowUpAction) {
  return yup.object({
    date: DATED.includes(action) ? yup.string().required("Elige la fecha.") : yup.string().default(""),
    time: yup.string().default(""),
    note: action === "note"
      ? yup.string().trim().min(2, "Escribe la nota.").max(280, "Máximo 280 caracteres.").required("Escribe la nota.")
      : yup.string().trim().max(280, "Máximo 280 caracteres.").default(""),
  });
}

export interface FollowUpFormValues {
  date: string;
  time: string;
  note: string;
}
