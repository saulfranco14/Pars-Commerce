import { templatePlaceholders } from "@/features/growth/helpers/renderTemplate";
import {
  EMAIL_SUBJECT_MAX_CHARS,
  STEPS_REQUIRING_LINK,
  TEMPLATE_VARIABLE_KEYS,
  WHATSAPP_MAX_CHARS,
} from "@/features/growth/constants/templateVariables";

import type { TemplateDraft } from "@/features/growth/interfaces/template";

export function validateTemplate(draft: TemplateDraft): string[] {
  const errors: string[] = [];
  const body = draft.body.trim();
  const subject = draft.subject?.trim() ?? "";

  if (body.length < 10) errors.push("El mensaje es demasiado corto.");
  if (draft.channel === "whatsapp" && body.length > WHATSAPP_MAX_CHARS) {
    errors.push(`El WhatsApp no puede pasar de ${WHATSAPP_MAX_CHARS} caracteres.`);
  }
  if (draft.channel === "email") {
    if (!subject) errors.push("El correo necesita un asunto.");
    if (subject.length > EMAIL_SUBJECT_MAX_CHARS) errors.push(`El asunto no puede pasar de ${EMAIL_SUBJECT_MAX_CHARS} caracteres.`);
  }

  const unknown = [...new Set(templatePlaceholders(`${subject} ${body}`).filter((key) => !TEMPLATE_VARIABLE_KEYS.has(key)))];
  if (unknown.length) errors.push(`Estas variables no existen: ${unknown.map((key) => `{${key}}`).join(", ")}.`);

  if (STEPS_REQUIRING_LINK.includes(draft.step) && !body.includes("{link}")) {
    errors.push("Este paso necesita el link a su tienda: agrega {link}.");
  }
  return errors;
}
