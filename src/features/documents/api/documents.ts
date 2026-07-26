import client from "@/api/client";
import type { Document, DocumentRequest, DocumentCommandResponse } from "../types/document";

function buildDocumentFormData(payload: DocumentRequest, includeFile: boolean): FormData {
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

export async function fetchDocuments(entityType: string, entityId: number | string): Promise<Document[]> {
  const { data } = await client.get<Document[]>(`/${entityType}/${entityId}/documents`);
  return data;
}

export async function fetchDocument(
  entityType: string,
  entityId: number | string,
  documentId: number | string,
): Promise<Document> {
  const { data } = await client.get<Document>(`/${entityType}/${entityId}/documents/${documentId}`);
  return data;
}

export async function downloadDocument(
  entityType: string,
  entityId: number | string,
  documentId: number | string,
): Promise<Blob> {
  const { data } = await client.get<Blob>(`/${entityType}/${entityId}/documents/${documentId}/attachment`, {
    responseType: "blob",
  });
  return data;
}

export async function createDocument(
  entityType: string,
  entityId: number | string,
  payload: DocumentRequest,
): Promise<DocumentCommandResponse> {
  const formData = buildDocumentFormData(payload, true);
  const { data } = await client.post<DocumentCommandResponse>(
    `/${entityType}/${entityId}/documents`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}

export async function updateDocument(
  entityType: string,
  entityId: number | string,
  documentId: number | string,
  payload: DocumentRequest,
): Promise<DocumentCommandResponse> {
  const hasFile = !!payload.file;
  const formData = buildDocumentFormData(payload, hasFile);
  const { data } = await client.put<DocumentCommandResponse>(
    `/${entityType}/${entityId}/documents/${documentId}`,
    formData,
    { headers: hasFile ? { "Content-Type": "multipart/form-data" } : undefined },
  );
  return data;
}

export async function deleteDocument(
  entityType: string,
  entityId: number | string,
  documentId: number | string,
): Promise<DocumentCommandResponse> {
  const { data } = await client.delete<DocumentCommandResponse>(
    `/${entityType}/${entityId}/documents/${documentId}`,
  );
  return data;
}
