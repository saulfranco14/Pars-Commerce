"use client";

import { useEffect, useRef } from "react";

import type { Middleware, SWRHook } from "swr";

/**
 * Delay before an unmount actually aborts in-flight requests. React Strict
 * Mode (on by default in Next.js dev) intentionally mounts every component
 * twice — mount → unmount → mount — to surface impure effects. Without this
 * delay, that dev-only double-mount would abort the very first fetch on
 * every single page load, showing a spurious (canceled) request in the
 * Network tab on every navigation, not just on genuine fast back-and-forth.
 * Real unmounts (navigating away for good) still abort — just ~50ms later,
 * well under human-perceptible navigation latency. The second Strict Mode
 * mount runs synchronously right after the first unmount, so it always
 * cancels this pending timer well before it would fire.
 */
const ABORT_DEBOUNCE_MS = 50;

/**
 * Aborts in-flight fetches for a hook when it unmounts for real (e.g.
 * navigating away from a section while its SWR hooks are still loading).
 * SWR itself only stops applying the result to a gone component — it
 * doesn't cancel the underlying network request, so those requests keep
 * running in the background otherwise.
 *
 * Deliberately does NOT abort on key change: multiple hooks/components often
 * share or depend on the same key within the same screen (e.g. `profile`,
 * `tenants`), and aborting on every re-fetch would cancel requests that are
 * still needed, not just stale ones. Only unmount ends the request.
 *
 * Wraps the fetcher so it receives an AbortSignal as its extra argument
 * (swrFetcher forwards it into apiFetch → fetch). Registered once globally
 * via SwrProvider — no per-hook opt-in needed.
 */
export const swrAbortMiddleware: Middleware = (useSWRNext: SWRHook) => {
  return (key, fetcher, config) => {
    const controllersRef = useRef<Set<AbortController>>(new Set());
    const abortTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      // A remount (Strict Mode's second pass) cancels the pending abort from
      // the previous unmount before it fires.
      if (abortTimerRef.current) {
        clearTimeout(abortTimerRef.current);
        abortTimerRef.current = null;
      }

      const controllers = controllersRef.current;
      return () => {
        abortTimerRef.current = setTimeout(() => {
          controllers.forEach((controller) => controller.abort());
          controllers.clear();
        }, ABORT_DEBOUNCE_MS);
      };
    }, []);

    const wrappedFetcher = fetcher
      ? (...args: unknown[]) => {
          const controller = new AbortController();
          controllersRef.current.add(controller);
          const result = (
            fetcher as (...fetcherArgs: unknown[]) => Promise<unknown>
          )(...args, controller.signal);

          // SWR gets the original `result` below and handles the rejection
          // (including AbortError) normally. This second, parallel listener
          // only exists so the rejection always has at least one handler
          // attached synchronously: since WE trigger the abort from the
          // unmount cleanup, SWR's own .catch may not be wired up yet in
          // that exact tick, and the rejection surfaces as an uncaught
          // promise rejection in the console otherwise. Verified this does
          // NOT swallow the error for SWR's own listener — it's a separate
          // branch off the same promise.
          result.catch(() => {}).finally(() => {
            controllersRef.current.delete(controller);
          });

          return result;
        }
      : fetcher;

    return useSWRNext(key, wrappedFetcher as typeof fetcher, config);
  };
};
