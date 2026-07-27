import client from "@/api/client";
import { currentDate } from "@/lib/utils";

export interface InterestPause {
  id: number;
  loanId: number;
  startDate: string;
  endDate: string;
  createdBy: string;
  createdOn: string;
}

export interface InterestPauseRequest {
  startDate: string;
  endDate: string;
  dateFormat: string;
  locale: string;
}

export async function fetchInterestPauses(loanId: number): Promise<InterestPause[]> {
  const { data } = await client.get<InterestPause[]>(`/loans/${loanId}/interest-pauses`);
  return Array.isArray(data) ? data : [];
}

export async function createInterestPause(loanId: number, startDate: string, endDate: string): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>(`/loans/${loanId}/interest-pauses`, {
    startDate: currentDate(startDate) ?? startDate,
    endDate: currentDate(endDate) ?? endDate,
    dateFormat: "yyyy-MM-dd",
    locale: "en",
  });
  return data;
}

export async function updateInterestPause(
  loanId: number,
  pauseId: number,
  startDate: string,
  endDate: string,
): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/loans/${loanId}/interest-pauses/${pauseId}`, {
    startDate: currentDate(startDate) ?? startDate,
    endDate: currentDate(endDate) ?? endDate,
    dateFormat: "yyyy-MM-dd",
    locale: "en",
  });
  return data;
}

export async function deleteInterestPause(loanId: number, pauseId: number): Promise<void> {
  await client.delete(`/loans/${loanId}/interest-pauses/${pauseId}`);
}
