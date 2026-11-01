import { SWEEP_PATH } from "@/features/growth/constants/routes";

import type { FrequentQuestion, TlacoAiTopic, TodayStepAction, TodayStepTarget } from "@/features/growth/interfaces/tlacoAi";

/** The tabs of Tlaco IA; a new topic is one more entry here plus its tab. `tlacoOnly` topics are about Tlaco itself. */
export const TLACO_AI_TOPICS: Array<{ value: TlacoAiTopic; label: string; tlacoOnly: boolean }> = [
  { value: "hoy", label: "Hoy", tlacoOnly: false },
  { value: "activar", label: "Para activar", tlacoOnly: true },
  { value: "tour", label: "Te lo enseño", tlacoOnly: true },
];

export const FREQUENT_QUESTIONS: FrequentQuestion[] = [
  { id: "precio", question: "¿Cuánto cuesta?" },
  { id: "comision", question: "¿Cobran comisión?" },
  { id: "terminal", question: "¿Necesita terminal o app?" },
  { id: "registro", question: "¿Qué tiene al registrarse?" },
  { id: "giros", question: "No es restaurante, ¿le sirve?" },
  { id: "pagos", question: "¿Cómo le pagan?" },
  { id: "activo", question: "¿Cuándo queda activo?" },
];

export const TODAY_STEP_TARGET: Record<TodayStepAction, TodayStepTarget> = {
  replied: { list: "conversando" },
  visits: { list: "cita" },
  hot: { list: "caliente" },
  follow_up: { list: "hoy" },
  cold: { sheet: "cold" },
  first: { path: SWEEP_PATH },
};

/** Hours (Mexico City) when writing to a business gets answered; Sunday has none. Index = weekday, 0 = Sunday. */
export const WRITE_WINDOWS: Array<Array<[number, number]>> = [
  [],
  [[10, 13], [16, 19]],
  [[10, 13], [16, 19]],
  [[10, 13], [16, 19]],
  [[10, 13], [16, 19]],
  [[10, 13], [16, 19]],
  [[10, 14]],
];

/** Answering someone who wrote first or cleaning the list is fine any day within these hours. */
export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 21;

export const TOUR_VIDEO_PATH = "/tour/tlaco-te-lo-ensena.mp4";
export const TOUR_VIDEO_SUMMARY = "8 pasos en 38 segundos";

/** The card stops waiting for the AI after this and shows the rules' text; it tries again next time. */
export const TODAY_AI_WAIT_MS = 9000;
export const TODAY_TEXT_MAX = 600;
export const ANSWER_MAX = 700;
export const QUESTION_MAX = 240;

/** What the model answers when the knowledge does not cover the question. */
export const UNKNOWN_MARKER = "NO_LO_SE";
export const UNKNOWN_ANSWER = "Eso no lo tengo en lo que sé de Tlaco. Pregúntale a tu coordinador para no darle un dato equivocado al negocio.";
