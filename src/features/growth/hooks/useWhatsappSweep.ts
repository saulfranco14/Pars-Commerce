import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSWRConfig } from "swr";

import { parseSweepFilters, sweepFiltersQuery } from "@/features/growth/helpers/sweepFilters";
import { mergeSweepQueue } from "@/features/growth/helpers/sweepQueue";
import { SWEEP_OUTCOME_LABEL, SWEEP_REFILL_AT } from "@/features/growth/constants/sweep";
import { fetchSweep, isBoardKey, isLeadsListKey, patchLead } from "@/features/growth/services/growthClient";
import { forgetWhatsappOpened } from "@/features/growth/services/whatsappOpened";

import type { SweepFilters, SweepLastAction, SweepLead, SweepOutcome, SweepToday } from "@/features/growth/interfaces/sweep";
import type { SentWhatsapp } from "@/features/growth/interfaces/whatsapp";

const TODAY_FIELD: Record<SweepOutcome, keyof SweepToday> = {
  whatsapp_sent: "sent",
  no_whatsapp: "noWhatsapp",
  wrong_number: "wrongNumber",
};

/** One-by-one WhatsApp sweep: marking a card moves on at once and the save runs behind it. */
export function useWhatsappSweep() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = parseSweepFilters(searchParams);
  const filtersQuery = sweepFiltersQuery(filters);
  const { mutate: mutateGlobal } = useSWRConfig();

  const [queue, setQueue] = useState<SweepLead[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [today, setToday] = useState<SweepToday>({ sent: 0, noWhatsapp: 0, wrongNumber: 0 });
  const [skipped, setSkipped] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [last, setLast] = useState<SweepLastAction | null>(null);

  const settling = useRef(new Set<string>());
  const filtersRef = useRef(filters);
  const loadingRef = useRef(false);

  const load = useCallback(async (reset: boolean) => {
    if (loadingRef.current && !reset) return;
    loadingRef.current = true;
    const requested = filtersRef.current;
    try {
      const batch = await fetchSweep(requested, [...settling.current]);
      if (requested !== filtersRef.current) return;
      setQueue((current) => mergeSweepQueue(reset ? [] : current, batch.queue, settling.current));
      setRemaining(batch.remaining);
      setToday(batch.today);
      setError(null);
    } catch (err) {
      if (requested === filtersRef.current) setError(err instanceof Error ? err.message : "No pudimos traer los siguientes negocios.");
    } finally {
      // A request for filters the operator already left must not end the newer one's loading state.
      if (requested === filtersRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    filtersRef.current = filters;
    setQueue([]);
    setRemaining(null);
    setLoading(true);
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a new sweep starts only when the filters in the URL change
  }, [filtersQuery, load]);

  function advance(lead: SweepLead, label: string, save: () => Promise<unknown>, undo: () => void) {
    settling.current.add(lead.id);
    setActionError(null);
    setLast({ lead, label });
    setRemaining((value) => (value === null ? value : Math.max(0, value - 1)));
    const left = queue.length - 1;
    setQueue((current) => current.filter((item) => item.id !== lead.id));
    forgetWhatsappOpened();

    save()
      .then(() => {
        void mutateGlobal(isLeadsListKey);
        void mutateGlobal(isBoardKey);
      })
      .catch((err: unknown) => {
        undo();
        setQueue((current) => [lead, ...current.filter((item) => item.id !== lead.id)]);
        setRemaining((value) => (value === null ? value : value + 1));
        setLast(null);
        setActionError(err instanceof Error ? err.message : "No se guardó. Vuelve a intentarlo.");
      })
      .finally(() => {
        settling.current.delete(lead.id);
      });

    if (left <= SWEEP_REFILL_AT) void load(false);
  }

  function mark(outcome: SweepOutcome, sent?: SentWhatsapp) {
    const lead = queue[0];
    if (!lead) return;
    const field = TODAY_FIELD[outcome];
    setToday((value) => ({ ...value, [field]: value[field] + 1 }));
    advance(lead, SWEEP_OUTCOME_LABEL[outcome], () => patchLead(lead.id, { outcome, sent: outcome === "whatsapp_sent" ? sent : undefined }), () => setToday((value) => ({ ...value, [field]: value[field] - 1 })));
  }

  function skip() {
    const lead = queue[0];
    if (!lead) return;
    setSkipped((value) => value + 1);
    advance(lead, SWEEP_OUTCOME_LABEL.skip, () => patchLead(lead.id, { skip: true }), () => setSkipped((value) => value - 1));
  }

  function replaceCurrent(lead: SweepLead) {
    setQueue((current) => (current[0]?.id === lead.id ? [lead, ...current.slice(1)] : current));
  }

  function changeFilters(patch: Partial<SweepFilters>) {
    const next = sweepFiltersQuery({ ...filters, ...patch });
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }

  return {
    filters,
    changeFilters,
    current: queue[0] ?? null,
    next: queue[1] ?? null,
    remaining,
    today,
    skipped,
    loading,
    error,
    actionError,
    clearActionError: () => setActionError(null),
    last,
    mark,
    skip,
    replaceCurrent,
    retry: () => load(true),
  };
}
