export function buildPayerFromCustomer(params: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
}): {
  name: string;
  surname: string;
  email: string;
  phone?: { area_code: string; number: string };
} {
  const parts = params.customerName.trim().split(/\s+/);
  const name = parts[0] ?? "Cliente";
  const surname = parts.slice(1).join(" ") || name;
  const payer = {
    name,
    surname,
    email: params.customerEmail.trim(),
  } as {
    name: string;
    surname: string;
    email: string;
    phone?: { area_code: string; number: string };
  };
  if (params.customerPhone?.trim()) {
    const digits = params.customerPhone.replace(/\D/g, "");
    const areaCode = digits.slice(0, 3) || "55";
    const number = digits.slice(3, 13) || digits;
    payer.phone = { area_code: areaCode, number };
  }
  return payer;
}
