import client from "@/api/client";

export interface PostDatedCheck {
  id: number;
  installmentId: number;
  accountNo: string;
  checkNo: string;
  checkDate: number[];
  amount: number;
  bankName: string | null;
  routingCode: string | null;
  drawerId: string | null;
  status: { id: number; code: string; value: string };
}

export async function fetchLoanPDCs(loanId: number): Promise<PostDatedCheck[]> {
  const { data } = await client.get<PostDatedCheck[]>(`/loans/${loanId}/postdatedchecks`);
  return Array.isArray(data) ? data : [];
}

export async function updatePDC(
  loanId: number,
  pdcId: number,
  payload: Record<string, unknown>,
): Promise<void> {
  await client.put(`/loans/${loanId}/postdatedchecks/${pdcId}?editType=update`, {
    ...payload,
    dateFormat: "yyyy-MM-dd",
    locale: "en",
  });
}

export async function bouncePDC(loanId: number, pdcId: number): Promise<void> {
  await client.put(`/loans/${loanId}/postdatedchecks/${pdcId}?editType=bounced`);
}

export async function deletePDC(loanId: number, pdcId: number): Promise<void> {
  await client.delete(`/loans/${loanId}/postdatedchecks/${pdcId}`);
}
