import type { ReactNode } from "react";

export interface FeatureTourSlide {
  id: string;
  title: string;
  description: string;
  visual: ReactNode;
}

export interface FeatureTourProps {
  /** Once this key is in localStorage the tour does not show again. */
  storageKey: string;
  /** Name of the dialog for screen readers. */
  label: string;
  slides: FeatureTourSlide[];
  /** Label of the last button, one word. */
  finishLabel: string;
  onFinish?: () => void;
}
