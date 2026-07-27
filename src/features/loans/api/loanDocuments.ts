import client from "@/api/client";

export interface LoanDocument {
  id: number;
  parentEntityType: string;
  parentEntityId: number;
  name: string;
  fileName: string;
  size: number;
  type: string;
  description: string | null;
  location: string;
}

export async function fetchLoanDocuments(loanId: number): Promise<LoanDocument[]> {
  const { data } = await client.get<LoanDocument[]>(`/loans/${loanId}/documents`);
  return Array.isArray(data) ? data : [];
}

export async function fetchLoanDocument(loanId: number, documentId: number): Promise<LoanDocument> {
  const { data } = await client.get<LoanDocument>(`/loans/${loanId}/documents/${documentId}`);
  return data;
}

export async function downloadLoanDocument(loanId: number, documentId: number): Promise<Blob> {
  const { data } = await client.get<Blob>(`/loans/${loanId}/documents/${documentId}/attachment`, {
    responseType: "blob",
  });
  return data;
}

export async function uploadLoanDocument(
  loanId: number,
  file: File,
  name: string,
  description?: string,
): Promise<{ resourceId: number }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", name);
  if (description) formData.append("description", description);
  const { data } = await client.post<{ resourceId: number }>(`/loans/${loanId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateLoanDocument(
  loanId: number,
  documentId: number,
  file?: File,
  name?: string,
  description?: string,
): Promise<{ resourceId: number }> {
  const formData = new FormData();
  if (file) formData.append("file", file);
  if (name) formData.append("name", name);
  if (description) formData.append("description", description);
  const { data } = await client.put<{ resourceId: number }>(`/loans/${loanId}/documents/${documentId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteLoanDocument(loanId: number, documentId: number): Promise<void> {
  await client.delete(`/loans/${loanId}/documents/${documentId}`);
}
