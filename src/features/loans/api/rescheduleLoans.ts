import client from "@/api/client";
import type {
  LoanRescheduleRequest,
  RescheduleLoanTemplate,
  RescheduleLoanCreateRequest,
  RescheduleLoanCommandRequest,
  LoanCommandResponse,
} from "../types/loan";
import { currentDate } from "@/lib/utils";

// ─── Loan Rescheduling — /rescheduleloans ────────────────────────

export async function fetchRescheduleTemplate(): Promise<RescheduleLoanTemplate> {
  const { data } = await client.get<RescheduleLoanTemplate>("/rescheduleloans/template");
  return data;
}

export async function fetchRescheduleRequests(): Promise<LoanRescheduleRequest[]> {
  const { data } = await client.get<LoanRescheduleRequest[] | { pageItems: LoanRescheduleRequest[] }>(
    "/rescheduleloans",
  );
  if (Array.isArray(data)) return data;
  return data.pageItems ?? [];
}

export async function fetchRescheduleRequest(scheduleId: number | string): Promise<LoanRescheduleRequest> {
  const { data } = await client.get<LoanRescheduleRequest>(`/rescheduleloans/${scheduleId}`);
  return data;
}

export async function createRescheduleRequest(payload: RescheduleLoanCreateRequest): Promise<LoanCommandResponse> {
  const { data } = await client.post<LoanCommandResponse>("/rescheduleloans", {
    ...payload,
    rescheduleFromDate: currentDate(payload.rescheduleFromDate),
    submittedOnDate: currentDate(payload.submittedOnDate),
    adjustedDueDate: payload.adjustedDueDate ? currentDate(payload.adjustedDueDate) : undefined,
    dateFormat: "yyyy-MM-dd",
    locale: "en",
  });
  return data;
}

/** Approve or reject a reschedule request */
export async function rescheduleRequestCommand(
  scheduleId: number,
  command: "approve" | "reject",
  payload: RescheduleLoanCommandRequest = {},
): Promise<LoanCommandResponse> {
  const { data } = await client.post<LoanCommandResponse>(
    `/rescheduleloans/${scheduleId}`,
    { ...payload, dateFormat: "yyyy-MM-dd", locale: "en" },
    { params: { command } },
  );
  return data;
}
