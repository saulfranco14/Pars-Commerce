import { apiFetch } from "@/services/apiFetch";

import type { RegistrationIntent } from "@/features/auth/registrationIntent";

/** Creates the account with its registration intent; the caller signs in right after. */
export async function createAccount(email: string, password: string, intent: RegistrationIntent): Promise<void> {
  await apiFetch("/api/auth/send-confirmation", { method: "POST", body: JSON.stringify({ email, password, intent }) });
}
