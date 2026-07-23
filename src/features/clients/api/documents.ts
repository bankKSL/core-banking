import client from "@/api/client";

// ─── Types ─────────────────────────────────────────────────────────────

export interface ClientDocument {
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
  file?: string; // base64 content when fetched individually
}

export interface ClientDocumentRequest {
  name: string;
  description?: string;
  file?: File;
  contentLength?: number;
}

export interface ClientDocumentCommandResponse {
  resourceId: number;
}

// ─── Helper ────────────────────────────────────────────────────────────

/**
 * Build a multipart FormData payload for document upload/update.
 * Note: The Fineract API expects the 'file' field as the actual file,
 * and additional fields as part of the multipart request.
 */
function buildDocumentFormData(payload: ClientDocumentRequest, includeFile: boolean): FormData {
  const formData = new FormData();
  formData.append("name", payload.name);
  if (payload.description) {
    formData.append("description", payload.description);
  }
  if (includeFile && payload.file) {
    formData.append("file", payload.file);
    formData.append("contentLength", String(payload.file.size));
  }
  return formData;
}

// ─── API Functions ─────────────────────────────────────────────────────

/**
 * GET /clients/{clientId}/documents
 * List all documents for a client.
 */
export async function fetchClientDocuments(clientId: number | string): Promise<ClientDocument[]> {
  const { data } = await client.get<ClientDocument[]>(`/clients/${clientId}/documents`);
  return data;
}

/**
 * GET /clients/{clientId}/documents/{documentId}
 * Get a single document's metadata.
 */
export async function fetchClientDocument(
  clientId: number | string,
  documentId: number | string,
): Promise<ClientDocument> {
  const { data } = await client.get<ClientDocument>(`/clients/${clientId}/documents/${documentId}`);
  return data;
}

/**
 * GET /clients/{clientId}/documents/{documentId}/attachment
 * Download a document as a Blob.
 */
export async function downloadClientDocument(clientId: number | string, documentId: number | string): Promise<Blob> {
  const { data } = await client.get<Blob>(`/clients/${clientId}/documents/${documentId}/attachment`, {
    responseType: "blob",
  });
  return data;
}

/**
 * POST /clients/{clientId}/documents
 * Upload a new document for a client. Uses multipart/form-data.
 */
export async function createClientDocument(
  clientId: number | string,
  payload: ClientDocumentRequest,
): Promise<ClientDocumentCommandResponse> {
  const formData = buildDocumentFormData(payload, true);
  const { data } = await client.post<ClientDocumentCommandResponse>(`/clients/${clientId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/**
 * PUT /clients/{clientId}/documents/{documentId}
 * Update a document's metadata (name, description). Optionally upload a new file.
 */
export async function updateClientDocument(
  clientId: number | string,
  documentId: number | string,
  payload: ClientDocumentRequest,
): Promise<ClientDocumentCommandResponse> {
  const hasFile = !!payload.file;
  const formData = buildDocumentFormData(payload, hasFile);
  const { data } = await client.put<ClientDocumentCommandResponse>(
    `/clients/${clientId}/documents/${documentId}`,
    formData,
    {
      headers: hasFile ? { "Content-Type": "multipart/form-data" } : undefined,
    },
  );
  return data;
}

/**
 * DELETE /clients/{clientId}/documents/{documentId}
 * Delete a document.
 */
export async function deleteClientDocument(
  clientId: number | string,
  documentId: number | string,
): Promise<ClientDocumentCommandResponse> {
  const { data } = await client.delete<ClientDocumentCommandResponse>(`/clients/${clientId}/documents/${documentId}`);
  return data;
}
