/**
 * Filtro de búsqueda de pedidos para PostgREST.
 *
 * El término viaja dentro de un `or=(...)`, cuya sintaxis usa comas, paréntesis
 * y puntos como separadores: pasarlos tal cual deja que el término reescriba la
 * consulta. Se quedan solo letras, números, espacios y acentos.
 */
import { ORDER_NUMBER_SEARCH_MIN_CHARS } from "@/features/orders/constants/search";

const UNSAFE = /[^\p{L}\p{N}\s@._-]/gu;

/** Cuánto se deja escribir antes de mandarlo: un `%x%` sobre todo no ayuda. */
export const MAX_SEARCH_LENGTH = 60;

export function sanitizeOrderSearch(raw: string): string {
  return raw.trim().replace(UNSAFE, "").slice(0, MAX_SEARCH_LENGTH).trim();
}

/**
 * `or` de PostgREST.
 *
 * El número va por SUBCADENA, no por prefijo: quien atiende no sabe si el
 * cliente le está leyendo el principio, el final o un trozo de en medio, y con
 * prefijo `2D3` no encontraba `C12FE2D3`. A cambio pide 4 caracteres, porque una
 * subcadena de 2 sobre un id hexadecimal coincide con casi todo.
 *
 * Nombre, teléfono y correo siguen desde 2 caracteres: ahí el término sí
 * discrimina.
 */
export function orderSearchFilter(term: string): string | null {
  const safe = sanitizeOrderSearch(term);
  if (!safe) return null;

  const clauses = [
    `customer_name.ilike.*${safe}*`,
    `customer_phone.ilike.*${safe}*`,
    `customer_email.ilike.*${safe}*`,
  ];
  if (safe.length >= ORDER_NUMBER_SEARCH_MIN_CHARS) {
    clauses.unshift(`order_number.ilike.*${safe.toUpperCase()}*`);
  }
  return clauses.join(",");
}
