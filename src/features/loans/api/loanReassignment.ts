import client from "@/api/client";

export interface ReassignmentTemplate {
  officeOptions: Array<{ id: number; name: string; nameDecorated: string }>;
  loanOfficerOptions: Array<{ id: number; displayName: string }>;
}

export interface ReassignmentRequest {
  officeId: number;
  fromLoanOfficerId?: number;
  toLoanOfficerId: number;
  loanIds: number[];
}

export async function fetchReassignmentTemplate(): Promise<ReassignmentTemplate> {
  const { data } = await client.get<ReassignmentTemplate>("/loans/loanreassignment/template");
  return data;
}

export async function executeReassignment(payload: ReassignmentRequest): Promise<void> {
  await client.post("/loans/loanreassignment", payload);
}
