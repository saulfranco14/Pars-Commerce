"use client";

import { useState } from "react";

import { setMemberPassword } from "@/services/teamService";
import { staffPasswordError } from "@/lib/auth/staffPassword";
import { staffUsernameOf } from "@/lib/auth/staffLogin";

import type { StaffCredentials, TeamMember } from "@/types/team";

/** Owner picks a new password for a staff account, then sees what to hand over. */
export function useMemberPasswordChange() {
  const [target, setTarget] = useState<TeamMember | null>(null);
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<StaffCredentials | null>(null);

  const fieldError = touched ? staffPasswordError(password) : null;

  function open(member: TeamMember) {
    setTarget(member);
    setPassword("");
    setTouched(false);
    setError(null);
    setCredentials(null);
  }

  function close() {
    setTarget(null);
  }

  function change(value: string) {
    setPassword(value);
    setTouched(true);
  }

  async function save() {
    setTouched(true);
    if (!target || staffPasswordError(password)) return;
    setSaving(true);
    setError(null);
    try {
      await setMemberPassword(target.id, password);
      setCredentials({ login: staffUsernameOf(target.email) ?? target.email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña.");
    } finally {
      setSaving(false);
    }
  }

  return { target, password, fieldError, saving, error, credentials, open, close, change, save };
}
