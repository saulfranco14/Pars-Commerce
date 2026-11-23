import { ZodError } from "zod";
import type { StudioServiceResult } from "../interfaces/api";

const MESSAGES: Record<string, { status: number; message: string }> = {
  UNAUTHORIZED: { status: 401, message: "Inicia sesión para continuar." },
  FORBIDDEN: {
    status: 403,
    message: "No tienes permiso para realizar esta acción en este negocio.",
  },
  MEMBERSHIP_REQUIRED: {
    status: 402,
    message: "Activa tu membresía Studio para crear diseños.",
  },
  NOT_FOUND: {
    status: 404,
    message: "No encontramos este recurso en tu negocio.",
  },
  REVISION_CONFLICT: {
    status: 409,
    message:
      "El diseño cambió en otra pestaña. Recarga o conserva una copia de tus cambios.",
  },
  STALE_SOURCE: {
    status: 409,
    message:
      "El precio o las condiciones cambiaron. Actualiza el diseño desde tu catálogo.",
  },
  SOURCE_NOT_ELIGIBLE: {
    status: 409,
    message:
      "Revisa el estado, vigencia y canales de esta oferta antes de publicarla.",
  },
  INSUFFICIENT_TLACOS: {
    status: 409,
    message:
      "No tienes suficientes Tlacos. Compra una recarga sin perder tu diseño.",
  },
  QUOTE_EXPIRED: {
    status: 409,
    message:
      "La cotización venció o cambió. Revisa el costo y confirma de nuevo.",
  },
  TOO_MANY_JOBS: {
    status: 429,
    message: "Ya tienes dos generaciones en curso. Espera a que termine una.",
  },
  RATE_LIMIT: {
    status: 429,
    message: "Espera un momento antes de volver a intentarlo.",
  },
  REVIEW_QUOTA: {
    status: 429,
    message:
      "Alcanzaste los diagnósticos incluidos. Las revisiones locales siguen disponibles.",
  },
  AI_BLOCKED: {
    status: 409,
    message: "Tu acceso a IA necesita revisión. Contacta a soporte.",
  },
  NOT_CONFIGURED: {
    status: 503,
    message:
      "Esta función de Studio todavía no está habilitada. Tu trabajo se conserva.",
  },
  PAYMENT_PENDING: {
    status: 409,
    message:
      "Esta operación necesita conciliación antes de continuar. Los beneficios no se duplicaron.",
  },
  OVERLAPPING_PERIOD: {
    status: 409,
    message:
      "Este cobro requiere revisar un periodo ya acreditado. Los beneficios no se duplicaron.",
  },
  CATALOG_CHANGED: {
    status: 409,
    message:
      "Los precios o beneficios cambiaron. Actualiza el catálogo y vuelve a confirmar antes de pagar.",
  },
  BUDGET_NOT_CONFIGURED: {
    status: 503,
    message: "La IA está pendiente de configuración. Tu saldo se conserva.",
  },
  BUDGET_EXCEEDED: {
    status: 429,
    message:
      "La generación alcanzó su límite operativo. Intenta más tarde; tu saldo se conserva.",
  },
  CHECKOUT_IN_PROGRESS: {
    status: 409,
    message:
      "Hay una contratación pendiente de confirmación. Revisa la membresía antes de continuar.",
  },
  MEMBERSHIP_ALREADY_ACTIVE: {
    status: 409,
    message:
      "Este negocio ya tiene Studio. Puedes programar un cambio para la renovación.",
  },
  JOB_ALREADY_STARTED: {
    status: 409,
    message: "La generación ya comenzó y no se puede cancelar.",
  },
  ASSET_NOT_READY: {
    status: 409,
    message: "Espera a que termine la carga de la imagen.",
  },
  VERSION_NOT_PUBLISHABLE: {
    status: 409,
    message:
      "Revisa la fuente y guarda una versión vigente antes de aplicar el diseño.",
  },
  RENDER_MISMATCH: {
    status: 409,
    message:
      "Prepara una vista previa para esta superficie antes de publicarla.",
  },
  PAYMENT_MISMATCH: {
    status: 409,
    message:
      "El pago necesita conciliación. No se han entregado beneficios adicionales.",
  },
  VALIDATION: { status: 400, message: "Revisa los datos antes de continuar." },
};

export class StudioError extends Error {
  constructor(
    public code: string,
    message?: string,
    public status = MESSAGES[code]?.status ?? 500,
  ) {
    super(
      message ??
        MESSAGES[code]?.message ??
        "No pudimos completar la acción. Intenta nuevamente.",
    );
  }
}

export function requireStudioSuccess(result: {
  error: { message: string; code?: string } | null;
}): void {
  const { error } = result;
  if (error) {
    if (error.code === "PGRST116") throw new StudioError("NOT_FOUND");
    const code = error.message.match(/STUDIO_([A-Z_]+)/)?.[1];
    if (code && MESSAGES[code]) throw new StudioError(code);
    console.error("[studio] database operation failed", {
      code: error.code,
      message: error.message,
    });
    throw new StudioError("INTERNAL");
  }
}

// Generic over the whole response so the call site never steers supabase's select() inference.
export function requireStudioData<
  R extends {
    data: unknown;
    error: { message: string; code?: string } | null;
  },
>(result: R): NonNullable<R["data"]> {
  requireStudioSuccess(result);
  if (result.data == null) throw new StudioError("NOT_FOUND");
  return result.data as NonNullable<R["data"]>;
}

export async function studioResult<T>(
  action: () => Promise<T>,
): Promise<StudioServiceResult<T>> {
  try {
    return { ok: true, data: await action() };
  } catch (error) {
    const failure =
      error instanceof StudioError
        ? error
        : error instanceof ZodError
          ? new StudioError(
              "VALIDATION",
              error.issues[0]?.code === "custom"
                ? error.issues[0].message
                : undefined,
            )
          : new StudioError("INTERNAL");
    if (!(error instanceof StudioError) && !(error instanceof ZodError))
      console.error("[studio] service failed", {
        type: error instanceof Error ? error.name : "Unknown",
      });
    return {
      ok: false,
      error: {
        code:
          failure.status === 404
            ? "not_found"
            : failure.status === 401 || failure.status === 403
              ? "forbidden"
              : failure.status === 402 ||
                  failure.status === 409 ||
                  failure.status === 429
                ? "conflict"
                : failure.status === 400
                  ? "validation"
                  : "internal",
        message: failure.message,
        studioCode: failure.code,
        status: failure.status,
      },
    };
  }
}
