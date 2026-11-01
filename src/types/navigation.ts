import type { ReactNode } from "react";

export interface NavigationFeedbackState {
  /** Path + query of the in-app page the person just asked for, until it renders. */
  pendingHref: string | null;
}

export interface NavigationFeedbackProps {
  children: ReactNode;
}

export interface NavigationProgressBarProps {
  active: boolean;
}

export interface NavigationSettledProps {
  onSettle: () => void;
}
