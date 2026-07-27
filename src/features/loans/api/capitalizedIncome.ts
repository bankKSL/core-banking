import client from "@/api/client";

export interface CapitalizedIncomeEntry {
  id: number;
  loanId: number;
  transactionId: number;
  date: string;
  amount: number;
  amortizedAmount: number;
  unamortizedAmount: number;
}

export async function fetchCapitalizedIncomes(loanId: number): Promise<CapitalizedIncomeEntry[]> {
  const { data } = await client.get<CapitalizedIncomeEntry[]>(`/loans/${loanId}/capitalized-incomes`);
  return Array.isArray(data) ? data : [];
}
