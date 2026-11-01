import { useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

import { coldLeadsKey, dropLeads, isBoardKey, isLeadsListKey } from "@/features/growth/services/growthClient";
import { swrFetcher } from "@/lib/swrFetcher";

import type { ColdLead } from "@/features/growth/interfaces/cleanup";

/** Who never opened their store, with every one checked; dropping the checked ones refreshes every list. */
export function useColdLeads(isOpen: boolean, owner?: string) {
  const { mutate: mutateGlobal } = useSWRConfig();
  const [days, setDays] = useState(3);
  const { data, error, isLoading, mutate } = useSWR<ColdLead[]>(isOpen ? coldLeadsKey(days, owner) : null, swrFetcher, { revalidateOnFocus: false });
  const [unchecked, setUnchecked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    setUnchecked(new Set());
  }, [days, data]);

  const leads = data ?? [];
  const selected = leads.filter((lead) => !unchecked.has(lead.id)).map((lead) => lead.id);

  function toggle(id: string) {
    setUnchecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function drop() {
    if (!selected.length) return;
    setBusy(true);
    setFailure(null);
    try {
      const { dropped } = await dropLeads(selected, "no_abrio");
      setResult(`Listo: ${dropped.toLocaleString("es-MX")} ${dropped === 1 ? "negocio dado" : "negocios dados"} de baja.`);
      await Promise.all([mutate(), mutateGlobal(isBoardKey), mutateGlobal(isLeadsListKey)]);
    } catch (err) {
      setFailure(err instanceof Error ? err.message : "No se pudieron dar de baja. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return {
    days,
    setDays,
    leads,
    error,
    isLoading,
    selected,
    allChecked: unchecked.size === 0,
    toggle,
    toggleAll: () => setUnchecked(unchecked.size === 0 ? new Set(leads.map((lead) => lead.id)) : new Set()),
    drop,
    busy,
    result,
    failure,
    clearResult: () => setResult(null),
  };
}
