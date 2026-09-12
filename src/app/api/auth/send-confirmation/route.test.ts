import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createUser: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: { admin: { createUser: mocks.createUser } },
  }),
}));

import { POST } from "@/app/api/auth/send-confirmation/route";

function request() {
  return new Request("https://tlaco.test/api/auth/send-confirmation", {
    method: "POST",
    body: JSON.stringify({ email: "nueva@ejemplo.com", password: "secreto-seguro" }),
  });
}

describe("POST /api/auth/send-confirmation", () => {
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
});
