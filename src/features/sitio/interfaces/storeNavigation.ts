import type { ReactNode } from "react";

export interface StoreNavigationState {
  /** Path + query of the in-app page the shopper just asked for, until it renders. */
  pendingHref: string | null;
}

export interface StoreNavigationProps {
  children: ReactNode;
}

export interface StoreNavigationBarProps {
  active: boolean;
}

export interface CatalogResultsProps {
  children: ReactNode;
}

export interface NavigationSettledProps {
  onSettle: () => void;
}

export interface SitioTemplateProps {
  children: ReactNode;
}
