import type { MenuEditorController } from "@/features/configuracion/hooks/useMenuEditor";

export interface MenuEditorProps {
  editor: MenuEditorController;
}

export interface MenuSwitchProps {
  checked: boolean;
  /** Some, not all, entries of a module are visible. */
  partial?: boolean;
  disabled?: boolean;
  label: string;
  onChange: () => void;
  size?: "md" | "lg";
}
