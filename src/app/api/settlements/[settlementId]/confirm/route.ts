import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlatformAdmin } from "@/lib/auth/isPlatformAdmin";
import { advanceSettlement } from "@/features/settlement/services/advanceSettlement";
import { NextResponse } from "next/server";

/**
 * POST /api/settlements/[settlementId]/confirm — the platform confirms it
 * delivered the money to the business, with evidence.
 *
 * PLATFORM SUPER ADMIN ONLY (the platform is the one that pays out). Records the
 * transfer reference (required), an optional note, and an optional proof photo
 * URL (already uploaded to the settlement-proofs bucket). Moves the settlement
 * to transfer_confirmed — the business then sees "money received" + evidence.
 *
 * Precondition: the settlement must be in transfer_pending (the lifecycle
 * guard in advanceSettlement enforces this).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ settlementId: string }> },
) {
  const { settlementId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isPlatformAdmin(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { transfer_reference, transfer_note, transfer_proof_url } = body as {
    transfer_reference?: string;
    transfer_note?: string;
    transfer_proof_url?: string;
  };

  if (!transfer_reference?.trim()) {
    return NextResponse.json(
      { error: "transfer_reference es requerido para confirmar la entrega" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const res = await advanceSettlement(admin, {
    settlementId,
    to: "transfer_confirmed",
    transferReference: transfer_reference,
    transferNote: transfer_note,
    transferProofUrl: transfer_proof_url,
    confirmedBy: user.id,
  });

  if (!res.ok) {
    const status =
      res.error.code === "not_found"
        ? 404
        : res.error.code === "conflict"
          ? 409
          : res.error.code === "validation"
            ? 400
            : 500;
    return NextResponse.json({ error: res.error.message }, { status });
  }

  return NextResponse.json({ ok: true, status: res.data.status });
}
