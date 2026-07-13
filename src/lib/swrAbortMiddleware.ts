"use client";

import { useEffect, useRef } from "react";

import type { Middleware, SWRHook } from "swr";

/**
 * Aborts in-flight fetches for a hook when it unmounts (e.g. navigating away
 * from a section while its SWR hooks are still loading). SWR itself only
 * stops applying the result to a gone component — it doesn't cancel the
 * underlying network request, so those requests keep running in the
 * background otherwise.
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

    useEffect(() => {
      const controllers = controllersRef.current;
      return () => {
        controllers.forEach((controller) => controller.abort());
        controllers.clear();
      };
    }, []);

    const wrappedFetcher = fetcher
      ? (...args: unknown[]) => {
          const controller = new AbortController();
          controllersRef.current.add(controller);
          const result = (
            fetcher as (...fetcherArgs: unknown[]) => Promise<unknown>
          )(...args, controller.signal);
          void result.finally(() => controllersRef.current.delete(controller));
          return result;
        }
      : fetcher;

    return useSWRNext(key, wrappedFetcher as typeof fetcher, config);
  };
};
