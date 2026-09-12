import type { TeamMemberOption } from "@/features/orders/interfaces/orderDetail";

export interface AssignmentPickerProps {
  /** Miembros del negocio a los que se puede pasar el pedido. */
  team: TeamMemberOption[];
  /** Quién lo tiene hoy, o `null` si nadie. */
  assignedTo: string | null;
  onAssign: (userId: string) => void;
  loading: boolean;
  /** Texto del botón. Cambia entre asignar por primera vez y reasignar. */
  actionLabel: string;
}
