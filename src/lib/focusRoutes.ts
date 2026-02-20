export function isFocusRoute(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "dashboard") return false;
  const second = segments[1];
  const third = segments[2];
  const fourth = segments[3];

  if (second === "crear-negocio" || second === "perfil") return true;
  if (!second || !third) return false;

  if (third === "ordenes") {
    if (fourth === "nueva") return true;
    return fourth !== undefined && fourth !== "";
  }
  if (third === "productos") {
    if (fourth === "nuevo") return true;
    return fourth !== undefined && fourth !== "" && fourth !== "subcatalogos";
  }
  if (third === "servicios") {
    if (fourth === "nuevo") return true;
    return fourth !== undefined && fourth !== "";
  }
  if (third === "equipo" && fourth === "nuevo") return true;
  if (third === "configuracion" || third === "sitio-web") return true;

  return false;
}
