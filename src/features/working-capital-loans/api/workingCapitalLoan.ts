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
  const { data } = await client.get<DelinquencyBucket[]>("/delinquency/buckets");
  return Array.isArray(data) ? data : [];
}

export async function createDelinquencyBucket(payload: {
  name: string;
  bucketType: string;
  ranges: Array<{ classification: string; minimumAgeDays: number; maximumAgeDays: number }>;
}): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/delinquency/buckets", payload);
  return data;
}

export async function fetchWCLoanProducts(): Promise<WCLoanProduct[]> {
  const { data } = await client.get<WCLoanProduct[] | { pageItems?: WCLoanProduct[] }>("/working-capital-loan-products");
  const list = Array.isArray(data) ? data : data?.pageItems ?? [];
  return list.map(mapWCLoanProduct);
}

export async function fetchWCLoanProduct(productId: number): Promise<WCLoanProduct> {
  const { data } = await client.get<WCLoanProduct>(`/working-capital-loan-products/${productId}`);
  return mapWCLoanProduct(data);
}

function mapWCLoanProduct(product: WCLoanProduct): WCLoanProduct {
  if (!product) return product;
  return {
    ...product,
    delinquencyBucketId: product.delinquencyBucketId ?? product.delinquencyBucket?.id,
  };
}

export async function fetchWCLoanProductTemplate(): Promise<WCLoanProductTemplate> {
  const { data } = await client.get<WCLoanProductTemplate>("/working-capital-loan-products/template");
  return {
    ...data,
    repaymentFrequencyTypeOptions: data?.repaymentFrequencyTypeOptions ?? data?.periodFrequencyTypeOptions,
  };
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
  const { data } = await client.get<{
    effectiveInterestRate?: number;
    payments?: Array<{
      paymentNo: number;
      paymentDate: string | number[];
      expectedPaymentAmount: number;
      expectedBalance: number;
      actualBalance?: number;
      actualPaymentAmount?: number;
      expectedAmortizationAmount: number;
      actualAmortizationAmount?: number;
      expectedDiscountFeeBalance: number;
      actualDiscountFeeBalance?: number;
    }>;
  }>(`/working-capital-loans/${loanId}/amortization-schedule`);
  const payments = data?.payments ?? [];
  return payments.map((p) => ({
    period: p.paymentNo,
    fromDate: p.paymentDate,
    dueDate: p.paymentDate,
    expectedAmount: p.expectedPaymentAmount,
    paidAmount: p.actualPaymentAmount ?? 0,
    outstandingAmount: p.expectedBalance,
    eir: data?.effectiveInterestRate,
  }));
}

export async function fetchDelinquencyRangeSchedule(loanId: number): Promise<DelinquencyRangeScheduleEntry[]> {
  const { data } = await client.get<
    Array<{
      periodNumber?: number;
      fromDate?: string | number[];
      toDate?: string | number[];
      expectedAmount?: number;
      paidAmount?: number;
      outstandingAmount?: number;
      minPaymentCriteriaMet?: boolean;
      delinquentDays?: number;
      delinquentAmount?: number;
    }>
  >(`/working-capital-loans/${loanId}/delinquency-range-schedule`);
  const list = Array.isArray(data) ? data : [];
  return list.map((e, index) => ({
    period: e.periodNumber ?? index + 1,
    fromDate: e.fromDate,
    toDate: e.toDate,
    expectedAmount: e.expectedAmount,
    paidAmount: e.paidAmount,
    outstandingAmount: e.outstandingAmount,
    minPaymentCriteriaMet: e.minPaymentCriteriaMet,
    delinquencyStatus:
      e.delinquentDays && e.delinquentDays > 0 ? `Delinquent ${e.delinquentDays} days` : undefined,
  }));
}

export async function fetchDelinquencyTags(loanId: number): Promise<Array<{
  id: number;
  tagId?: number;
  rangeId?: number;
  classification?: string;
  delinquencyRange?: { id: number; classification?: string; minimumAgeDays?: number; maximumAgeDays?: number };
  addedOnDate?: string | number[];
  liftedOnDate?: string | number[] | null;
  outstandingAmount?: number;
}>> {
  const { data } = await client.get(`/working-capital-loans/${loanId}/delinquencyrangetags`);
  const list = Array.isArray(data) ? data : [];
  return list.map((tag: {
    id: number;
    rangeId?: number;
    delinquencyRange?: { id?: number; classification?: string };
    addedOnDate?: string | number[];
    liftedOnDate?: string | number[] | null;
    outstandingAmount?: number;
  }) => ({
    id: tag.id,
    tagId: tag.rangeId ?? tag.delinquencyRange?.id,
    classification: tag.delinquencyRange?.classification,
    addedOnDate: tag.addedOnDate,
    liftedOnDate: tag.liftedOnDate,
    outstandingAmount: tag.outstandingAmount,
  }));
}

export async function fetchWCLoanTransactions(loanId: number): Promise<WCLoanTransaction[]> {
  const { data } = await client.get<WCLoanTransaction[] | { content?: WCLoanTransaction[] }>(
    `/working-capital-loans/${loanId}/transactions`,
  );
  const list = Array.isArray(data) ? data : data?.content ?? [];
  return list.map((tx) => ({
    ...tx,
    date: tx.transactionDate ?? tx.date,
    amount: tx.transactionAmount ?? tx.amount,
  }));
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
  const { data } = await client.get<RateChangeHistoryEntry[]>(
    `/working-capital-loans/${loanId}/rate-changes`,
  );
  const list = Array.isArray(data) ? data : [];
  return list.map((rc) => ({
    ...rc,
    periodPaymentRate: rc.newRate ?? rc.periodPaymentRate,
    fromDate: rc.effectiveDate ?? rc.fromDate,
    createdOnDate: rc.createdDate ?? rc.createdOnDate,
  }));
}
