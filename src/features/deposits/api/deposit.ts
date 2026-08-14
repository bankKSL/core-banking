import client from "@/api/client";

/**
 * Convert yyyy-MM-dd (HTML date input) → yyyy-MM-dd (Service format).
 * Returns undefined if empty or already in Service format.
 */

import type {
  SavingsAccount,
  SavingsAccountListResponse,
  SavingsAccountListParams,
  SavingsAccountCreateRequest,
  SavingsAccountTemplate,
  SavingsCommandResponse,
  SavingsTransactionRequest,
  SavingsTransactionTemplate,
  SavingsProduct,
  SavingsProductCreateRequest,
  FixedDepositAccount,
  FixedDepositListParams,
  RecurringDepositAccount,
  RecurringDepositListParams,
  RecurringDepositProduct,
  RecurringDepositProductCreateRequest,
  FixedDepositProduct,
  FixedDepositProductCreateRequest,
} from "../types/deposit";
import { currentDate } from "@/lib/utils";

// ─── Savings Products ────────────────────────────────────────────

export interface SavingsProductTemplate {
  currencyOptions: Array<{
    code: string;
    name: string;
    decimalPlaces: number;
    inMultiplesOf?: number;
    displaySymbol?: string;
  }>;
  interestCompoundingPeriodTypeOptions: Array<{ id: number; code: string; value: string }>;
  interestPostingPeriodTypeOptions: Array<{ id: number; code: string; value: string }>;
  interestCalculationTypeOptions: Array<{ id: number; code: string; value: string }>;
  interestCalculationDaysInYearTypeOptions: Array<{ id: number; code: string; value: string }>;
  lockinPeriodFrequencyTypeOptions: Array<{ id: number; code: string; value: string }>;
  withdrawalFeeTypeOptions: Array<{ id: number; code: string; value: string }>;
  paymentTypeOptions: Array<{ id: number; name: string }>;
  accountingRuleOptions: Array<{ id: number; code: string; value: string }>;
  accountingMappingOptions: Record<string, Array<{ id: number; name: string; glCode: string }>>;
  chargeOptions: Array<{
    id: number;
    name: string;
    amount: number;
    chargeTimeType?: { id: number };
    chargeCalculationType?: { id: number };
  }>;
  penaltyOptions: Array<{ id: number; name: string; amount: number }>;
  taxGroupOptions: Array<{ id: number; name: string }>;
  accountMappingForPayment?: string;
}

export async function fetchSavingsProductTemplate(): Promise<SavingsProductTemplate> {
  const { data } = await client.get<SavingsProductTemplate>("/savingsproducts/template");
  return data;
}

export async function fetchSavingsProductWithTemplate(
  productId: number,
): Promise<SavingsProduct & SavingsProductTemplate> {
  const { data } = await client.get<SavingsProduct & SavingsProductTemplate>(`/savingsproducts/${productId}`, {
    params: { template: true },
  });
  return data;
}

export async function fetchSavingsProducts(params?: { offset?: number; limit?: number }): Promise<SavingsProduct[]> {
  const { data } = await client.get<SavingsProduct[]>("/savingsproducts", { params });
  return data;
}

export async function fetchSavingsProduct(productId: number): Promise<SavingsProduct> {
  const { data } = await client.get<SavingsProduct>(`/savingsproducts/${productId}`);
  return data;
}

export async function createSavingsProduct(payload: SavingsProductCreateRequest): Promise<SavingsCommandResponse> {
  const { data } = await client.post<SavingsCommandResponse>("/savingsproducts", payload);
  return data;
}

export async function updateSavingsProduct(
  productId: number,
  payload: Partial<SavingsProductCreateRequest>,
): Promise<SavingsCommandResponse> {
  const { data } = await client.put<SavingsCommandResponse>(`/savingsproducts/${productId}`, payload);
  return data;
}

// ─── Savings Accounts ────────────────────────────────────────────

export async function fetchSavingsAccounts(params: SavingsAccountListParams = {}): Promise<SavingsAccountListResponse> {
  const { data } = await client.get<SavingsAccountListResponse>("/savingsaccounts", { params });
  return data;
}

export async function fetchSavingsAccount(accountId: number | string): Promise<SavingsAccount> {
  const { data } = await client.get<SavingsAccount>(`/savingsaccounts/${accountId}`, {
    params: {
      staffInSelectedOfficeOnly: false,
      associations: "all",
    },
  });
  return data;
}

export async function fetchSavingsAccountTemplate(
  clientId?: number,
  productId?: number,
): Promise<SavingsAccountTemplate> {
  const params: Record<string, string> = {};
  if (clientId) params.clientId = String(clientId);
  if (productId) params.productId = String(productId);
  const { data } = await client.get<SavingsAccountTemplate>("/savingsaccounts/template", { params });
  return data;
}

export async function createSavingsAccount(payload: SavingsAccountCreateRequest): Promise<SavingsCommandResponse> {
  const { data } = await client.post<SavingsCommandResponse>("/savingsaccounts", {
    ...payload,
    submittedOnDate: currentDate(payload.submittedOnDate),
    dateFormat: "yyyy-MM-dd",
    locale: "en",
  });
  return data;
}

export async function updateSavingsAccount(
  accountId: number,
  payload: Partial<SavingsAccountCreateRequest>,
): Promise<SavingsCommandResponse> {
  const { data } = await client.put<SavingsCommandResponse>(`/savingsaccounts/${accountId}`, payload);
  return data;
}

export async function deleteSavingsAccount(accountId: number): Promise<SavingsCommandResponse> {
  const { data } = await client.delete<SavingsCommandResponse>(`/savingsaccounts/${accountId}`);
  return data;
}

// ─── Savings Account Lifecycle Commands ───────────────────────────

export async function approveSavingsAccount(
  accountId: number,
  payload: { approvedOnDate?: string; locale?: string; dateFormat?: string } = {},
): Promise<SavingsCommandResponse> {
  const { data } = await client.post<SavingsCommandResponse>(`/savingsaccounts/${accountId}`, payload, {
    params: { command: "approve" },
  });
  return data;
}

export async function activateSavingsAccount(
  accountId: number,
  payload: { activatedOnDate?: string; locale?: string; dateFormat?: string } = {},
): Promise<SavingsCommandResponse> {
  const { data } = await client.post<SavingsCommandResponse>(`/savingsaccounts/${accountId}`, payload, {
    params: { command: "activate" },
  });
  return data;
}

export async function closeSavingsAccount(
  accountId: number,
  payload: {
    closedOnDate?: string;
    locale?: string;
    dateFormat?: string;
    withdrawBalance?: boolean;
    paymentTypeId?: number;
    note?: string;
    postInterestValidationOnClosure?: boolean;
  } = {},
): Promise<SavingsCommandResponse> {
  const { data } = await client.post<SavingsCommandResponse>(`/savingsaccounts/${accountId}`, payload, {
    params: { command: "close" },
  });
  return data;
}

// ─── Deposit / Withdraw ──────────────────────────────────────────

export async function fetchDepositTemplate(accountId: number): Promise<SavingsTransactionTemplate> {
  const { data } = await client.get<SavingsTransactionTemplate>(`/savingsaccounts/${accountId}/transactions/template`, {
    params: { command: "deposit" },
  });
  return data;
}

export async function makeDeposit(
  accountId: number,
  payload: SavingsTransactionRequest,
): Promise<SavingsCommandResponse> {
  const { data } = await client.post<SavingsCommandResponse>(
    `/savingsaccounts/${accountId}/transactions`,
    { ...payload, locale: "en" },
    { params: { command: "deposit" } },
  );
  return data;
}

export async function fetchWithdrawTemplate(accountId: number): Promise<SavingsTransactionTemplate> {
  const { data } = await client.get<SavingsTransactionTemplate>(`/savingsaccounts/${accountId}/transactions/template`, {
    params: { command: "withdrawal" },
  });
  return data;
}

export async function makeWithdrawal(
  accountId: number,
  payload: SavingsTransactionRequest,
): Promise<SavingsCommandResponse> {
  const { data } = await client.post<SavingsCommandResponse>(
    `/savingsaccounts/${accountId}/transactions`,
    { ...payload, locale: "en", dateFormat: "yyyy-MM-dd" },
    { params: { command: "withdrawal" } },
  );
  return data;
}

// ─── Fixed Deposit Lifecycle Commands ───────────────────────────
// Section 10.4 — POST /fixeddepositaccounts/{id}?command={command}

export async function fixedDepositCommand(
  accountId: number,
  command: string,
  data: Record<string, unknown> = {},
): Promise<SavingsCommandResponse> {
  // Convert any date fields from yyyy-MM-dd to yyyy-MM-dd
  const dateFields = ["approvedOnDate", "activatedOnDate", "closedOnDate", "rejectedOnDate", "withdrawnOnDate"];
  const converted: Record<string, unknown> = { locale: "en", dateFormat: "yyyy-MM-dd" };
  for (const [k, v] of Object.entries(data)) {
    converted[k] = dateFields.includes(k) ? currentDate(v as string | undefined) : v;
  }
  const { data: result } = await client.post<SavingsCommandResponse>(`/fixeddepositaccounts/${accountId}`, converted, {
    params: { command },
  });
  return result;
}

export async function approveFixedDeposit(accountId: number, approvedOnDate?: string) {
  return fixedDepositCommand(
    accountId,
    "approve",
    approvedOnDate ? { approvedOnDate } : { approvedOnDate: new Date().toISOString().split("T")[0] },
  );
}

export async function activateFixedDeposit(accountId: number, activatedOnDate?: string) {
  return fixedDepositCommand(
    accountId,
    "activate",
    activatedOnDate ? { activatedOnDate } : { activatedOnDate: new Date().toISOString().split("T")[0] },
  );
}

export async function closeFixedDeposit(accountId: number, payload?: Record<string, unknown>) {
  return fixedDepositCommand(accountId, "close", payload ?? { closedOnDate: new Date().toISOString().split("T")[0] });
}

export async function prematureCloseFixedDeposit(accountId: number, payload?: Record<string, unknown>) {
  return fixedDepositCommand(
    accountId,
    "prematureClose",
    payload ?? { closedOnDate: new Date().toISOString().split("T")[0] },
  );
}

export async function rejectFixedDeposit(accountId: number, rejectedOnDate?: string) {
  return fixedDepositCommand(
    accountId,
    "reject",
    rejectedOnDate ? { rejectedOnDate } : { rejectedOnDate: new Date().toISOString().split("T")[0] },
  );
}

export async function withdrawFixedDeposit(accountId: number, withdrawnOnDate?: string) {
  return fixedDepositCommand(
    accountId,
    "withdrawnByApplicant",
    withdrawnOnDate ? { withdrawnOnDate } : { withdrawnOnDate: new Date().toISOString().split("T")[0] },
  );
}

export async function undoApprovalFixedDeposit(accountId: number) {
  return fixedDepositCommand(accountId, "undoApproval");
}

export async function undoActivationFixedDeposit(accountId: number) {
  return fixedDepositCommand(accountId, "undoActivation");
}

export async function calculateInterestFixedDeposit(accountId: number) {
  return fixedDepositCommand(accountId, "calculateInterest");
}

export async function postInterestFixedDeposit(accountId: number) {
  return fixedDepositCommand(accountId, "postInterest");
}

export async function calculatePrematureAmount(accountId: number, closedOnDate?: string) {
  return fixedDepositCommand(accountId, "calculatePrematureAmount", closedOnDate ? { closedOnDate } : {});
}

// ─── Create Fixed Deposit (10.2) ──────────────────────────────

export async function createFixedDepositAccount(payload: Record<string, unknown>): Promise<SavingsCommandResponse> {
  const { data } = await client.post<SavingsCommandResponse>("/fixeddepositaccounts", {
    locale: "en",
    dateFormat: "yyyy-MM-dd",
    ...payload,
  });
  return data;
}

export async function updateFixedDepositAccount(
  accountId: number,
  payload: Record<string, unknown>,
): Promise<SavingsCommandResponse> {
  const { data } = await client.put<SavingsCommandResponse>(`/fixeddepositaccounts/${accountId}`, {
    locale: "en",
    dateFormat: "yyyy-MM-dd",
    ...payload,
  });
  return data;
}

// ─── Fetch Fixed Deposits (10.1, 10.3) ────────────────────────

export async function fetchFixedDepositAccounts(params: FixedDepositListParams = {}): Promise<FixedDepositAccount[]> {
  const { data } = await client.get<FixedDepositAccount[]>("/fixeddepositaccounts", { params });
  return data ?? [];
}

export async function fetchFixedDepositAccount(accountId: number | string): Promise<FixedDepositAccount> {
  const { data } = await client.get<FixedDepositAccount>(`/fixeddepositaccounts/${accountId}`);
  return data;
}

// ─── Recurring Deposits ──────────────────────────────────────────

export async function fetchRecurringDepositAccounts(
  params: FixedDepositListParams = {},
): Promise<RecurringDepositAccount[]> {
  const { data } = await client.get("/recurringdepositaccounts", { params });
  return data;
}

export async function fetchRecurringDepositAccount(accountId: number | string): Promise<RecurringDepositAccount> {
  const { data } = await client.get<RecurringDepositAccount>(`/recurringdepositaccounts/${accountId}`, {
    params: { associations: "all" },
  });
  return data;
}

export async function fetchRecurringDepositAccountForEdit(
  accountId: number | string,
): Promise<RecurringDepositAccount> {
  const { data } = await client.get<RecurringDepositAccount>(`/recurringdepositaccounts/${accountId}`, {
    params: { associations: "charges", template: true },
  });
  return data;
}

export async function createRecurringDepositAccount(payload: Record<string, unknown>): Promise<SavingsCommandResponse> {
  const { data } = await client.post<SavingsCommandResponse>("/recurringdepositaccounts", {
    ...payload,
    locale: "en",
    dateFormat: "yyyy-MM-dd",
  });
  return data;
}

// ─── Recurring Deposit Accounts CRUD ─────────────────────────────

export async function updateRecurringDepositAccount(
  accountId: number,
  payload: Record<string, unknown>,
): Promise<SavingsCommandResponse> {
  const { data } = await client.put<SavingsCommandResponse>(`/recurringdepositaccounts/${accountId}`, {
    ...payload,
    locale: "en",
    dateFormat: "yyyy-MM-dd",
  });
  return data;
}

export async function deleteRecurringDepositAccount(accountId: number): Promise<SavingsCommandResponse> {
  const { data } = await client.delete<SavingsCommandResponse>(`/recurringdepositaccounts/${accountId}`);
  return data;
}

// ─── Recurring Deposit Account Template ──────────────────────────

export async function fetchRecurringDepositAccountTemplate(params: {
  clientId?: number;
  groupId?: number;
  productId?: number;
}): Promise<Record<string, unknown>> {
  const { data } = await client.get("/recurringdepositaccounts/template", { params });
  return data;
}

// ─── Recurring Deposit Lifecycle Commands ────────────────────────

export async function recurringDepositCommand(
  accountId: number,
  command: string,
  data: Record<string, unknown> = {},
): Promise<SavingsCommandResponse> {
  const dateFields = ["approvedOnDate", "activatedOnDate", "closedOnDate", "rejectedOnDate", "withdrawnOnDate"];
  const converted: Record<string, unknown> = { locale: "en", dateFormat: "yyyy-MM-dd" };
  for (const [k, v] of Object.entries(data)) {
    converted[k] = dateFields.includes(k) ? currentDate(v as string | undefined) : v;
  }
  const { data: result } = await client.post<SavingsCommandResponse>(
    `/recurringdepositaccounts/${accountId}`,
    converted,
    { params: { command } },
  );
  return result;
}

export async function approveRecurringDeposit(accountId: number, approvedOnDate?: string) {
  return recurringDepositCommand(
    accountId,
    "approve",
    approvedOnDate ? { approvedOnDate } : { approvedOnDate: new Date().toISOString().split("T")[0] },
  );
}

export async function activateRecurringDeposit(accountId: number, activatedOnDate?: string) {
  return recurringDepositCommand(
    accountId,
    "activate",
    activatedOnDate ? { activatedOnDate } : { activatedOnDate: new Date().toISOString().split("T")[0] },
  );
}

export async function closeRecurringDeposit(accountId: number, payload?: Record<string, unknown>) {
  return recurringDepositCommand(
    accountId,
    "close",
    payload ?? { closedOnDate: new Date().toISOString().split("T")[0] },
  );
}

export interface RecurringDepositClosureTemplate {
  savingsAccounts?: Array<{ id: number; accountNo: string; productName?: string }>;
  maturityAmount?: number;
  onAccountClosureOptions?: Array<{ id: number; value: string }>;
  paymentTypeOptions?: Array<{ id: number; name: string }>;
}

export async function fetchRecurringDepositClosureTemplate(
  accountId: number | string,
): Promise<RecurringDepositClosureTemplate> {
  const { data } = await client.get<RecurringDepositClosureTemplate>(
    `/recurringdepositaccounts/${accountId}/template`,
    { params: { command: "close" } },
  );
  return data;
}

export async function prematureCloseRecurringDeposit(accountId: number, closedOnDate?: string) {
  return recurringDepositCommand(
    accountId,
    "prematureClose",
    closedOnDate ? { closedOnDate } : { closedOnDate: new Date().toISOString().split("T")[0] },
  );
}

export async function rejectRecurringDeposit(accountId: number, rejectedOnDate?: string) {
  return recurringDepositCommand(
    accountId,
    "reject",
    rejectedOnDate ? { rejectedOnDate } : { rejectedOnDate: new Date().toISOString().split("T")[0] },
  );
}

export async function withdrawRecurringDeposit(accountId: number, withdrawnOnDate?: string) {
  return recurringDepositCommand(
    accountId,
    "withdrawnByApplicant",
    withdrawnOnDate ? { withdrawnOnDate } : { withdrawnOnDate: new Date().toISOString().split("T")[0] },
  );
}

export async function undoApprovalRecurringDeposit(accountId: number) {
  return recurringDepositCommand(accountId, "undoapproval");
}

export async function calculateInterestRecurringDeposit(accountId: number) {
  return recurringDepositCommand(accountId, "calculateInterest");
}

export async function postInterestRecurringDeposit(accountId: number) {
  return recurringDepositCommand(accountId, "postInterest");
}

export async function updateDepositAmountRecurringDeposit(
  accountId: number,
  payload: { mandatoryRecommendedDepositAmount: number; effectiveDate?: string; locale?: string; dateFormat?: string },
) {
  return recurringDepositCommand(accountId, "updateDepositAmount", payload);
}

export async function calculatePrematureAmountRecurringDeposit(accountId: number, closedOnDate?: string) {
  return recurringDepositCommand(accountId, "calculatePrematureAmount", closedOnDate ? { closedOnDate } : {});
}

// ─── Recurring Deposit Products ─────────────────────────────────

export async function fetchRecurringDepositProducts(): Promise<RecurringDepositProduct[]> {
  const { data } = await client.get<RecurringDepositProduct[]>("/recurringdepositproducts");
  return data;
}

export async function fetchRecurringDepositProduct(productId: number): Promise<RecurringDepositProduct> {
  const { data } = await client.get<RecurringDepositProduct>(`/recurringdepositproducts/${productId}`);
  return data;
}

export async function createRecurringDepositProduct(
  payload: RecurringDepositProductCreateRequest,
): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/recurringdepositproducts", {
    ...payload,
  });
  return data;
}

export async function updateRecurringDepositProduct(
  productId: number,
  payload: Partial<RecurringDepositProductCreateRequest>,
): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/recurringdepositproducts/${productId}`, payload);
  return data;
}

export async function deleteRecurringDepositProduct(productId: number): Promise<{ resourceId: number }> {
  const { data } = await client.delete<{ resourceId: number }>(`/recurringdepositproducts/${productId}`);
  return data;
}

export interface RecurringDepositProductTemplate {
  currencyOptions?: Array<{
    code: string;
    name: string;
    decimalPlaces: number;
    inMultiplesOf?: number;
    displaySymbol?: string;
  }>;
  interestCompoundingPeriodTypeOptions?: Array<{ id: number; code: string; value: string }>;
  interestPostingPeriodTypeOptions?: Array<{ id: number; code: string; value: string }>;
  interestCalculationTypeOptions?: Array<{ id: number; code: string; value: string }>;
  interestCalculationDaysInYearTypeOptions?: Array<{ id: number; code: string; value: string }>;
  lockinPeriodFrequencyTypeOptions?: Array<{ id: number; code: string; value: string }>;
  accountingRuleOptions?: Array<{ id: number; code: string; value: string }>;
  chargeOptions?: Array<{
    id: number;
    name: string;
    amount: number;
    chargeTimeType?: { id: number };
    chargeCalculationType?: { id: number };
  }>;
  penaltyOptions?: Array<{ id: number; name: string; amount: number }>;
  taxGroupOptions?: Array<{ id: number; name: string }>;
  periodFrequencyTypeOptions?: Array<{ id: number; code: string; value: string }>;
  preClosurePenalInterestOnTypeOptions?: Array<{ id: number; code: string; value: string }>;
  paymentTypeOptions?: Array<{ id: number; name: string }>;
  withdrawalFeeTypeOptions?: Array<{ id: number; code: string; value: string }>;
  accountingMappingOptions?: Record<string, Array<{ id: number; name: string; glCode: string }>>;
  chartTemplate?: {
    periodTypes?: Array<{ id: number; code: string; value: string }>;
    entityTypeOptions?: Array<{ id: number; code: string; value: string }>;
    attributeNameOptions?: Array<{ id: number; code: string; value: string }>;
    conditionTypeOptions?: Array<{ id: number; code: string; value: string }>;
    incentiveTypeOptions?: Array<{ id: number; code: string; value: string }>;
    genderOptions?: Array<{ id: number; name: string }>;
    clientTypeOptions?: Array<{ id: number; name: string }>;
    clientClassificationOptions?: Array<{ id: number; name: string }>;
  };
}

export async function fetchRecurringDepositProductTemplate(): Promise<RecurringDepositProductTemplate> {
  const { data } = await client.get<RecurringDepositProductTemplate>("/recurringdepositproducts/template");
  return data;
}

// ─── Recurring Deposit Transactions ──────────────────────────────

export interface RecurringDepositTransaction {
  id: number;
  accountId: number;
  officeId?: number;
  type?: { id: number; code: string; value: string };
  date?: string;
  transactionDate?: string;
  amount: number;
  currency?: { code: string; name: string; decimalPlaces: number; displaySymbol?: string };
  reversed?: boolean;
  runningBalance?: number;
  paymentTypeId?: number;
  paymentTypeName?: string;
}

/** GET /recurringdepositaccounts/{accountId}/transactions */
export async function fetchRecurringDepositTransactions(
  accountId: number | string,
): Promise<{ totalFilteredRecords?: number; pageItems?: RecurringDepositTransaction[] }> {
  const { data } = await client.get(`/recurringdepositaccounts/${accountId}/transactions`, {
    params: { offset: 0, limit: 100 },
  });
  return data;
}

/** POST /recurringdepositaccounts/{accountId}/transactions/{transactionId}?command=undo */
export async function undoRecurringDepositTransaction(
  accountId: number | string,
  transactionId: number | string,
): Promise<{ resourceId: number }> {
  const { data } = await client.post(
    `/recurringdepositaccounts/${accountId}/transactions/${transactionId}`,
    {},
    { params: { command: "undo" } },
  );
  return data;
}

/** POST /recurringdepositaccounts/{accountId}/transactions?command=deposit|withdrawal */
export async function makeRecurringDepositTransaction(
  accountId: number | string,
  command: "deposit" | "withdrawal",
  payload: SavingsTransactionRequest,
): Promise<SavingsCommandResponse> {
  const { data } = await client.post<SavingsCommandResponse>(
    `/recurringdepositaccounts/${accountId}/transactions`,
    { ...payload, locale: "en", dateFormat: "yyyy-MM-dd" },
    { params: { command } },
  );
  return data;
}

/** GET /recurringdepositaccounts/{accountId}/transactions/{transactionId} */
export async function fetchRecurringDepositTransaction(
  accountId: number | string,
  transactionId: number | string,
): Promise<RecurringDepositTransaction> {
  const { data } = await client.get<RecurringDepositTransaction>(
    `/recurringdepositaccounts/${accountId}/transactions/${transactionId}`,
  );
  return data;
}

/** GET /recurringdepositaccounts/{accountId}/transactions/{transactionId}?template=true */
export async function fetchRecurringDepositTransactionTemplate(
  accountId: number | string,
  transactionId: number | string,
): Promise<SavingsTransactionTemplate> {
  const { data } = await client.get<SavingsTransactionTemplate>(
    `/recurringdepositaccounts/${accountId}/transactions/${transactionId}`,
    { params: { template: true } },
  );
  return data;
}

/** POST /recurringdepositaccounts/{accountId}/transactions/{transactionId}?command=modify */
export async function modifyRecurringDepositTransaction(
  accountId: number | string,
  transactionId: number | string,
  payload: SavingsTransactionRequest,
): Promise<SavingsCommandResponse> {
  const { data } = await client.post<SavingsCommandResponse>(
    `/recurringdepositaccounts/${accountId}/transactions/${transactionId}`,
    { ...payload, locale: "en", dateFormat: "yyyy-MM-dd" },
    { params: { command: "modify" } },
  );
  return data;
}

/** GET /recurringdepositaccounts/{accountId}/transactions/template?command=deposit|withdrawal */
export async function fetchRecurringDepositTransactionTemplate2(
  accountId: number | string,
  command: "deposit" | "withdrawal",
): Promise<SavingsTransactionTemplate> {
  const { data } = await client.get<SavingsTransactionTemplate>(
    `/recurringdepositaccounts/${accountId}/transactions/template`,
    { params: { command } },
  );
  return data;
}

/** GET /savingsaccounts/{accountId}/charges/template (for RD charges) */
export async function fetchRecurringDepositChargesTemplate(
  accountId: number | string,
): Promise<SavingsChargesTemplate> {
  const { data } = await client.get<SavingsChargesTemplate>(`/savingsaccounts/${accountId}/charges/template`);
  return data;
}

/** POST /savingsaccounts/{accountId}/charges (for RD charges) */
export async function createRecurringDepositCharge(
  accountId: number | string,
  payload: PostSavingsChargeRequest,
): Promise<{ savingsAccountId: number; resourceId: number }> {
  const { data } = await client.post(`/savingsaccounts/${accountId}/charges`, payload);
  return data;
}

/** PUT /savingsaccounts/{accountId}/charges/{chargeId} (for RD charges) */
export async function updateRecurringDepositCharge(
  accountId: number | string,
  chargeId: number | string,
  payload: { amount: number },
): Promise<{ savingsAccountId: number; resourceId: number }> {
  const { data } = await client.put(`/savingsaccounts/${accountId}/charges/${chargeId}`, payload);
  return data;
}

/** POST /savingsaccounts/{accountId}/charges/{chargeId}?command=paycharge (for RD charges) */
export async function payRecurringDepositCharge(
  accountId: number | string,
  chargeId: number | string,
  payload: { amount?: number; dueDate?: string; dateFormat?: string; locale?: string } = {},
): Promise<{ savingsAccountId: number; resourceId: number }> {
  const { data } = await client.post(`/savingsaccounts/${accountId}/charges/${chargeId}`, payload, {
    params: { command: "paycharge" },
  });
  return data;
}

/** POST /savingsaccounts/{accountId}/charges/{chargeId}?command=waive (for RD charges) */
export async function waiveRecurringDepositCharge(
  accountId: number | string,
  chargeId: number | string,
): Promise<{ savingsAccountId: number; resourceId: number }> {
  const { data } = await client.post(
    `/savingsaccounts/${accountId}/charges/${chargeId}`,
    {},
    { params: { command: "waive" } },
  );
  return data;
}

/** DELETE /savingsaccounts/{accountId}/charges/{chargeId} (for RD charges) */
export async function deleteRecurringDepositCharge(
  accountId: number | string,
  chargeId: number | string,
): Promise<{ savingsAccountId: number; resourceId: number }> {
  const { data } = await client.delete(`/savingsaccounts/${accountId}/charges/${chargeId}`);
  return data;
}

/** GET /charges/{chargeId}?template=true */
export async function fetchChargeDefinition(chargeId: number | string): Promise<Record<string, unknown>> {
  const { data } = await client.get(`/charges/${chargeId}`, { params: { template: true } });
  return data;
}

/** POST /savingsaccounts/{accountId}?command=updateWithHoldTax (for RD accounts) */
export async function updateRecurringDepositWithHoldTax(
  accountId: number | string,
  withHoldTax: boolean,
): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(
    `/savingsaccounts/${accountId}`,
    { withHoldTax },
    { params: { command: "updateWithHoldTax" } },
  );
  return data;
}

// ─── Standing Instructions (for Recurring Deposits) ──────────────

export interface StandingInstruction {
  id: number;
  name: string;
  transferType?: { id: number; value: string };
  priority?: { id: number; value: string };
  status?: { id: number; value: string };
  fromAccountType?: { id: number; value: string };
  fromAccountId?: number;
  fromClient?: { id: number; displayName: string };
  fromOffice?: { id: number; name: string };
  toAccountType?: { id: number; value: string };
  toAccountId?: number;
  toClient?: { id: number; displayName: string };
  toOffice?: { id: number; name: string };
  instructionType?: { id: number; value: string };
  amount?: number;
  validFrom?: string;
  validTill?: string;
  recurrenceType?: { id: number; value: string };
  recurrenceInterval?: number;
  recurrenceFrequency?: { id: number; value: string };
  recurrenceOnMonthDay?: string;
}

export interface StandingInstructionListResponse {
  totalFilteredRecords?: number;
  pageItems?: StandingInstruction[];
}

export interface StandingInstructionTemplate {
  fromAccountTypeOptions?: Array<{ id: number; value: string }>;
  toAccountTypeOptions?: Array<{ id: number; value: string }>;
  transferTypeOptions?: Array<{ id: number; value: string }>;
  priorityOptions?: Array<{ id: number; value: string }>;
  statusOptions?: Array<{ id: number; value: string }>;
  instructionTypeOptions?: Array<{ id: number; value: string }>;
  recurrenceTypeOptions?: Array<{ id: number; value: string }>;
  recurrenceFrequencyOptions?: Array<{ id: number; value: string }>;
}

/** GET /standinginstructions?clientId=X&fromAccountId=Y&fromAccountType=2 */
export async function fetchStandingInstructions(params: {
  clientId?: number;
  fromAccountId?: number;
  fromAccountType?: number;
  offset?: number;
  limit?: number;
}): Promise<StandingInstructionListResponse> {
  const { data } = await client.get<StandingInstructionListResponse>("/standinginstructions", { params });
  return data;
}

/** GET /standinginstructions/template */
export async function fetchStandingInstructionTemplate(): Promise<StandingInstructionTemplate> {
  const { data } = await client.get<StandingInstructionTemplate>("/standinginstructions/template");
  return data;
}

/** POST /standinginstructions */
export async function createStandingInstruction(payload: Record<string, unknown>): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/standinginstructions", payload);
  return data;
}

/** GET /standinginstructions/{id} */
export async function fetchStandingInstruction(id: number | string): Promise<StandingInstruction> {
  const { data } = await client.get<StandingInstruction>(`/standinginstructions/${id}`);
  return data;
}

/** GET /standinginstructions/{id}?associations=template */
export async function fetchStandingInstructionForEdit(
  id: number | string,
): Promise<StandingInstruction & StandingInstructionTemplate> {
  const { data } = await client.get<StandingInstruction & StandingInstructionTemplate>(`/standinginstructions/${id}`, {
    params: { associations: "template" },
  });
  return data;
}

/** PUT /standinginstructions/{id}?command=update */
export async function updateStandingInstruction(
  id: number | string,
  payload: Record<string, unknown>,
): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/standinginstructions/${id}`, payload, {
    params: { command: "update" },
  });
  return data;
}

/** DELETE /standinginstructions/{id}?command=delete */
export async function deleteStandingInstruction(id: number | string): Promise<{ resourceId: number }> {
  const { data } = await client.delete<{ resourceId: number }>(`/standinginstructions/${id}`, {
    params: { command: "delete" },
  });
  return data;
}

/** GET /standinginstructions/{id}?associations=transactions */
export async function fetchStandingInstructionTransactions(
  id: number | string,
  params?: { limit?: number; offset?: number },
): Promise<{ totalFilteredRecords?: number; pageItems?: unknown[] }> {
  const { data } = await client.get(`/standinginstructions/${id}`, {
    params: { associations: "transactions", ...params },
  });
  return data;
}

// ─── Account Transfers (for Recurring Deposits) ──────────────────

export interface AccountTransferTemplate {
  fromAccountId?: number;
  fromAccountType?: number;
  fromAccountOptions?: Array<{ id: number; accountNo: string }>;
  toAccountOptions?: Array<{ id: number; accountNo: string; productName?: string }>;
  paymentTypeOptions?: Array<{ id: number; name: string }>;
}

/** GET /accounttransfers/template?fromAccountId=X&fromAccountType=2 */
export async function fetchAccountTransferTemplate(params: {
  fromAccountId?: number;
  fromAccountType?: number;
}): Promise<AccountTransferTemplate> {
  const { data } = await client.get<AccountTransferTemplate>("/accounttransfers/template", { params });
  return data;
}

/** POST /accounttransfers */
export async function createAccountTransfer(payload: Record<string, unknown>): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/accounttransfers", payload);
  return data;
}

/** GET /accounttransfers/{id} */
export async function fetchAccountTransfer(id: number | string): Promise<Record<string, unknown>> {
  const { data } = await client.get(`/accounttransfers/${id}`);
  return data;
}

/** POST /accounttransfers/{id}?command=undo */
export async function undoAccountTransfer(id: number | string): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>(
    `/accounttransfers/${id}`,
    {},
    {
      params: { command: "undo" },
    },
  );
  return data;
}

// ─── Fixed Deposit Transactions (Section 4 & 5 of fixed.md) ────

export interface FixedDepositTransaction {
  id: number;
  accountId: number;
  officeId?: number;
  type?: { id: number; code: string; value: string };
  date?: string;
  transactionDate?: string;
  amount: number;
  currency?: { code: string; name: string; decimalPlaces: number; displaySymbol?: string };
  reversed?: boolean;
  runningBalance?: number;
  paymentTypeId?: number;
  paymentTypeName?: string;
}

/** GET /fixeddepositaccounts/{accountId}/transactions */
export async function fetchFixedDepositTransactions(
  accountId: number | string,
): Promise<{ totalFilteredRecords?: number; pageItems?: FixedDepositTransaction[] }> {
  const { data } = await client.get(`/fixeddepositaccounts/${accountId}/transactions`, {
    params: { offset: 0, limit: 100 },
  });
  return data;
}

/** POST /fixeddepositaccounts/{accountId}/transactions/{transactionId}?command=undo */
export async function undoFixedDepositTransaction(
  accountId: number | string,
  transactionId: number | string,
): Promise<{ resourceId: number }> {
  const { data } = await client.post(
    `/fixeddepositaccounts/${accountId}/transactions/${transactionId}`,
    {},
    { params: { command: "undo" } },
  );
  return data;
}

// ─── Fixed Deposit Template ─────────────────────────────────
// Section 4 — GET /fixeddepositaccounts/template?clientId={id}&productId={id}

export interface FixedDepositAccountTemplate {
  clientId?: number;
  clientName?: string;
  productId?: number;
  productName?: string;
  currency?: { code: string; name: string; decimalPlaces: number; displaySymbol: string };
  nominalAnnualInterestRate?: number;
  interestCompoundingPeriodType?: { id: number; code: string; value: string };
  interestPostingPeriodType?: { id: number; code: string; value: string };
  interestCalculationType?: { id: number; code: string; value: string };
  interestCalculationDaysInYearType?: { id: number; code: string; value: string };
  minDepositTerm?: number;
  maxDepositTerm?: number;
  minDepositTermType?: { id: number; code: string; value: string };
  maxDepositTermType?: { id: number; code: string; value: string };
  inMultiplesOfDepositTerm?: number;
  inMultiplesOfDepositTermType?: { id: number; code: string; value: string };
  depositAmount?: number;
  preClosurePenalApplicable?: boolean;
  preClosurePenalInterest?: number;
  preClosurePenalInterestOnType?: { id: number; code: string; value: string };
  lockinPeriodFrequency?: number;
  lockinPeriodFrequencyType?: { id: number; code: string; value: string };
  withHoldTax?: boolean;
  transferInterestToSavings?: boolean;
  savingsAccountId?: number;
  charges?: Array<{
    chargeId: number;
    name: string;
    amount: number;
    chargeTimeType?: { id: number; code: string; value: string };
    chargeCalculationType?: { id: number; code: string; value: string };
  }>;
  productOptions?: Array<{ id: number; name: string }>;
  chargeOptions?: Array<{
    id: number;
    name: string;
    amount: number;
    chargeTimeType?: { id: number; code: string; value: string };
  }>;
  fieldOfficerOptions?: Array<{ id: number; displayName: string }>;
}

export async function fetchFixedDepositAccountTemplate(
  clientId?: number,
  productId?: number,
): Promise<FixedDepositAccountTemplate> {
  const params: Record<string, string> = {};
  if (clientId) params.clientId = String(clientId);
  if (productId) params.productId = String(productId);
  const { data } = await client.get<FixedDepositAccountTemplate>("/fixeddepositaccounts/template", { params });
  return data;
}

// ─── Fixed Deposit Transaction Deposit/Withdrawal ────────────

export async function makeFixedDepositTransaction(
  accountId: number | string,
  command: "deposit" | "withdrawal",
  payload: SavingsTransactionRequest,
): Promise<SavingsCommandResponse> {
  const { data } = await client.post<SavingsCommandResponse>(
    `/fixeddepositaccounts/${accountId}/transactions`,
    { ...payload, locale: "en", dateFormat: "yyyy-MM-dd" },
    { params: { command } },
  );
  return data;
}

// ─── Fixed Deposit Charges ──────────────────────────────────

export interface FixedDepositCharge {
  id: number;
  chargeId: number;
  name?: string;
  amount: number;
  amountPaid?: number;
  amountOutstanding?: number;
  amountWaived?: number;
  dueDate?: string;
  isActive?: boolean;
  isPaid?: boolean;
  isWaived?: boolean;
  waiverable?: boolean;
  penalty?: boolean;
  chargeTimeType?: { id: number; code: string; value: string };
  chargeCalculationType?: { id: number; code: string; value: string };
  currency?: { code: string; name: string; decimalPlaces: number; displaySymbol?: string };
}

export async function fetchFixedDepositCharges(
  accountId: number | string,
): Promise<{ totalFilteredRecords?: number; pageItems?: FixedDepositCharge[] }> {
  const { data } = await client.get(`/fixeddepositaccounts/${accountId}/charges`);
  return data;
}

export async function createFixedDepositCharge(
  accountId: number | string,
  payload: PostSavingsChargeRequest,
): Promise<{ savingsAccountId: number; resourceId: number }> {
  const { data } = await client.post(`/fixeddepositaccounts/${accountId}/charges`, payload);
  return data;
}

export async function waiveFixedDepositCharge(
  accountId: number | string,
  chargeId: number | string,
): Promise<{ resourceId: number }> {
  const { data } = await client.post(
    `/fixeddepositaccounts/${accountId}/charges/${chargeId}`,
    {},
    { params: { command: "waive" } },
  );
  return data;
}

export async function deleteFixedDepositCharge(
  accountId: number | string,
  chargeId: number | string,
): Promise<{ resourceId: number }> {
  const { data } = await client.delete(`/fixeddepositaccounts/${accountId}/charges/${chargeId}`);
  return data;
}

// ─── FD Interest Calculator ─────────────────────────────────
// GET /fixeddepositaccounts/calculate-fd-interest

export interface CalculateFDInterestQuery {
  principalAmount: number;
  annualInterestRate: number;
  tenureInMonths: number;
  interestCompoundingPeriodInMonths: number;
  interestPostingPeriodInMonths: number;
}

export interface CalculateFDInterestResponse {
  totalInterest: number;
  maturityAmount: number;
}

export async function calculateFixedDepositInterest(
  params: CalculateFDInterestQuery,
): Promise<CalculateFDInterestResponse> {
  const { data } = await client.get<CalculateFDInterestResponse>("/fixeddepositaccounts/calculate-fd-interest", {
    params,
  });
  return data;
}

// ─── FD Closure Template ───────────────────────────────────

export interface FixedDepositClosureTemplate {
  onAccountClosureOptions?: Array<{ id: number; value: string }>;
  savingsAccounts?: Array<{ id: number; accountNo: string }>;
}

export async function fetchFixedDepositClosureTemplate(
  accountId: number | string,
): Promise<FixedDepositClosureTemplate> {
  const { data } = await client.get<FixedDepositClosureTemplate>(`/fixeddepositaccounts/${accountId}/template`, {
    params: { command: "close" },
  });
  return data;
}

// ─── Fixed Deposit Products (Section 11) ──────────────────────

export async function fetchFixedDepositProducts(): Promise<FixedDepositProduct[]> {
  const { data } = await client.get<FixedDepositProduct[]>("/fixeddepositproducts");
  return data;
}

export async function fetchFixedDepositProduct(productId: number): Promise<FixedDepositProduct> {
  const { data } = await client.get<FixedDepositProduct>(`/fixeddepositproducts/${productId}`);
  return data;
}

export async function createFixedDepositProduct(
  payload: FixedDepositProductCreateRequest,
): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/fixeddepositproducts", {
    ...payload,
  });
  return data;
}

export async function updateFixedDepositProduct(
  productId: number,
  payload: Partial<FixedDepositProductCreateRequest>,
): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/fixeddepositproducts/${productId}`, payload);
  return data;
}

export async function deleteFixedDepositAccount(accountId: number): Promise<void> {
  await client.delete(`/fixeddepositaccounts/${accountId}`);
}

export async function deleteFixedDepositProduct(productId: number): Promise<{ resourceId: number }> {
  const { data } = await client.delete<{ resourceId: number }>(`/fixeddepositproducts/${productId}`);
  return data;
}

export interface FixedDepositProductTemplate {
  currencyOptions?: Array<{
    code: string;
    name: string;
    decimalPlaces: number;
    inMultiplesOf?: number;
    displaySymbol?: string;
  }>;
  interestCompoundingPeriodTypeOptions?: Array<{ id: number; code: string; value: string }>;
  interestPostingPeriodTypeOptions?: Array<{ id: number; code: string; value: string }>;
  interestCalculationTypeOptions?: Array<{ id: number; code: string; value: string }>;
  interestCalculationDaysInYearTypeOptions?: Array<{ id: number; code: string; value: string }>;
  lockinPeriodFrequencyTypeOptions?: Array<{ id: number; code: string; value: string }>;
  accountingRuleOptions?: Array<{ id: number; code: string; value: string }>;
  chargeOptions?: Array<{ id: number; name: string; amount: number }>;
  taxGroupOptions?: Array<{ id: number; name: string }>;
}

export async function fetchFixedDepositProductTemplate(): Promise<FixedDepositProductTemplate> {
  const { data } = await client.get<FixedDepositProductTemplate>("/fixeddepositproducts/template");
  return data;
}

// ─── Savings Charges (Section 5) ──────────────────────────────────

export interface SavingsCharge {
  id: number;
  chargeId: number;
  savingsAccountId: number;
  name?: string;
  chargeTimeType?: { id: number; code: string; value: string };
  chargeCalculationType?: { id: number; code: string; value: string };
  currency?: { code: string; name: string; decimalPlaces: number; displaySymbol?: string };
  amount: number;
  amountPaid?: number;
  amountOutstanding?: number;
  amountWaived?: number;
  amountWrittenOff?: number;
  dueDate?: string;
  isActive?: boolean;
  isPaid?: boolean;
  isWaived?: boolean;
  waiverable?: boolean;
  penalty?: boolean;
}

export interface SavingsChargeListResponse {
  totalFilteredRecords?: number;
  pageItems?: SavingsCharge[];
}

export interface PostSavingsChargeRequest {
  chargeId: number;
  amount: number;
  dueDate?: string;
  dateFormat?: string;
  locale?: string;
}

export interface SavingsChargesTemplate {
  chargeOptions?: Array<{
    id: number;
    name: string;
    amount?: number;
    chargeTimeType?: { id: number; code: string; value: string };
    chargeCalculationType?: { id: number; code: string; value: string };
    currency?: { code: string; name: string; decimalPlaces: number };
  }>;
}

/** GET /savingsaccounts/{savingsAccountId}/charges */
export async function fetchSavingsCharges(savingsAccountId: number | string): Promise<SavingsChargeListResponse> {
  const { data } = await client.get<SavingsChargeListResponse>(`/savingsaccounts/${savingsAccountId}/charges`);
  return data;
}

/** GET /savingsaccounts/{savingsAccountId}/charges/template */
export async function fetchSavingsChargesTemplate(savingsAccountId: number | string): Promise<SavingsChargesTemplate> {
  const { data } = await client.get<SavingsChargesTemplate>(`/savingsaccounts/${savingsAccountId}/charges/template`);
  return data;
}

/** POST /savingsaccounts/{savingsAccountId}/charges */
export async function createSavingsCharge(
  savingsAccountId: number | string,
  payload: PostSavingsChargeRequest,
): Promise<{ savingsAccountId: number; resourceId: number; officeId?: number }> {
  const { data } = await client.post(`/savingsaccounts/${savingsAccountId}/charges`, payload);
  return data;
}

/** POST /savingsaccounts/{savingsAccountId}/charges/{chargeId}?command=waive */
export async function waiveSavingsCharge(
  savingsAccountId: number | string,
  chargeId: number | string,
): Promise<{ savingsAccountId: number; resourceId: number }> {
  const { data } = await client.post(
    `/savingsaccounts/${savingsAccountId}/charges/${chargeId}`,
    {},
    { params: { command: "waive" } },
  );
  return data;
}

/** DELETE /savingsaccounts/{savingsAccountId}/charges/{chargeId} */
export async function deleteSavingsCharge(
  savingsAccountId: number | string,
  chargeId: number | string,
): Promise<{ savingsAccountId: number; resourceId: number }> {
  const { data } = await client.delete(`/savingsaccounts/${savingsAccountId}/charges/${chargeId}`);
  return data;
}

// ─── Savings Commands (Section 4) ────────────────────────────────

/** POST /savingsaccounts/{savingsAccountId}/charges/{chargeId}?command=paycharge */
export async function paySavingsCharge(
  savingsAccountId: number | string,
  chargeId: number | string,
  payload: { amount?: number; dueDate?: string; dateFormat?: string; locale?: string } = {},
): Promise<{ savingsAccountId: number; resourceId: number }> {
  const { data } = await client.post(`/savingsaccounts/${savingsAccountId}/charges/${chargeId}`, payload, {
    params: { command: "paycharge" },
  });
  return data;
}

/** POST /savingsaccounts/{savingsAccountId}?command=calculateInterest */
export async function calculateInterestSavings(savingsAccountId: number | string): Promise<{ resourceId: number }> {
  const { data } = await client.post(
    `/savingsaccounts/${savingsAccountId}`,
    {},
    { params: { command: "calculateInterest" } },
  );
  return data;
}

/** POST /savingsaccounts/{savingsAccountId}?command=postInterest */
export async function postInterestSavings(savingsAccountId: number | string): Promise<{ resourceId: number }> {
  const { data } = await client.post(
    `/savingsaccounts/${savingsAccountId}`,
    {},
    { params: { command: "postInterest" } },
  );
  return data;
}

/** POST /savingsaccounts/{savingsAccountId}?command=block */
export async function blockSavingsAccount(
  savingsAccountId: number | string,
  reasonForBlock?: string,
): Promise<{ resourceId: number }> {
  const { data } = await client.post(
    `/savingsaccounts/${savingsAccountId}`,
    { reasonForBlock: reasonForBlock || undefined, dateFormat: "yyyy-MM-dd", locale: "en" },
    { params: { command: "block" } },
  );
  return data;
}

/** POST /savingsaccounts/{savingsAccountId}?command=unblock */
export async function unblockSavingsAccount(savingsAccountId: number | string): Promise<{ resourceId: number }> {
  const { data } = await client.post(`/savingsaccounts/${savingsAccountId}`, {}, { params: { command: "unblock" } });
  return data;
}

/** POST /savingsaccounts/{savingsAccountId}?command=blockCredit */
export async function blockCreditSavingsAccount(
  savingsAccountId: number | string,
  reasonForBlock?: string,
): Promise<{ resourceId: number }> {
  const { data } = await client.post(
    `/savingsaccounts/${savingsAccountId}`,
    { reasonForBlock: reasonForBlock || undefined, dateFormat: "yyyy-MM-dd", locale: "en" },
    { params: { command: "blockCredit" } },
  );
  return data;
}

/** POST /savingsaccounts/{savingsAccountId}?command=unblockCredit */
export async function unblockCreditSavingsAccount(savingsAccountId: number | string): Promise<{ resourceId: number }> {
  const { data } = await client.post(
    `/savingsaccounts/${savingsAccountId}`,
    {},
    { params: { command: "unblockCredit" } },
  );
  return data;
}

/** POST /savingsaccounts/{savingsAccountId}?command=blockDebit */
export async function blockDebitSavingsAccount(
  savingsAccountId: number | string,
  reasonForBlock?: string,
): Promise<{ resourceId: number }> {
  const { data } = await client.post(
    `/savingsaccounts/${savingsAccountId}`,
    { reasonForBlock: reasonForBlock || undefined, dateFormat: "yyyy-MM-dd", locale: "en" },
    { params: { command: "blockDebit" } },
  );
  return data;
}

/** POST /savingsaccounts/{savingsAccountId}?command=unblockDebit */
export async function unblockDebitSavingsAccount(savingsAccountId: number | string): Promise<{ resourceId: number }> {
  const { data } = await client.post(
    `/savingsaccounts/${savingsAccountId}`,
    {},
    { params: { command: "unblockDebit" } },
  );
  return data;
}

// ─── Savings On-Hold Transactions ─────────────────────────────

export interface OnHoldTransaction {
  id: number;
  accountId: number;
  amount: number;
  transactionDate?: string;
  transactionType?: { id: number; code: string; value: string };
  reversed?: boolean;
  savingsId?: number;
  savingsAccountNo?: string;
  savingsClientName?: string;
  createdDate?: string;
}

export interface OnHoldTransactionResponse {
  totalFilteredRecords: number;
  pageItems: OnHoldTransaction[];
}

/** POST /savingsaccounts/{savingsId}/transactions?command=holdAmount */
export async function holdAmountSavings(
  savingsAccountId: number | string,
  payload: {
    transactionDate: string;
    transactionAmount: number;
    reasonForBlock: string;
    lienAllowed?: boolean;
    externalId?: string;
    locale?: string;
    dateFormat?: string;
  },
): Promise<{ officeId: number; clientId: number; savingsId: number; resourceId: number }> {
  const { data } = await client.post<{ officeId: number; clientId: number; savingsId: number; resourceId: number }>(
    `/savingsaccounts/${savingsAccountId}/transactions`,
    { ...payload, locale: payload.locale ?? "en", dateFormat: payload.dateFormat ?? "yyyy-MM-dd" },
    { params: { command: "holdAmount" } },
  );
  return data;
}

/** POST /savingsaccounts/{savingsId}/transactions/{transactionId}?command=releaseAmount */
export async function releaseAmountSavings(
  savingsAccountId: number | string,
  transactionId: number | string,
  payload?: { externalId?: string },
): Promise<{ officeId: number; clientId: number; savingsId: number; resourceId: number }> {
  const { data } = await client.post<{ officeId: number; clientId: number; savingsId: number; resourceId: number }>(
    `/savingsaccounts/${savingsAccountId}/transactions/${transactionId}`,
    payload ?? {},
    { params: { command: "releaseAmount" } },
  );
  return data;
}

/** GET /savingsaccounts/{savingsId}/onholdtransactions */
export async function fetchOnHoldTransactions(savingsAccountId: number | string): Promise<OnHoldTransactionResponse> {
  const { data } = await client.get<OnHoldTransactionResponse>(
    `/savingsaccounts/${savingsAccountId}/onholdtransactions`,
  );
  return data;
}

/** POST /savingsaccounts/{savingsAccountId}?command=reject */
export async function rejectSavingsAccount(savingsAccountId: number | string): Promise<{ resourceId: number }> {
  const { data } = await client.post(`/savingsaccounts/${savingsAccountId}`, {}, { params: { command: "reject" } });
  return data;
}

/** POST /savingsaccounts/{savingsAccountId}?command=withdrawnByApplicant */
export async function withdrawSavingsAccount(savingsAccountId: number | string): Promise<{ resourceId: number }> {
  const { data } = await client.post(
    `/savingsaccounts/${savingsAccountId}`,
    {},
    { params: { command: "withdrawnByApplicant" } },
  );
  return data;
}

// ─── Savings Transactions (Section 4) ────────────────────────────

export interface SavingsTransaction {
  id: number;
  accountId: number;
  accountNo?: string;
  officeId?: number;
  externalId?: string;
  type?: { id: number; code: string; value: string };
  transactionType: {
    id: number;
    code: string;
    value: string;
    deposit?: boolean;
    dividendPayout?: boolean;
    withdrawal?: boolean;
    interestPosting?: boolean;
    feeDeduction?: boolean;
    initiateTransfer?: boolean;
    approveTransfer?: boolean;
    withdrawTransfer?: boolean;
    rejectTransfer?: boolean;
    overdraftInterest?: boolean;
    writtenoff?: boolean;
    overdraftFee?: boolean;
    withholdTax?: boolean;
    escheat?: boolean;
    amountHold?: boolean;
    amountRelease?: boolean;
    accrual?: boolean;
    depositOrWithdrawal?: boolean;
    transactionTypeEnum: string;
    entryType?: "DEBIT" | "CREDIT";
    withdrawalFee?: boolean;
    chargeTransaction?: boolean;
    annualFee?: boolean;
    credit?: boolean;
    debit?: boolean;
    overDraftInterestPosting?: boolean;
    incomeFromInterest?: boolean;
    payCharge?: boolean;
  };
  entryType?: "DEBIT" | "CREDIT";
  date?: string;
  transactionDate?: string;
  amount: number;
  currency?: { code: string; name: string; decimalPlaces: number; displaySymbol?: string };
  reversed?: boolean;
  runningBalance?: number;
  submittedOnDate?: string;
  submittedByUsername?: string;
  note?: string;
  isManualTransaction?: boolean;
  isReversal?: boolean;
  originalTransactionId?: number;
  lienTransaction?: boolean;
  releaseTransactionId?: number;
  reasonForBlock?: string;
  paymentDetailData?: unknown;
  paymentTypeId?: number;
  paymentTypeName?: string;
}

// ─── Additional Savings Operations ────────────────────────────────

/** DELETE /savingsproducts/{productId} */
export async function deleteSavingsProduct(productId: number): Promise<void> {
  await client.delete(`/savingsproducts/${productId}`);
}

/** POST /savingsaccounts/{accountId}?command=undoapproval */
export async function undoApproveSavingsAccount(accountId: number): Promise<void> {
  await client.post(`/savingsaccounts/${accountId}`, null, { params: { command: "undoapproval" } });
}

/** POST /savingsaccounts/{accountId}/transactions?command=force-withdrawal */
export async function forceWithdrawalSavings(accountId: number, payload: Record<string, unknown>): Promise<void> {
  await client.post(
    `/savingsaccounts/${accountId}/transactions`,
    {
      ...payload,
      dateFormat: "yyyy-MM-dd",
      locale: "en",
    },
    { params: { command: "force-withdrawal" } },
  );
}

/** POST /savingsaccounts/{accountId}?command=applyAnnualFees */
export async function applyAnnualFeesSavings(accountId: number): Promise<void> {
  await client.post(`/savingsaccounts/${accountId}`, null, { params: { command: "applyAnnualFees" } });
}

/** PUT /savingsaccounts/{accountId}?command=updateWithHoldTax */
export async function updateWithHoldTax(accountId: number, withHoldTax: boolean): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(
    `/savingsaccounts/${accountId}`,
    { withHoldTax },
    { params: { command: "updateWithHoldTax" } },
  );
  return data;
}

/** POST /savingsaccounts/{accountId}/transactions?command=postInterestAsOn */
export async function postInterestAsOn(
  accountId: number,
  payload: { transactionDate: string; IsPostInterestAsOn: boolean; dateFormat?: string; locale?: string },
): Promise<SavingsCommandResponse> {
  const { data } = await client.post<SavingsCommandResponse>(
    `/savingsaccounts/${accountId}/transactions`,
    { ...payload, locale: payload.locale ?? "en", dateFormat: payload.dateFormat ?? "yyyy-MM-dd" },
    { params: { command: "postInterestAsOn" } },
  );
  return data;
}

/** POST /savingsaccounts/{accountId}?command=assignSavingsOfficer */
export async function assignSavingsOfficer(
  accountId: number,
  officerId: number,
  assignmentDate?: string,
): Promise<void> {
  await client.post(
    `/savingsaccounts/${accountId}`,
    {
      toSavingsOfficerId: officerId,
      assignmentDate: assignmentDate ?? new Date().toISOString().split("T")[0],
      dateFormat: "yyyy-MM-dd",
      locale: "en",
    },
    { params: { command: "assignSavingsOfficer" } },
  );
}

/** POST /savingsaccounts/{accountId}?command=unassignSavingsOfficer */
export async function unassignSavingsOfficer(accountId: number, unassignedDate?: string): Promise<void> {
  await client.post(
    `/savingsaccounts/${accountId}`,
    {
      unassignedDate: unassignedDate ?? new Date().toISOString().split("T")[0],
      dateFormat: "yyyy-MM-dd",
      locale: "en",
    },
    { params: { command: "unassignSavingsOfficer" } },
  );
}

/** POST /savingsaccounts/{accountId}/transactions/{transactionId}?command=undo|reverse|modify */
export async function adjustSavingsTransaction(
  accountId: number,
  transactionId: number,
  command: "undo" | "reverse" | "modify",
  payload?: Record<string, unknown>,
): Promise<void> {
  await client.post(
    `/savingsaccounts/${accountId}/transactions/${transactionId}`,
    {
      ...payload,
      dateFormat: "yyyy-MM-dd",
      locale: "en",
    },
    { params: { command } },
  );
}

export interface TransactionSearchParams {
  fromDate?: string;
  toDate?: string;
  fromSubmittedDate?: string;
  toSubmittedDate?: string;
  fromAmount?: number;
  toAmount?: number;
  types?: string;
  credit?: boolean;
  debit?: boolean;
  transactionType?: string;
  offset?: number;
  limit?: number;
  orderBy?: string;
  sortOrder?: "ASC" | "DESC";
  locale?: string;
  dateFormat?: string;
}

/** GET /savingsaccounts/{accountId}/transactions/search */
export async function searchTransactions(
  accountId: number,
  params?: TransactionSearchParams,
): Promise<{ total?: number; pageItems?: SavingsTransaction[]; content?: SavingsTransaction[] }> {
  const { data } = await client.get(`/savingsaccounts/${accountId}/transactions/search`, { params });
  return data;
}

// ─── Interest Rate Charts ────────────────────────────────────────

export interface InterestRateChart {
  id: number;
  name: string;
  description: string;
  fromDate: string;
  endDate: string | null;
  chartSlabs: InterestRateChartSlab[];
}

export interface InterestRateChartSlab {
  id: number;
  description: string;
  periodType: { id: number; code: string; value: string };
  fromPeriod: number;
  toPeriod: number;
  annualInterestRate: number;
}

export interface InterestRateChartTemplate {
  periodTypes: Array<{ id: number; code: string; value: string }>;
}

export async function fetchInterestRateCharts(productId?: number): Promise<InterestRateChart[]> {
  const params = productId != null ? { productId } : undefined;
  const { data } = await client.get<InterestRateChart[]>("/interestratecharts", { params });
  return data;
}

export async function fetchInterestRateChart(chartId: number): Promise<InterestRateChart> {
  const { data } = await client.get<InterestRateChart>(`/interestratecharts/${chartId}`);
  return data;
}

export async function fetchInterestRateChartTemplate(): Promise<InterestRateChartTemplate> {
  const { data } = await client.get<InterestRateChartTemplate>("/interestratecharts/template");
  return data;
}

export async function createInterestRateChart(payload: Record<string, unknown>): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/interestratecharts", payload);
  return data;
}

export async function updateInterestRateChart(
  chartId: number,
  payload: Record<string, unknown>,
): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/interestratecharts/${chartId}`, payload);
  return data;
}

export async function deleteInterestRateChart(chartId: number): Promise<void> {
  await client.delete(`/interestratecharts/${chartId}`);
}

export async function fetchChartSlabs(chartId: number): Promise<InterestRateChartSlab[]> {
  const { data } = await client.get<InterestRateChartSlab[]>(`/interestratecharts/${chartId}/chartslabs`);
  return data;
}

export async function fetchChartSlabTemplate(chartId: number): Promise<InterestRateChartTemplate> {
  const { data } = await client.get<InterestRateChartTemplate>(`/interestratecharts/${chartId}/chartslabs/template`);
  return data;
}

export async function createChartSlab(
  chartId: number,
  payload: Record<string, unknown>,
): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>(`/interestratecharts/${chartId}/chartslabs`, payload);
  return data;
}

export async function updateChartSlab(
  chartId: number,
  slabId: number,
  payload: Record<string, unknown>,
): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(
    `/interestratecharts/${chartId}/chartslabs/${slabId}`,
    payload,
  );
  return data;
}

export async function deleteChartSlab(chartId: number, slabId: number): Promise<void> {
  await client.delete(`/interestratecharts/${chartId}/chartslabs/${slabId}`);
}
