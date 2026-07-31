import client from "@/api/client";

/**
 * Convert yyyy-MM-dd (HTML date input) → yyyy-MM-dd (Finfact format).
 * Returns undefined if empty or already in Finfact format.
 */

import type {
  Loan,
  LoanListResponse,
  LoanListParams,
  LoanCreateRequest,
  LoanTemplate,
  LoanCommandRequest,
  LoanCommandResponse,
  RepaymentTemplate,
  LoanProduct,
  LoanProductCreateRequest,
  LoanProductTemplate,
  LoanRepaymentSchedule,
  CalculateLoanScheduleRequest,
  LoanDelinquencyTag,
} from "../types/loan";
import { currentDate } from "@/lib/utils";

// ─── Loan Products ───────────────────────────────────────────────

export async function fetchLoanProducts(params?: { offset?: number; limit?: number }): Promise<LoanProduct[]> {
  const { data } = await client.get<LoanProduct[]>("/loanproducts", { params });
  return data;
}

export async function fetchLoanProduct(productId: number): Promise<LoanProduct> {
  const { data } = await client.get<LoanProduct>(`/loanproducts/${productId}`);
  return data;
}

export async function fetchLoanProductTemplate(): Promise<LoanProductTemplate> {
  const { data } = await client.get<LoanProductTemplate>("/loanproducts/template");
  return data;
}

export async function createLoanProduct(payload: LoanProductCreateRequest): Promise<LoanCommandResponse> {
  const { data } = await client.post<LoanCommandResponse>("/loanproducts", payload);
  return data;
}

export async function updateLoanProduct(
  productId: number,
  payload: Partial<LoanProductCreateRequest>,
): Promise<LoanCommandResponse> {
  const { data } = await client.put<LoanCommandResponse>(`/loanproducts/${productId}`, payload);
  return data;
}

export async function deleteLoanProduct(productId: number): Promise<void> {
  await client.delete(`/loanproducts/${productId}`);
}

// ─── Loans ───────────────────────────────────────────────────────

export async function fetchLoans(params: LoanListParams = {}): Promise<LoanListResponse> {
  const { data } = await client.get<LoanListResponse>("/loans", { params });
  return data;
}

export async function fetchLoan(
  loanId: number | string,
  associations = "all",
  template = false,
): Promise<Loan> {
  const { data } = await client.get<Loan>(`/loans/${loanId}`, {
    params: { associations, ...(template ? { template: "true" } : {}) },
  });
  return data;
}

export async function fetchLoanByExternalId(externalId: string): Promise<Loan> {
  const { data } = await client.get<Loan>(`/loans/external-id/${externalId}`, {
    params: { associations: "all" },
  });
  return data;
}

/** Calculate repayment schedule without submitting (preview) */
export async function calculateLoanSchedule(payload: CalculateLoanScheduleRequest): Promise<LoanRepaymentSchedule> {
  const { data } = await client.post<LoanRepaymentSchedule>(
    "/loans",
    {
      ...payload,
      expectedDisbursementDate: currentDate(payload.expectedDisbursementDate),
      locale: "en",
      dateFormat: "yyyy-MM-dd",
    },
    { params: { command: "calculateLoanSchedule" } },
  );
  return data;
}

export async function fetchDelinquencyTags(loanId: number | string): Promise<LoanDelinquencyTag[]> {
  const { data } = await client.get<LoanDelinquencyTag[]>(`/loans/${loanId}/delinquencytags`);
  return Array.isArray(data) ? data : [];
}

export async function fetchLoanTemplate(clientId?: number, productId?: number): Promise<LoanTemplate> {
  const params: Record<string, string> = { templateType: "individual", activeOnly: "true" };
  if (clientId) params.clientId = String(clientId);
  if (productId) params.productId = String(productId);
  const { data } = await client.get<LoanTemplate>("/loans/template", { params });
  return data;
}

export async function createLoan(payload: LoanCreateRequest): Promise<LoanCommandResponse> {
  const { data } = await client.post<LoanCommandResponse>("/loans", {
    ...payload,
    submittedOnDate: currentDate(payload.submittedOnDate),
    expectedDisbursementDate: currentDate(payload.expectedDisbursementDate),
    locale: "en",
    dateFormat: "yyyy-MM-dd",
  });
  return data;
}

export async function updateLoan(loanId: number, payload: Partial<LoanCreateRequest>): Promise<LoanCommandResponse> {
  const { data } = await client.put<LoanCommandResponse>(`/loans/${loanId}`, payload);
  return data;
}

export async function deleteLoan(loanId: number): Promise<LoanCommandResponse> {
  const { data } = await client.delete<LoanCommandResponse>(`/loans/${loanId}`);
  return data;
}

// ─── Loan Lifecycle Commands ──────────────────────────────────────

export async function approveLoan(loanId: number, payload: LoanCommandRequest = {}): Promise<LoanCommandResponse> {
  const { data } = await client.post<LoanCommandResponse>(`/loans/${loanId}`, payload, {
    params: { command: "approve" },
  });
  return data;
}

export async function disburseLoan(loanId: number, payload: LoanCommandRequest = {}): Promise<LoanCommandResponse> {
  const { data } = await client.post<LoanCommandResponse>(`/loans/${loanId}`, payload, {
    params: { command: "disburse" },
  });
  return data;
}

export async function disburseLoanToSavings(
  loanId: number,
  payload: LoanCommandRequest = {},
): Promise<LoanCommandResponse> {
  const { data } = await client.post<LoanCommandResponse>(`/loans/${loanId}`, payload, {
    params: { command: "disburseToSavings" },
  });
  return data;
}

export async function rejectLoan(loanId: number, payload: LoanCommandRequest = {}): Promise<LoanCommandResponse> {
  const { data } = await client.post<LoanCommandResponse>(`/loans/${loanId}`, payload, {
    params: { command: "reject" },
  });
  return data;
}

/** Close (obligations met) — transaction-level command per spec §3.3 */
export async function closeLoan(loanId: number, payload: LoanCommandRequest = {}): Promise<LoanCommandResponse> {
  return makeTransaction(loanId, payload as Record<string, unknown>, "close");
}

export async function undoApproval(loanId: number): Promise<LoanCommandResponse> {
  const { data } = await client.post<LoanCommandResponse>(
    `/loans/${loanId}`,
    {},
    {
      params: { command: "undoapproval" },
    },
  );
  return data;
}

export async function undoDisbursal(loanId: number): Promise<LoanCommandResponse> {
  const { data } = await client.post<LoanCommandResponse>(
    `/loans/${loanId}`,
    {},
    {
      params: { command: "undodisbursal" },
    },
  );
  return data;
}

// ─── Repayments ──────────────────────────────────────────────────

export async function fetchRepaymentTemplate(loanId: number): Promise<RepaymentTemplate> {
  const { data } = await client.get<RepaymentTemplate>(`/loans/${loanId}/transactions/template`, {
    params: { command: "repayment" },
  });
  return data;
}

// ─── Loan Transaction Template ──────────────────────────────

export async function fetchTransactionTemplate(loanId: number, command?: string): Promise<Record<string, unknown>> {
  const { data } = await client.get<Record<string, unknown>>(`/loans/${loanId}/transactions/template`, {
    params: command ? { command } : undefined,
  });
  return data;
}

// ─── Generic Transaction Posting ────────────────────────────

export async function makeTransaction(
  loanId: number,
  payload: Record<string, unknown>,
  command: string,
): Promise<LoanCommandResponse> {
  const { data } = await client.post<LoanCommandResponse>(
    `/loans/${loanId}/transactions`,
    { ...payload, locale: "en", dateFormat: "yyyy-MM-dd" },
    { params: { command } },
  );
  return data;
}

// ─── Additional Lifecycle Commands ──────────────────────────

export async function waiveInterest(loanId: number, payload: LoanCommandRequest = {}): Promise<LoanCommandResponse> {
  return makeTransaction(loanId, payload as Record<string, unknown>, "waiveinterest");
}

export async function prepayLoan(loanId: number, payload: LoanCommandRequest = {}): Promise<LoanCommandResponse> {
  return makeTransaction(loanId, payload as Record<string, unknown>, "prepayLoan");
}

export async function forecloseLoan(loanId: number, payload: LoanCommandRequest = {}): Promise<LoanCommandResponse> {
  return makeTransaction(loanId, payload as Record<string, unknown>, "foreclosure");
}

export async function writeOffLoan(loanId: number, payload: LoanCommandRequest = {}): Promise<LoanCommandResponse> {
  return makeTransaction(loanId, payload as Record<string, unknown>, "writeoff");
}

export async function rejectLoanApplication(
  loanId: number,
  payload: LoanCommandRequest = {},
): Promise<LoanCommandResponse> {
  return rejectLoan(loanId, payload);
}

export async function withdrawLoanApplication(
  loanId: number,
  payload: LoanCommandRequest = {},
): Promise<LoanCommandResponse> {
  const { data } = await client.post<LoanCommandResponse>(`/loans/${loanId}`, payload, {
    params: { command: "withdrawnByApplicant" },
  });
  return data;
}

/** Close as rescheduled — transaction-level command per spec §3.3 */
export async function closeLoanAsRescheduled(
  loanId: number,
  payload: LoanCommandRequest = {},
): Promise<LoanCommandResponse> {
  return makeTransaction(loanId, payload as Record<string, unknown>, "close-rescheduled");
}

// ─── Loan Repayment Schedule ──────────────────────────────────────

export async function fetchRepaymentSchedule(loanId: number): Promise<Loan> {
  const { data } = await client.get<Loan>(`/loans/${loanId}`, {
    params: { associations: "repaymentSchedule" },
  });
  return data;
}

// ─── Loan Transactions ────────────────────────────────────────────

export async function fetchLoanTransactions(loanId: number): Promise<Loan> {
  const { data } = await client.get<Loan>(`/loans/${loanId}`, {
    params: { associations: "all" },
  });
  return data;
}
