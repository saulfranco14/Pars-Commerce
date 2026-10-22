import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { reviewTransferProof } from "@/features/orders/services/transferProofReviewService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string; proofId: string }> }) {
  const { orderId, proofId } = await params;
  const body = (await request.json().catch(() => ({}))) as { decision?: "approve" | "reject"; rejection_reason?: string };
  if (body.decision !== "approve" && body.decision !== "reject") {
    return NextResponse.json({ error: "Indica si el comprobante se aprueba o rechaza." }, { status: 400 });
  }
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await reviewTransferProof(createAdminClient(), {
    userId: user.id,
    orderId,
    proofId,
    decision: body.decision,
    rejectionReason: body.rejection_reason,
  });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json({ success: true, status: result.data.status });
}
