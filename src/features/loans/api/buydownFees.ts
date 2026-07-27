import client from "@/api/client";

export interface BuydownFeeEntry {
  id: number;
  loanId: number;
  transactionId: number;
  date: string;
  amount: number;
  amortizedAmount: number;
  unamortizedAmount: number;
}

export async function fetchBuydownFees(loanId: number): Promise<BuydownFeeEntry[]> {
  const { data } = await client.get<BuydownFeeEntry[]>(`/loans/${loanId}/buydown-fees`);
  return Array.isArray(data) ? data : [];
}
