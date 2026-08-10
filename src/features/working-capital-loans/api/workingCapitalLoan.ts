import client from "@/api/client";
import type {
  WCLoanProduct,
  WCLoanProductCreateRequest,
  WCLoanProductTemplate,
  WCLoan,
  WCLoanCreateRequest,
  WCLoanCommandRequest,
  WCLoanCommandResponse,
  WCLoanListParams,
  WCLoanListResponse,
  WCLoanTemplate,
  WCLoanTransaction,
  AmortizationScheduleEntry,
  DelinquencyRangeScheduleEntry,
  DelinquencyActionRequest,
  RateChangeRequest,
  RateChangeHistoryEntry,
  RepaymentRequest,
  DelinquencyBucket,
} from "../types/workingCapitalLoan";

export async function fetchDelinquencyBuckets(): Promise<DelinquencyBucket[]> {
  const { data } = await client.get<DelinquencyBucket[]>("/delinquencybuckets");
  return Array.isArray(data) ? data : [];
}

export async function createDelinquencyBucket(payload: {
  name: string;
  bucketType: string;
  ranges: Array<{ classification: string; minimumAgeDays: number; maximumAgeDays: number }>;
}): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/delinquencybuckets", payload);
  return data;
}

export async function fetchWCLoanProducts(): Promise<WCLoanProduct[]> {
  const { data } = await client.get<WCLoanProduct[] | { pageItems?: WCLoanProduct[] }>("/working-capital-loan-products");
  if (Array.isArray(data)) return data;
  return data?.pageItems ?? [];
}

export async function fetchWCLoanProduct(productId: number): Promise<WCLoanProduct> {
  const { data } = await client.get<WCLoanProduct>(`/working-capital-loan-products/${productId}`);
  return data;
}

export async function fetchWCLoanProductTemplate(): Promise<WCLoanProductTemplate> {
  const { data } = await client.get<WCLoanProductTemplate>("/working-capital-loan-products/template");
  return data;
}

export async function createWCLoanProduct(payload: WCLoanProductCreateRequest): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/working-capital-loan-products", payload);
  return data;
}

export async function fetchWCLoans(params: WCLoanListParams = {}): Promise<WCLoanListResponse> {
  const { data } = await client.get<WCLoanListResponse | WCLoan[]>("/working-capital-loans", { params });
  if (Array.isArray(data)) return { pageItems: data, totalElements: data.length };
  return data;
}

export async function fetchWCLoan(loanId: number | string): Promise<WCLoan> {
  const { data } = await client.get<WCLoan>(`/working-capital-loans/${loanId}`);
  return data;
}

export async function fetchWCLoanTemplate(clientId?: number, productId?: number): Promise<WCLoanTemplate> {
  const params: Record<string, string> = {};
  if (clientId) params.clientId = String(clientId);
  if (productId) params.productId = String(productId);
  const { data } = await client.get<WCLoanTemplate>("/working-capital-loans/template", { params });
  return data;
}

export async function createWCLoan(payload: WCLoanCreateRequest): Promise<WCLoanCommandResponse> {
  const { data } = await client.post<WCLoanCommandResponse>("/working-capital-loans", {
    ...payload,
    locale: "en",
    dateFormat: "yyyy-MM-dd",
  });
  return data;
}

export async function approveWCLoan(loanId: number, payload: WCLoanCommandRequest): Promise<WCLoanCommandResponse> {
  const { data } = await client.post<WCLoanCommandResponse>(`/working-capital-loans/${loanId}`, payload, {
    params: { command: "approve" },
  });
  return data;
}

export async function disburseWCLoan(loanId: number, payload: WCLoanCommandRequest): Promise<WCLoanCommandResponse> {
  const { data } = await client.post<WCLoanCommandResponse>(`/working-capital-loans/${loanId}`, payload, {
    params: { command: "disburse" },
  });
  return data;
}

export async function makeWCRepayment(loanId: number, payload: RepaymentRequest): Promise<WCLoanCommandResponse> {
  const { data } = await client.post<WCLoanCommandResponse>(`/working-capital-loans/${loanId}/transactions`, payload, {
    params: { command: "repayment" },
  });
  return data;
}

export async function fetchAmortizationSchedule(loanId: number): Promise<AmortizationScheduleEntry[]> {
  const { data } = await client.get<AmortizationScheduleEntry[]>(
    `/working-capital-loans/${loanId}/amortization-schedule`,
  );
  return Array.isArray(data) ? data : [];
}

export async function fetchDelinquencyRangeSchedule(loanId: number): Promise<DelinquencyRangeScheduleEntry[]> {
  const { data } = await client.get<DelinquencyRangeScheduleEntry[]>(
    `/working-capital-loans/${loanId}/delinquency-range-schedule`,
  );
  return Array.isArray(data) ? data : [];
}

export async function fetchDelinquencyTags(loanId: number): Promise<Array<{
  id: number;
  tagId?: number;
  classification?: string;
  addedOnDate?: string | number[];
  liftedOnDate?: string | number[] | null;
  outstandingAmount?: number;
}>> {
  const { data } = await client.get(`/working-capital-loans/${loanId}/delinquencyrangetags`);
  return Array.isArray(data) ? data : [];
}

export async function fetchWCLoanTransactions(loanId: number): Promise<WCLoanTransaction[]> {
  const { data } = await client.get<WCLoanTransaction[]>(`/working-capital-loans/${loanId}/transactions`);
  return Array.isArray(data) ? data : [];
}

export async function createDelinquencyAction(
  loanId: number,
  payload: DelinquencyActionRequest,
): Promise<WCLoanCommandResponse> {
  const { data } = await client.post<WCLoanCommandResponse>(
    `/working-capital-loans/${loanId}/delinquency-actions`,
    payload,
  );
  return data;
}

export async function updatePaymentRate(
  loanId: number,
  payload: RateChangeRequest,
): Promise<WCLoanCommandResponse> {
  const { data } = await client.put<WCLoanCommandResponse>(
    `/working-capital-loans/${loanId}/payment-rate`,
    payload,
  );
  return data;
}

export async function fetchRateChangeHistory(loanId: number): Promise<RateChangeHistoryEntry[]> {
  const { data } = await client.get<RateChangeHistoryEntry[]>(`/working-capital-loans/${loanId}/rate-changes`);
  return Array.isArray(data) ? data : [];
}
