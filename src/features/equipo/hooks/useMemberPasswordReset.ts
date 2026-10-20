"use client";

import { useState } from "react";

import { resetMemberPassword } from "@/services/teamService";

import type { StaffCredentials, TeamMember } from "@/types/team";

/** Confirm → new one-time password → show it to hand over. */
export function useMemberPasswordReset() {
  const [target, setTarget] = useState<TeamMember | null>(null);
  const [credentials, setCredentials] = useState<StaffCredentials | null>(null);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function ask(member: TeamMember) {
    setTarget(member);
    setCredentials(null);
    setError(null);
  }

  function close() {
    setTarget(null);
    setCredentials(null);
    setError(null);
  }

  async function confirm() {
    if (!target) return;
    setResetting(true);
    setError(null);
    try {
      setCredentials(await resetMemberPassword(target.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo restablecer la contraseña.");
    } finally {
      setResetting(false);
    }
  }

  return { target, credentials, resetting, error, ask, close, confirm };
}
