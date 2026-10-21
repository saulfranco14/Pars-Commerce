import { describe, expect, it } from "vitest";

import { createFakeSupabase } from "@/test/fakeSupabase";

import { ensureCustomer } from "@/features/checkout/helpers/ensureCustomer";

type Admin = Parameters<typeof ensureCustomer>[0];
const asClient = (db: ReturnType<typeof createFakeSupabase>) => db as unknown as Admin;

describe("ensureCustomer", () => {
  it("reuses the customer found by email and fills in a missing phone", async () => {
    const db = createFakeSupabase({
      customers: [{ id: "c1", tenant_id: "t1", email: "ana@example.com", normalized_phone: null }],
    });
    const id = await ensureCustomer(asClient(db), "t1", "Ana", " ANA@example.com ", "55 1234 5678");
    expect(id).toBe("c1");
    expect(db.rowsOf("customers")[0]).toMatchObject({ normalized_phone: "+525512345678" });
  });

  it("finds the counter customer by phone and attaches the email", async () => {
    const db = createFakeSupabase({
      customers: [{ id: "c2", tenant_id: "t1", email: null, normalized_phone: "+525512345678" }],
    });
    const id = await ensureCustomer(asClient(db), "t1", "Ana", "ana@example.com", "5512345678");
    expect(id).toBe("c2");
    expect(db.rowsOf("customers")[0]).toMatchObject({ email: "ana@example.com" });
  });

  it("creates a new customer with the normalized phone", async () => {
    const db = createFakeSupabase({ customers: [] });
    await ensureCustomer(asClient(db), "t1", " Ana ", "ana@example.com", "5512345678");
    expect(db.rowsOf("customers")[0]).toMatchObject({ name: "Ana", normalized_phone: "+525512345678" });
  });
});
