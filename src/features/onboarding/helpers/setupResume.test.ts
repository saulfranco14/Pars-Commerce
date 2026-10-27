import { describe, expect, it } from "vitest";

import { SETUP_TEST_STEP, resumeSetupStep } from "@/features/onboarding/helpers/setupResume";

describe("resumeSetupStep", () => {
  it("starts at contact when nothing was saved", () => {
    expect(resumeSetupStep(null)).toBe(0);
    expect(resumeSetupStep({})).toBe(0);
  });

  it("returns to the catalog until prices and stock are confirmed", () => {
    expect(resumeSetupStep({ onboarding: { contact_completed: true } })).toBe(1);
  });

  it("returns to payment once the catalog is confirmed", () => {
    expect(resumeSetupStep({ onboarding: { contact_completed: true, catalog_completed: true, availability_completed: true } })).toBe(3);
  });

  it("goes straight to the test after every step is saved", () => {
    const settings = { onboarding: { contact_completed: true, availability_completed: true, payment_completed: true } };
    expect(resumeSetupStep(settings)).toBe(SETUP_TEST_STEP);
  });
});
