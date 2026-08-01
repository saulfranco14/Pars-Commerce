import type { StaffCartLine } from "@/features/qr/hooks/useStaffOrderBuilder";

export interface StaffOrderCartPanelProps {
  lines: StaffCartLine[];
  total: number;
  itemCount: number;
  onAdd: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
  /** Cambia el texto del botón: sumar a una mesa no es lo mismo que abrir. */
  appendingToTable: boolean;
}
