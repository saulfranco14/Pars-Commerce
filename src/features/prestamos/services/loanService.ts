import type { CreateLoanPayload } from "@/types/loans";

export async function createLoan(payload: CreateLoanPayload): Promise<{ id: string }> {
  const res = await fetch("/api/loans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Error al registrar préstamo");
  return data as { id: string };
}
