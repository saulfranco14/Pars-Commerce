import {
  DEFAULT_ERROR_MESSAGE,
  MERCADOPAGO_DEFAULT_MESSAGE,
  MERCADOPAGO_ERROR_CODES,
  SENDGRID_DEFAULT_MESSAGE,
  SENDGRID_SERVER_ERROR_MESSAGE,
  SENDGRID_STATUS_MESSAGES,
  SUPABASE_AUTH_ERRORS,
  SUPABASE_MESSAGE_FALLBACKS,
} from "./errorMessages";

type ErrorLike = {
  code?: string;
  message?: string;
  status?: number;
  response?: {
    status?: number;
    statusCode?: number;
    body?: { errors?: { message?: string }[] };
  };
};

export type ErrorSource = "supabase" | "sendgrid" | "mercadopago" | null;

export function resolveUserError(
  error: unknown,
  source: ErrorSource = null
): string {
  const err = error as ErrorLike;
  const msg = err?.message ?? (typeof error === "string" ? error : "");

  if (source === "supabase" || source === null) {
    if (err?.code && SUPABASE_AUTH_ERRORS[err.code]) {
      return SUPABASE_AUTH_ERRORS[err.code];
    }
    const trimmedMsg = typeof msg === "string" ? msg.trim() : "";
    if (trimmedMsg && SUPABASE_MESSAGE_FALLBACKS[trimmedMsg]) {
      return SUPABASE_MESSAGE_FALLBACKS[trimmedMsg];
    }
    if (trimmedMsg && source === "supabase") {
      return trimmedMsg;
    }
  }

  if (source === "sendgrid") {
    const status = err?.response?.status ?? err?.response?.statusCode;
    if (status && SENDGRID_STATUS_MESSAGES[status]) {
      return SENDGRID_STATUS_MESSAGES[status];
    }
    if (status && status >= 500) {
      return SENDGRID_SERVER_ERROR_MESSAGE;
    }
    return msg || SENDGRID_DEFAULT_MESSAGE;
  }

  if (source === "mercadopago") {
    const code = err?.code;
    if (code && MERCADOPAGO_ERROR_CODES[code]) {
      return MERCADOPAGO_ERROR_CODES[code];
    }
    const firstError = err?.response?.body?.errors?.[0]?.message;
    if (firstError) {
      return firstError;
    }
    return msg || MERCADOPAGO_DEFAULT_MESSAGE;
  }

  return msg || DEFAULT_ERROR_MESSAGE;
}
