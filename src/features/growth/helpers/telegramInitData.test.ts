import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { verifyInitData } from "@/features/growth/helpers/telegramInitData";

const TOKEN = "123456:TEST-token";
const NOW = new Date("2026-11-28T18:00:00Z");

function signed(fields: Record<string, string>, token = TOKEN): string {
  const check = Object.entries(fields).map(([key, value]) => `${key}=${value}`).sort().join("\n");
  const secret = createHmac("sha256", "WebAppData").update(token).digest();
  const hash = createHmac("sha256", secret).update(check).digest("hex");
  return new URLSearchParams({ ...fields, hash }).toString();
}

const FIELDS = { auth_date: String(NOW.getTime() / 1000 - 60), user: JSON.stringify({ id: 4242, first_name: "Saúl" }), start_param: "lead-1" };

describe("verifyInitData", () => {
  it("accepts data signed with the bot token", () => {
    expect(verifyInitData(signed(FIELDS), TOKEN, NOW)).toEqual({ id: 4242, firstName: "Saúl", startParam: "lead-1" });
  });

  it("rejects another bot's signature, tampering and missing hash", () => {
    expect(verifyInitData(signed(FIELDS, "999:other"), TOKEN, NOW)).toBeNull();
    expect(verifyInitData(signed(FIELDS).replace("4242", "4243"), TOKEN, NOW)).toBeNull();
    expect(verifyInitData(new URLSearchParams(FIELDS).toString(), TOKEN, NOW)).toBeNull();
  });

  it("rejects data older than a day", () => {
    const old = { ...FIELDS, auth_date: String(NOW.getTime() / 1000 - 90_000) };
    expect(verifyInitData(signed(old), TOKEN, NOW)).toBeNull();
  });
});
