import type { Customer } from "@/types/customers";
import type { NewCustomerValues } from "@/features/prestamos/validations/loanForm";

export async function createCustomer(
  tenantId: string,
  values: NewCustomerValues
): Promise<Customer> {
  const res = await fetch("/api/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenant_id: tenantId, ...values }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Error al crear cliente");
  return data as Customer;
}
