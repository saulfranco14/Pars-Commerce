export interface AcceptingOrdersToggleProps {
  tenantId: string;
  /** Estado actual de la recepción. */
  accepting: boolean;
  /** Se llama con el valor nuevo una vez guardado en el servidor. */
  onChanged: (accepting: boolean) => void;
}
