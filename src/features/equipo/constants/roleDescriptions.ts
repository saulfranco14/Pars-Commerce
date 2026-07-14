export const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner:
    "Acceso total al negocio: ventas, productos, inventario, equipo y configuración.",
  member:
    "Ventas, productos, inventario, promociones y reportes; no puede gestionar equipo ni configuración.",
  cashier:
    "Cobra ventas y órdenes, toma pedidos y consulta códigos QR. No puede avanzar el estado de preparación de un pedido.",
  waiter:
    "Toma y gestiona órdenes, avanza el estado de preparación (recibido → listo) y consulta códigos QR. No cobra ventas directamente.",
};
