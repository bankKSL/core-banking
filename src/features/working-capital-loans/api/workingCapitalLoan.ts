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
  MarkAsFraudRequest,
  UpdateDiscountRequest,
  WCTransactionCommand,
  RepaymentLikeRequest,
  DiscountFeeTransactionRequest,
  DiscountFeeAdjustmentRequest,
  ChargeOffRequest,
  UndoChargeOffRequest,
  UndoTransactionRequest,
  WCCommandTemplateData,
  WCTemplateType,
  WCChargeData,
  CreateLoanChargeRequest,
  ChargeAdjustmentRequest,
  BreachActionRequest,
  NearBreachActionRequest,
  WCBreachActionData,
  WCNearBreachActionData,
  WCBreachSchedulePeriod,
  WCBreachConfig,
  WCBreachConfigRequest,
  WCNearBreachConfig,
  WCNearBreachConfigRequest,
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

export async function updateWCLoanProduct(
  productId: number,
  payload: Partial<WCLoanProductCreateRequest>,
): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/working-capital-loan-products/${productId}`, {
    ...payload,
    locale: "en",
    dateFormat: "yyyy-MM-dd",
  });
  return data;
}

export async function deleteWCLoanProduct(productId: number): Promise<{ resourceId: number }> {
  const { data } = await client.delete<{ resourceId: number }>(`/working-capital-loan-products/${productId}`);
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
  return executeStateTransition(loanId, "approve", payload);
}

export async function disburseWCLoan(loanId: number, payload: WCLoanCommandRequest): Promise<WCLoanCommandResponse> {
  return executeStateTransition(loanId, "disburse", payload);
}

type StateTransitionCommand = "approve" | "reject" | "undoapproval" | "disburse" | "undodisbursal";

export async function executeStateTransition(
  loanId: number,
  command: StateTransitionCommand,
  payload: object = {},
): Promise<WCLoanCommandResponse> {
  const { data } = await client.post<WCLoanCommandResponse>(`/working-capital-loans/${loanId}`, payload, {
    params: { command },
  });
  return data;
}

export async function updateWCLoan(
  loanId: number,
  payload: Partial<WCLoanCreateRequest>,
): Promise<WCLoanCommandResponse> {
  const { data } = await client.put<WCLoanCommandResponse>(`/working-capital-loans/${loanId}`, {
    ...payload,
    locale: "en",
    dateFormat: "yyyy-MM-dd",
  });
  return data;
}

export async function deleteWCLoan(loanId: number): Promise<{ resourceId: number }> {
  const { data } = await client.delete<{ resourceId: number }>(`/working-capital-loans/${loanId}`);
  return data;
}

export async function fetchWCLoanByExternalId(externalId: string): Promise<WCLoan> {
  const { data } = await client.get<WCLoan>(`/working-capital-loans/external-id/${encodeURIComponent(externalId)}`);
  return data;
}

export async function markWCLoanAsFraud(loanId: number, payload: MarkAsFraudRequest): Promise<WCLoanCommandResponse> {
  const { data } = await client.put<WCLoanCommandResponse>(`/working-capital-loans/${loanId}/mark-as-fraud`, payload);
  return data;
}

export async function updateWCDiscount(
  loanId: number,
  payload: UpdateDiscountRequest,
): Promise<WCLoanCommandResponse> {
  const { data } = await client.put<WCLoanCommandResponse>(`/working-capital-loans/${loanId}/discount`, {
    ...payload,
    dateFormat: "yyyy-MM-dd",
  });
  return data;
}

export async function executeWCTransactionCommand(
  loanId: number,
  command: WCTransactionCommand,
  payload:
    | RepaymentLikeRequest
    | DiscountFeeTransactionRequest
    | DiscountFeeAdjustmentRequest
    | ChargeOffRequest
    | UndoChargeOffRequest
    | object = {},
): Promise<WCLoanCommandResponse> {
  const { data } = await client.post<WCLoanCommandResponse>(
    `/working-capital-loans/${loanId}/transactions`,
    payload,
    { params: { command } },
  );
  return data;
}

export async function makeWCRepayment(loanId: number, payload: RepaymentRequest): Promise<WCLoanCommandResponse> {
  return executeWCTransactionCommand(loanId, "repayment", payload);
}

export async function undoWCTransaction(
  loanId: number,
  transactionId: number,
  payload: UndoTransactionRequest = {},
): Promise<WCLoanCommandResponse> {
  const { data } = await client.post<WCLoanCommandResponse>(
    `/working-capital-loans/${loanId}/transactions/${transactionId}`,
    payload,
    { params: { command: "undo" } },
  );
  return data;
}

export async function fetchWCLoanCommandTemplate(
  loanId: number,
  templateType: WCTemplateType,
): Promise<WCCommandTemplateData> {
  const { data } = await client.get<WCCommandTemplateData>(`/working-capital-loans/${loanId}/template`, {
    params: { templateType },
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

// ─── Charges (§3.3) ───

export async function fetchWCLoanCharges(loanId: number): Promise<WCChargeData[]> {
  const { data } = await client.get<WCChargeData[]>(`/working-capital-loans/${loanId}/charges`);
  return Array.isArray(data) ? data : [];
}

export async function createWCLoanCharge(
  loanId: number,
  payload: CreateLoanChargeRequest,
): Promise<WCLoanCommandResponse> {
  const { data } = await client.post<WCLoanCommandResponse>(`/working-capital-loans/${loanId}/charges`, {
    ...payload,
    locale: "en",
    dateFormat: "yyyy-MM-dd",
  });
  return data;
}

export async function adjustWCLoanCharge(
  loanId: number,
  loanChargeId: number,
  payload: ChargeAdjustmentRequest,
): Promise<WCLoanCommandResponse> {
  const { data } = await client.post<WCLoanCommandResponse>(
    `/working-capital-loans/${loanId}/charges/${loanChargeId}`,
    { ...payload, dateFormat: "yyyy-MM-dd" },
    { params: { command: "adjustment" } },
  );
  return data;
}

// ─── Breach / near-breach actions & schedules (§3.4) ───

export async function fetchBreachActions(loanId: number): Promise<WCBreachActionData[]> {
  const { data } = await client.get<WCBreachActionData[]>(`/working-capital-loans/${loanId}/breach-actions`);
  return Array.isArray(data) ? data : [];
}

export async function createBreachAction(
  loanId: number,
  payload: BreachActionRequest,
): Promise<WCLoanCommandResponse> {
  const { data } = await client.post<WCLoanCommandResponse>(`/working-capital-loans/${loanId}/breach-actions`, payload);
  return data;
}

export async function fetchNearBreachActions(loanId: number): Promise<WCNearBreachActionData[]> {
  const { data } = await client.get<WCNearBreachActionData[]>(`/working-capital-loans/${loanId}/near-breach-actions`);
  return Array.isArray(data) ? data : [];
}

export async function createNearBreachAction(
  loanId: number,
  payload: NearBreachActionRequest,
): Promise<WCLoanCommandResponse> {
  const { data } = await client.post<WCLoanCommandResponse>(
    `/working-capital-loans/${loanId}/near-breach-actions`,
    payload,
  );
  return data;
}

export async function fetchBreachSchedule(loanId: number): Promise<WCBreachSchedulePeriod[]> {
  const { data } = await client.get<WCBreachSchedulePeriod[]>(`/working-capital-loans/${loanId}/breach-schedule`);
  return Array.isArray(data) ? data : [];
}

// ─── Configuration modules (§3.5) ───

export async function fetchBreachConfigs(): Promise<WCBreachConfig[]> {
  const { data } = await client.get<WCBreachConfig[]>("/working-capital/breach/breaches");
  return Array.isArray(data) ? data : [];
}

export async function createBreachConfig(payload: WCBreachConfigRequest): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/working-capital/breach/breaches", payload);
  return data;
}

export async function updateBreachConfig(
  breachId: number,
  payload: Partial<WCBreachConfigRequest>,
): Promise<object> {
  const { data } = await client.put(`/working-capital/breach/breaches/${breachId}`, payload);
  return data as object;
}

export async function deleteBreachConfig(breachId: number): Promise<void> {
  await client.delete(`/working-capital/breach/breaches/${breachId}`);
}

export async function fetchNearBreachConfigs(): Promise<WCNearBreachConfig[]> {
  const { data } = await client.get<WCNearBreachConfig[]>("/working-capital/near-breach");
  return Array.isArray(data) ? data : [];
}

export async function createNearBreachConfig(payload: WCNearBreachConfigRequest): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/working-capital/near-breach", payload);
  return data;
}

export async function updateNearBreachConfig(
  nearBreachId: number,
  payload: Partial<WCNearBreachConfigRequest>,
): Promise<object> {
  const { data } = await client.put(`/working-capital/near-breach/${nearBreachId}`, payload);
  return data as object;
}

export async function deleteNearBreachConfig(nearBreachId: number): Promise<void> {
  await client.delete(`/working-capital/near-breach/${nearBreachId}`);
}
