import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createUser: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: { admin: { createUser: mocks.createUser } },
  }),
}));

import { POST } from "@/app/api/auth/send-confirmation/route";

function request(phone = "55 1234 5678") {
  return new Request("https://tlaco.test/api/auth/send-confirmation", {
    method: "POST",
    body: JSON.stringify({ email: "nueva@ejemplo.com", password: "secreto-seguro", intent: { phone } }),
  });
}

describe("POST /api/auth/send-confirmation", () => {
  beforeEach(() => {
    mocks.createUser.mockReset();
  });

  it("creates an immediately usable account without the email provider", async () => {
    mocks.createUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const response = await POST(request() as never);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mocks.createUser).toHaveBeenCalledWith({
      email: "nueva@ejemplo.com",
      password: "secreto-seguro",
      email_confirm: true,
      user_metadata: {
        registration_intent: {
          plan: "free",
          giro: "otro",
          solution_key: null,
          catalog_key: null,
          business_name: null,
          theme_key: "tlaco",
          primary_goals: [],
          catalog_start_mode: "starter",
          onboarding_session_id: null,
          phone: "+525512345678",
          assisted: false,
        },
      },
    });
  });

  it("returns an error when Supabase rejects the account", async () => {
    mocks.createUser.mockResolvedValue({
      data: { user: null },
      error: { message: "User already registered" },
    });

    const response = await POST(request() as never);

    expect(response.status).toBe(400);
  });

  it("requires a valid Mexican WhatsApp before creating the account", async () => {
    const response = await POST(request("texto sin teléfono") as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Ingresa un WhatsApp mexicano de 10 dígitos.",
    });
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("keeps the prospect token and a known 'heard from' answer, and drops unknown answers", async () => {
    mocks.createUser.mockResolvedValue({ data: { user: { id: "user-2" } }, error: null });
    const body = (heardFrom: string) => JSON.stringify({
      email: "prospecto@ejemplo.com",
      password: "secreto-seguro",
      intent: { phone: "55 1234 5678", prospectToken: "t".repeat(43), heardFrom },
    });

    await POST(new Request("https://tlaco.test/api/auth/send-confirmation", { method: "POST", body: body("saul") }) as never);
    const saved = mocks.createUser.mock.calls[0][0].user_metadata.registration_intent;
    expect(saved).toMatchObject({ prospect_token: "t".repeat(43), heard_from: "saul" });

    await POST(new Request("https://tlaco.test/api/auth/send-confirmation", { method: "POST", body: body("<script>") }) as never);
    expect(mocks.createUser.mock.calls[1][0].user_metadata.registration_intent).not.toHaveProperty("heard_from");
  });
});
