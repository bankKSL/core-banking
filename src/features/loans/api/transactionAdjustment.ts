import client from "@/api/client";
import { currentDate } from "@/lib/utils";

export async function undoTransaction(loanId: number, transactionId: number): Promise<void> {
  await client.post(`/loans/${loanId}/transactions/${transactionId}`, {
    command: "undo",
    dateFormat: "yyyy-MM-dd",
    locale: "en",
  });
}

export async function modifyTransaction(
  loanId: number,
  transactionId: number,
  payload: { transactionDate?: string; transactionAmount?: number; note?: string },
): Promise<void> {
  await client.post(`/loans/${loanId}/transactions/${transactionId}`, {
    ...payload,
    transactionDate: payload.transactionDate ? (currentDate(payload.transactionDate) ?? payload.transactionDate) : undefined,
    dateFormat: "yyyy-MM-dd",
    locale: "en",
    command: "modify",
  });
}
