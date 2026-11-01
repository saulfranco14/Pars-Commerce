"use client";

import { createContext, useContext } from "react";

import type { NavigationFeedbackState } from "@/types/navigation";

export const NavigationFeedbackContext = createContext<NavigationFeedbackState>({ pendingHref: null });

export function useNavigationFeedback(): NavigationFeedbackState {
  return useContext(NavigationFeedbackContext);
}
