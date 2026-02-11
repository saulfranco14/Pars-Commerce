import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Redirect handler for MercadoPago back_urls.
 * After payment, MercadoPago redirects the user here,
 * and we redirect them back to the order detail page.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "unknown";
  const orderId = searchParams.get("order_id") ?? "";

  // We redirect to the root dashboard; the user will navigate to their order
  // Since we don't know the tenant slug here, redirect to a generic page
  const redirectUrl = new URL("/dashboard", request.url);
  redirectUrl.searchParams.set("mp_status", status);
  if (orderId) redirectUrl.searchParams.set("order_id", orderId);

  return NextResponse.redirect(redirectUrl);
}
