"use client";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { useStudioContext } from "../components/StudioProvider";
import { loadPendingJobs, runJob } from "../services/studioClientService";

/**
 * Images still waiting (a batch the person left) finish while Studio is open:
 * each queued job runs once, one at a time, and lands on its design.
 */
export function useStudioPendingJobs(onFinished: () => void) {
  const { tenantId, summary, refresh } = useStudioContext(),
    [done, setDone] = useState(0),
    started = useRef(new Set<string>()),
    running = useRef(false);
  const pending = useSWR(
    summary?.aiEnabled ? ["studio-pending-jobs", tenantId] : null,
    () => loadPendingJobs(tenantId),
  );
  const queued = (pending.data ?? []).filter(
    (job) => job.status === "queued" && !started.current.has(job.id),
  );
  useEffect(() => {
    if (running.current || !queued.length) return;
    running.current = true;
    const job = queued[0];
    started.current.add(job.id);
    void runJob(tenantId, job.id, true)
      .catch(() => {})
      .finally(() => {
        running.current = false;
        setDone((n) => n + 1);
        void pending.mutate();
        void refresh();
        onFinished();
      });
  }, [queued, tenantId, pending, refresh, onFinished]);
  const left = pending.data?.length ?? 0;
  return { left, done, total: left + done };
}
