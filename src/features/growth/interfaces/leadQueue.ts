export interface LeadQueueItem {
  id: string;
  name: string;
}

export interface LeadQueue {
  /** What is being worked, e.g. «Para hoy». */
  label: string;
  items: LeadQueueItem[];
}

export interface LeadQueueBarProps {
  leadId: string;
  /** True once something was done with this prospect: «Siguiente» becomes the main button. */
  done: boolean;
}
