import type { ReactNode } from "react";

export interface LandingSectionProps {
  id?: string;
  tone?: "base" | "alt" | "dark";
  width?: "max-w-3xl" | "max-w-5xl" | "max-w-6xl" | "max-w-7xl";
  children: ReactNode;
}

export interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  accent?: string;
  lead?: string;
  dark?: boolean;
}
