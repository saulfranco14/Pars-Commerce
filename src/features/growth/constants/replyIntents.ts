import type { ReplyIntent } from "@/features/growth/helpers/replyAssist";

export const REPLY_INTENT_LABEL: Record<ReplyIntent, string> = {
  precio: "Dio su precio",
  costo: "Pregunta cuánto cuesta",
  interes: "Le interesa",
  duda: "Tiene una duda",
  rechazo: "No le interesa",
  otro: "Respondió",
};
