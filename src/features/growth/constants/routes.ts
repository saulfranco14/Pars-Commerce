export const PROSPECTING_PATH = "/dashboard/prospeccion";
export const SWEEP_PATH = `${PROSPECTING_PATH}/barrido`;
export const TEAM_PATH = `${PROSPECTING_PATH}/equipo`;
export const ENGINE_PATH = `${PROSPECTING_PATH}/motor`;
export const TEMPLATES_PATH = `${ENGINE_PATH}/mensajes`;
export const FUNNEL_PATH = `${PROSPECTING_PATH}/embudo`;
export const IMPORT_PATH = `${PROSPECTING_PATH}/importar`;

export const leadPath = (id: string) => `${PROSPECTING_PATH}/${id}`;
