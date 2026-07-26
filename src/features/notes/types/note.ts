export interface Note {
  id: number;
  clientId?: number;
  note: string;
  noteType?: { id: number; code: string; value: string };
  createdByUserId?: number;
  createdByUsername?: string;
  createdOn?: string;
  updatedByUserId?: number;
  updatedByUsername?: string;
  updatedOn?: string;
}

export interface NoteRequest {
  note: string;
}

export interface NoteCommandResponse {
  resourceId: number;
}

export type NoteResourceType =
  | "clients"
  | "loans"
  | "groups"
  | "savings"
  | "loanTransactions"
  | "savingsTransactions"
  | "accounts/share";
