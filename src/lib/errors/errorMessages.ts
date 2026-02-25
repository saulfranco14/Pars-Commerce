export const DEFAULT_ERROR_MESSAGE =
  "Ocurrió un error. Intenta de nuevo.";

export const SUPABASE_AUTH_ERRORS: Record<string, string> = {
  same_password: "La nueva contraseña debe ser distinta a la actual.",
  weak_password: "La contraseña no cumple los requisitos de seguridad.",
  invalid_credentials: "Email o contraseña incorrectos.",
  email_not_confirmed: "Confirma tu email antes de iniciar sesión.",
  email_exists: "Este email ya está registrado.",
  user_not_found: "Usuario no encontrado.",
  over_email_send_rate_limit:
    "Demasiados intentos. Espera unos minutos e intenta de nuevo.",
  over_request_rate_limit:
    "Demasiadas peticiones. Intenta en unos minutos.",
  session_expired: "Tu sesión expiró. Inicia sesión de nuevo.",
  session_not_found: "Sesión no encontrada. Inicia sesión de nuevo.",
  flow_state_expired: "El enlace expiró. Solicita uno nuevo.",
  flow_state_not_found: "El enlace ya no es válido. Solicita uno nuevo.",
  user_banned: "Tu cuenta está suspendida.",
  provider_disabled: "Este método de inicio de sesión no está disponible.",
  email_address_not_authorized:
    "No podemos enviar correos a esta dirección.",
  email_address_invalid: "Usa una dirección de email válida.",
};

export const SUPABASE_MESSAGE_FALLBACKS: Record<string, string> = {
  "New password should be different from the old password.":
    "La nueva contraseña debe ser distinta a la actual.",
  "New password should be different from the old password":
    "La nueva contraseña debe ser distinta a la actual.",
};

export const SENDGRID_STATUS_MESSAGES: Record<number, string> = {
  401: "Tu API key es inválida o expiró. Revisa la configuración.",
  403: "No tienes permiso para enviar desde este correo.",
  429: "Demasiados envíos. Espera un momento.",
};

export const SENDGRID_DEFAULT_MESSAGE =
  "No pudimos enviar el correo. Intenta de nuevo.";

export const SENDGRID_SERVER_ERROR_MESSAGE =
  "El servicio de correo no está disponible. Intenta más tarde.";

export const MERCADOPAGO_ERROR_CODES: Record<string, string> = {
  invalid_credentials:
    "Error de configuración de pago. Contacta al vendedor.",
  required_properties: "Faltan datos necesarios para el pago.",
  property_value: "Hay datos inválidos en el pago.",
  json_syntax_error: "Error interno. Intenta de nuevo.",
};

export const MERCADOPAGO_DEFAULT_MESSAGE =
  "Error al procesar el pago. Intenta de nuevo.";
