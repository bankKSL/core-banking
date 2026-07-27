import client from "@/api/client";

export interface PointInTimeData {
  loanId: number;
  date: string;
  principalDisbursed: number;
  principalPaid: number;
  principalWrittenOff: number;
  principalOutstanding: number;
  interestCharged: number;
  interestPaid: number;
  interestWaived: number;
  interestWrittenOff: number;
  interestOutstanding: number;
  feeChargesCharged: number;
  feeChargesPaid: number;
  feeChargesWaived: number;
  feeChargesWrittenOff: number;
  feeChargesOutstanding: number;
  penaltyChargesCharged: number;
  penaltyChargesPaid: number;
  penaltyChargesWaived: number;
  penaltyChargesWrittenOff: number;
  penaltyChargesOutstanding: number;
  totalOutstanding: number;
  arrearsData?: {
    principalOverdue: number;
    interestOverdue: number;
    feeChargesOverdue: number;
    penaltyChargesOverdue: number;
    totalOverdue: number;
  };
}

export async function fetchPointInTime(
  loanId: number,
  date: string,
): Promise<PointInTimeData> {
  const { data } = await client.get<PointInTimeData>(`/loans/at-date/${loanId}`, {
    params: { date, dateFormat: "yyyy-MM-dd", locale: "en" },
  });
  return data;
}
