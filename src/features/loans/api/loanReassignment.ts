import client from "@/api/client";

export interface LoanStatus {
  id: number;
  code: string;
  value: string;
}

export interface LoanSummary {
  id: number;
  accountNo: string;
  loanProductName: string;
  status: LoanStatus;
}

export interface ClientSummary {
  id: number;
  displayName: string;
  loans: LoanSummary[];
}

export interface GroupSummary {
  id: number;
  displayName: string;
  loans: LoanSummary[];
}

export interface AccountSummaryCollection {
  clients: ClientSummary[];
  groups: GroupSummary[];
}

export interface ReassignmentTemplate {
  officeId?: number;
  fromLoanOfficerId?: number;
  assignmentDate?: string;
  officeOptions: Array<{ id: number; name: string; nameDecorated: string }>;
  loanOfficerOptions: Array<{ id: number; firstname?: string; lastname?: string; displayName: string }>;
  accountSummaryCollection?: AccountSummaryCollection;
}

export interface ReassignmentRequest {
  fromLoanOfficerId: number;
  toLoanOfficerId: number;
  assignmentDate: string;
  loans: number[];
  locale?: string;
  dateFormat?: string;
}

export interface ReassignmentResponse {
  commandId: number;
}

export async function fetchReassignmentTemplate(
  officeId?: number,
  fromLoanOfficerId?: number,
): Promise<ReassignmentTemplate> {
  const params: Record<string, string | number> = {};
  if (officeId != null) params.officeId = officeId;
  if (fromLoanOfficerId != null) params.fromLoanOfficerId = fromLoanOfficerId;
  const { data } = await client.get<ReassignmentTemplate>("/loans/loanreassignment/template", { params });
  return data;
}

export async function executeReassignment(payload: ReassignmentRequest): Promise<ReassignmentResponse> {
  const { data } = await client.post<ReassignmentResponse>("/loans/loanreassignment", {
    ...payload,
    locale: payload.locale ?? "en",
    dateFormat: payload.dateFormat ?? "yyyy-MM-dd",
  });
  return data;
}
