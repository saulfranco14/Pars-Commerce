"use client";

import { createContext, useContext } from "react";

import type { StoreNavigationState } from "@/features/sitio/interfaces/storeNavigation";

export const StoreNavigationContext = createContext<StoreNavigationState>({ pendingHref: null });

export function useStoreNavigation(): StoreNavigationState {
  return useContext(StoreNavigationContext);
}
