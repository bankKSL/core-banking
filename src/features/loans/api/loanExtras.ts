import client from "@/api/client";

// ─── Loan extras (doc §7.9, §7.10, §7.17, §7.26, §7.27) ──────────────
// All endpoints previously missing from the codebase. Each wrapper
// follows the contract documented in `docs/loan.md` §7.x.

// ─── Approved amount history (doc §7.9) ────────────────────────────
//
// Backend (`GET /loans/{id}/approved-amount`) returns
// `List<LoanApprovedAmountHistoryData>` with fields:
//   loanId, externalLoanId, newApprovedAmount, oldApprovedAmount, dateOfChange
// and the `PUT /loans/{id}/approved-amount` body is `{ amount, locale }`.

export interface LoanApprovedAmountHistoryEntry {
  loanId: number;
  externalLoanId?: string;
  newApprovedAmount: number;
  oldApprovedAmount: number;
  dateOfChange: string | number[];
}

export async function fetchApprovedAmountHistory(
  loanId: number,
): Promise<LoanApprovedAmountHistoryEntry[]> {
  const { data } = await client.get<LoanApprovedAmountHistoryEntry[]>(
    `/loans/${loanId}/approved-amount`,
  );
  return Array.isArray(data) ? data : [];
}

export interface UpdateApprovedAmountPayload {
  amount: number;
  locale?: string;
}

export async function updateApprovedAmount(
  loanId: number,
  payload: UpdateApprovedAmountPayload,
): Promise<void> {
  await client.put(`/loans/${loanId}/approved-amount`, {
    amount: payload.amount,
    locale: payload.locale ?? "en",
  });
}

// ─── Available disbursement amount (doc §7.10) ─────────────────────
//
// There is no `GET /loans/{id}/available-disbursement-amount` endpoint in
// the backend — the values are exposed on the loan detail payload
// (`loan.delinquent.availableDisbursementAmount(WithOverApplied)`). Only the
// `PUT /loans/{id}/available-disbursement-amount` endpoint exists and its
// body is `{ amount, locale }`.

export interface AvailableDisbursementAmountData {
  availableDisbursementAmount?: number;
  availableDisbursementAmountWithOverApplied?: number;
}

export async function fetchAvailableDisbursementAmount(loanId: number): Promise<number> {
  const { data } = await client.get<{
    delinquent?: AvailableDisbursementAmountData;
  }>(`/loans/${loanId}`, { params: { associations: "all" } });
  const d = data?.delinquent;
  return d?.availableDisbursementAmountWithOverApplied ?? d?.availableDisbursementAmount ?? 0;
}

export interface UpdateAvailableDisbursementAmountPayload {
  amount: number;
  locale?: string;
}

export async function updateAvailableDisbursementAmount(
  loanId: number,
  payload: UpdateAvailableDisbursementAmountPayload,
): Promise<void> {
  await client.put(`/loans/${loanId}/available-disbursement-amount`, {
    amount: payload.amount,
    locale: payload.locale ?? "en",
  });
}

// ─── Re-age / Re-amortization preview (doc §7.17) ──────────────────

export interface ReAgePreviewParams {
  frequencyType: number; // 0=Days, 1=Weeks, 2=Months, 3=Years
  frequencyNumber: number;
  startDate: string;
  numberOfInstallments: number;
  reAgeInterestHandling?: string;
  dateFormat?: string;
  locale?: string;
}

export async function fetchReAgePreview(
  loanId: number,
  params: ReAgePreviewParams,
): Promise<unknown> {
  const { data } = await client.get(`/loans/${loanId}/transactions/reage-preview`, { params });
  return data;
}

export interface ReAmortizationPreviewParams {
  reAmortizationInterestHandling: string;
  dateFormat?: string;
  locale?: string;
}

export async function fetchReAmortizationPreview(
  loanId: number,
  params: ReAmortizationPreviewParams,
): Promise<unknown> {
  const { data } = await client.get(`/loans/${loanId}/transactions/reamortization-preview`, { params });
  return data;
}

// ─── Delinquency actions (doc §7.26) ───────────────────────────────
//
// Backend `GET /loans/{id}/delinquency-actions` returns
// `LoanDelinquencyActionData`: `{ id, action, startDate, endDate,
// createdById, createdOn, updatedById, lastModifiedOn }`. The POST body must
// be `{ action: "pause"|"resume", startDate, endDate?, dateFormat, locale }`
// — `note` is not supported.

export interface DelinquencyAction {
  id: number;
  action: string;
  startDate: string | number[];
  endDate?: string | number[] | null;
  createdById?: number;
  createdOn?: string | number[];
  updatedById?: number;
  lastModifiedOn?: string | number[];
  [key: string]: unknown;
}

export async function fetchDelinquencyActions(loanId: number): Promise<DelinquencyAction[]> {
  const { data } = await client.get<DelinquencyAction[] | { actions?: DelinquencyAction[] }>(
    `/loans/${loanId}/delinquency-actions`,
  );
  if (Array.isArray(data)) return data;
  return data?.actions ?? [];
}

export interface CreateDelinquencyActionPayload {
  action: "pause" | "resume";
  startDate: string;
  /** Required when `action === "pause"`; must NOT be set for `resume`. */
  endDate?: string;
  dateFormat?: string;
  locale?: string;
  [key: string]: unknown;
}

export async function createDelinquencyAction(
  loanId: number,
  payload: CreateDelinquencyActionPayload,
): Promise<void> {
  await client.post(`/loans/${loanId}/delinquency-actions`, {
    ...payload,
    dateFormat: payload.dateFormat ?? "yyyy-MM-dd",
    locale: payload.locale ?? "en",
  });
}

// ─── Guarantors templates (doc §7.27) ──────────────────────────────

export interface GuarantorTemplate {
  guarantorTypeOptions?: Array<{ id: number; code: string; value: string }>;
  clientRelationshipTypeOptions?: Array<{ id: number; name: string; position?: number }>;
  [key: string]: unknown;
}

export async function fetchGuarantorTemplate(loanId: number): Promise<GuarantorTemplate> {
  const { data } = await client.get<GuarantorTemplate>(`/loans/${loanId}/guarantors/template`);
  return data;
}

export interface GuarantorSavingsTemplate {
  accountLinkingOptions?: Array<{
    id: number;
    accountNo?: string;
    productName?: string;
  }>;
  [key: string]: unknown;
}

export async function fetchGuarantorSavingsTemplate(
  loanId: number,
  clientId: number,
): Promise<GuarantorSavingsTemplate> {
  const { data } = await client.get<GuarantorSavingsTemplate>(
    `/loans/${loanId}/guarantors/accounts/template`,
    { params: { clientId } },
  );
  return data;
}
