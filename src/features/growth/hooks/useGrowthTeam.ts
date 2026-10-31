import { useCallback, useState } from "react";
import useSWR from "swr";

import { inviteMember, teamKey, updateMember } from "@/features/growth/services/growthClient";
import { swrFetcher } from "@/lib/swrFetcher";

import type { GrowthTeam, MemberInviteInput, MemberPatch } from "@/features/growth/interfaces/member";

type Notice = { tone: "success" | "error" | "warning"; message: string };

/** The coordinator's team screen; `enabled` is false for prospectors, who never load it. */
export function useGrowthTeam(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<GrowthTeam>(enabled ? teamKey : null, swrFetcher);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const clearNotice = useCallback(() => setNotice(null), []);

  async function run(action: () => Promise<Notice>): Promise<boolean> {
    setBusy(true);
    try {
      setNotice(await action());
      await mutate();
      return true;
    } catch (err) {
      setNotice({ tone: "error", message: err instanceof Error ? err.message : "No pudimos guardar el cambio." });
      return false;
    } finally {
      setBusy(false);
    }
  }

  return {
    team: data,
    error,
    isLoading,
    busy,
    notice,
    clearNotice,
    invite: (input: MemberInviteInput) =>
      run(async () => {
        const result = await inviteMember(input);
        return result.emailDelivery === "failed"
          ? { tone: "warning", message: `Agregamos a ${result.member.display_name}, pero el correo no salió. Pídele que entre con «¿Olvidaste tu contraseña?» usando ${input.email}.` }
          : { tone: "success", message: `Invitamos a ${result.member.display_name}. Le llegó un correo para entrar.` };
      }),
    update: (userId: string, patch: MemberPatch) =>
      run(async () => {
        const member = await updateMember(userId, patch);
        const message = patch.status === "suspended" ? `${member.display_name} ya no puede entrar. Sus prospectos siguen a su nombre hasta que los reasignes.` : "Cambios guardados.";
        return { tone: "success", message };
      }),
  };
}
