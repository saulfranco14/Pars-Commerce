import { apiFetch } from "@/services/apiFetch";

/** The business checked the bank: the transfer arrived (approve) or it didn't (reject, with the reason the customer sees). */
export async function reviewTransferProof(
  orderId: string,
  proofId: string,
  decision: "approve" | "reject",
  rejectionReason?: string,
): Promise<void> {
  await apiFetch(`/api/orders/${orderId}/transferencias/${proofId}/review`, {
    method: "POST",
    body: JSON.stringify({ decision, rejection_reason: decision === "reject" ? rejectionReason : undefined }),
  });
}
