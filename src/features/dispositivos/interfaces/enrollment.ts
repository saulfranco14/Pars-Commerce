export type DeviceEnrollmentState =
  | { phase: "starting" }
  | { phase: "waiting"; enrollCode: string }
  | { phase: "rejected" }
  | { phase: "ready"; deviceName: string | null; tenantName: string }
  | { phase: "error"; message: string };
