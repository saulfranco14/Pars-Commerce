export interface AddendumSheetProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  /** Pedido ya pagado al que se le complementa. */
  parentOrderId: string;
  /** Se llama con el id del pedido complementario recién creado. */
  onCreated: (childOrderId: string) => void;
}

/** Una línea de la lista que se está armando, con lo necesario para pintarla. */
export interface DraftItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}
