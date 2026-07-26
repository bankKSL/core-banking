export interface Document {
  id: number;
  parentEntityType: string;
  parentEntityId: number;
  name: string;
  fileName?: string;
  size?: number;
  type?: string;
  description?: string;
  location?: string;
  storageType?: number;
  file?: string;
}

export interface DocumentRequest {
  name: string;
  description?: string;
  file?: File;
  contentLength?: number;
}

export interface DocumentCommandResponse {
  resourceId: number;
}

export type DocumentEntityType = "clients" | "loans" | "groups" | "savings" | "staff" | "client_identifiers";
