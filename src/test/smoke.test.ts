import { describe, it, expect } from "vitest";
import { createFakeSupabase } from "@/test/fakeSupabase";

// Smoke test: confirms the runner, the "@/" alias, and the fakeSupabase
// helper all work end-to-end before we write the real payment tests.
describe("test infrastructure smoke", () => {
  it("runner + TS + alias resolve", () => {
    expect(1 + 1).toBe(2);
  });

  it("fakeSupabase reads seeded rows via .eq().single()", async () => {
    const db = createFakeSupabase({
      payments: [
        { id: "p1", status: "pending" },
        { id: "p2", status: "approved" },
      ],
    });

    const { data } = await db.from("payments").select("*").eq("id", "p1").single();
    expect(data).toEqual({ id: "p1", status: "pending" });
  });

  it("fakeSupabase records writes and mutates the in-memory store", async () => {
    const db = createFakeSupabase({
      payments: [{ id: "p1", status: "pending" }],
    });

    await db
      .from("payments")
      .update({ status: "approved" })
      .eq("id", "p1");

    // the write was recorded...
    expect(db.writes).toEqual([
      {
        table: "payments",
        op: "update",
        values: { status: "approved" },
        filters: [{ op: "eq", column: "id", value: "p1" }],
      },
    ]);
    // ...and a read-after-write sees the change
    expect(db.rowsOf("payments")[0].status).toBe("approved");
  });
});
