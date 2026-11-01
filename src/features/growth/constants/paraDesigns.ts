/**
 * «Para ti» layouts under test. Each link always gets the same one, derived from its token hash, so SQL
 * (growth_para_design_stats) can group visits without storing anything new.
 */
export const PARA_DESIGNS = ["clasica", "tienda", "hazla"] as const;

export const PARA_DESIGN_LABEL: Record<(typeof PARA_DESIGNS)[number], { label: string; why: string }> = {
  clasica: { label: "Clásica", why: "La de hoy: quién la preparó, sus beneficios y abajo la tienda completa." },
  tienda: { label: "Tienda primero", why: "Su nombre y su tienda en un celular en la primera pantalla, con «Activar» siempre a la vista." },
  hazla: { label: "Hazla tuya", why: "La personaliza en 3 toques (color, un precio, horario) y la ve cambiar en vivo; el último paso es activarla." },
};
