import { NextResponse } from "next/server";

import type { ServiceError } from "@/features/qr/services/tablePaymentService";

/**
 * Maps a domain ServiceError to an HTTP NextResponse. Keeps route handlers
 * free of error-code-to-status-code branching — every QR service speaks the
 * same error vocabulary so the mapping is centralized here.
 */
export function serviceErrorToResponse(error: ServiceError) {
  const status =
    error.code === "not_found"
      ? 404
      : error.code === "forbidden"
        ? 403
        : error.code === "conflict"
          ? 409
          : error.code === "validation"
            ? 400
            : 500;
  return NextResponse.json({ error: error.message }, { status });
}
