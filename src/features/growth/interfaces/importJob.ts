export type ImportStatus = "queued" | "running" | "done" | "failed";

export interface ImportCursor {
  area: string;
  clase: string;
  giro: string;
  municipio: string;
  next: number;
  done: boolean;
}

export interface GrowthImport {
  id: string;
  source: "denue" | "csv";
  status: ImportStatus;
  municipios: string[];
  giros: string[];
  only_with_contact: boolean;
  assign_to: string | null;
  found: number;
  imported: number;
  updated: number;
  skipped: number;
  error: string | null;
  created_at: string;
  finished_at: string | null;
  cursors: ImportCursor[];
}

export interface ImportInput {
  municipios: string[];
  giros: string[];
  onlyWithContact: boolean;
  assignTo: string | null;
}

export interface ImportPreview {
  total: number;
  byGiro: Array<{ giro: string; total: number }>;
  byMunicipio: Array<{ municipio: string; total: number }>;
  alreadyInBase: number;
}

export interface CsvImportInput {
  csv: string;
  assignTo: string | null;
}

export interface CsvImportResult {
  created: number;
  conflicts: number;
  suppressed: number;
  invalid: number;
  /** First few rows that could not be read, with the reason, so the person can fix the file. */
  problems: Array<{ row: number; reason: string }>;
}

/** One record as the DENUE API returns it; field names vary in case between methods. */
export type DenueRecord = Record<string, string | number | null>;
