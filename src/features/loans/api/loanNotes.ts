import client from "@/api/client";

export interface LoanNote {
  id: number;
  loanId: number;
  noteType: string;
  note: string;
  createdByUsername: string;
  createdOnDate: string;
  createdById: number;
  updatedByUsername?: string;
  updatedOnDate?: string;
}

export async function fetchLoanNotes(loanId: number): Promise<LoanNote[]> {
  const { data } = await client.get<LoanNote[]>(`/loans/${loanId}/notes`);
  return Array.isArray(data) ? data : [];
}

export async function fetchLoanNote(loanId: number, noteId: number): Promise<LoanNote> {
  const { data } = await client.get<LoanNote>(`/loans/${loanId}/notes/${noteId}`);
  return data;
}

export async function createLoanNote(loanId: number, note: string): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>(`/loans/${loanId}/notes`, { note });
  return data;
}

export async function updateLoanNote(loanId: number, noteId: number, note: string): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/loans/${loanId}/notes/${noteId}`, { note });
  return data;
}

export async function deleteLoanNote(loanId: number, noteId: number): Promise<void> {
  await client.delete(`/loans/${loanId}/notes/${noteId}`);
}
