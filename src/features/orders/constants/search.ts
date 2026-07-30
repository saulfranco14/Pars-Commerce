export const DEBOUNCE_MS = 300;
export const SERVER_SEARCH_MIN_CHARS = 2;

/**
 * El número de pedido se busca por subcadena, así que necesita más letras que un
 * nombre: con 2 caracteres, `1A` aparece en casi cualquier id hexadecimal y el
 * resultado no distingue nada. Con 4 ya hay patrón.
 */
export const ORDER_NUMBER_SEARCH_MIN_CHARS = 4;
