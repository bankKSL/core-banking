import client from "@/api/client";

/**
 * Convert yyyy-MM-dd (HTML date input) → yyyy-MM-dd (Fineract format).
 * Returns undefined if empty or already in Fineract format.
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
    FixedDepositProduct,
    FixedDepositProductCreateRequest,
} from "../types/deposit";
import { currentDate } from "@/lib/utils";

// ─── Savings Products ────────────────────────────────────────────

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

export async function updateSavingsProduct(productId: number, payload: Partial<SavingsProductCreateRequest>): Promise<SavingsCommandResponse> {
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

export async function fetchSavingsAccountTemplate(clientId?: number, productId?: number): Promise<SavingsAccountTemplate> {
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

export async function updateSavingsAccount(accountId: number, payload: Partial<SavingsAccountCreateRequest>): Promise<SavingsCommandResponse> {
    const { data } = await client.put<SavingsCommandResponse>(`/savingsaccounts/${accountId}`, payload);
    return data;
}

export async function deleteSavingsAccount(accountId: number): Promise<SavingsCommandResponse> {
    const { data } = await client.delete<SavingsCommandResponse>(`/savingsaccounts/${accountId}`);
    return data;
}

// ─── Savings Account Lifecycle Commands ───────────────────────────

export async function approveSavingsAccount(accountId: number, payload: { approvedOnDate?: string; locale?: string; dateFormat?: string } = {}): Promise<SavingsCommandResponse> {
    const { data } = await client.post<SavingsCommandResponse>(`/savingsaccounts/${accountId}`, payload, {
        params: { command: "approve" },
    });
    return data;
}

export async function activateSavingsAccount(accountId: number, payload: { activatedOnDate?: string; locale?: string; dateFormat?: string } = {}): Promise<SavingsCommandResponse> {
    const { data } = await client.post<SavingsCommandResponse>(`/savingsaccounts/${accountId}`, payload, {
        params: { command: "activate" },
    });
    return data;
}

export async function closeSavingsAccount(accountId: number, payload: { closedOnDate?: string; locale?: string; dateFormat?: string } = {}): Promise<SavingsCommandResponse> {
    const { data } = await client.post<SavingsCommandResponse>(`/savingsaccounts/${accountId}`, payload, {
        params: { command: "close" },
    });
    return data;
}

// ─── Deposit / Withdraw ──────────────────────────────────────────

export async function fetchDepositTemplate(accountId: number): Promise<SavingsTransactionTemplate> {
    const { data } = await client.get<SavingsTransactionTemplate>(`/savingsaccounts/${accountId}/transactions/template`, { params: { command: "deposit" } });
    return data;
}

export async function makeDeposit(accountId: number, payload: SavingsTransactionRequest): Promise<SavingsCommandResponse> {
    const { data } = await client.post<SavingsCommandResponse>(`/savingsaccounts/${accountId}/transactions`, { ...payload, locale: "en" }, { params: { command: "deposit" } });
    return data;
}

export async function fetchWithdrawTemplate(accountId: number): Promise<SavingsTransactionTemplate> {
    const { data } = await client.get<SavingsTransactionTemplate>(`/savingsaccounts/${accountId}/transactions/template`, { params: { command: "withdrawal" } });
    return data;
}

export async function makeWithdrawal(accountId: number, payload: SavingsTransactionRequest): Promise<SavingsCommandResponse> {
    const { data } = await client.post<SavingsCommandResponse>(
        `/savingsaccounts/${accountId}/transactions`,
        { ...payload, locale: "en", dateFormat: "yyyy-MM-dd" },
        { params: { command: "withdrawal" } },
    );
    return data;
}

// ─── Fixed Deposit Lifecycle Commands ───────────────────────────
// Section 10.4 — POST /fixeddepositaccounts/{id}?command={command}

export async function fixedDepositCommand(accountId: number, command: string, data: Record<string, unknown> = {}): Promise<SavingsCommandResponse> {
    // Convert any date fields from yyyy-MM-dd to yyyy-MM-dd
    const dateFields = ["approvedOnDate", "activatedOnDate", "closedOnDate", "rejectedOnDate", "withdrawnOnDate"];
    const converted: Record<string, unknown> = { locale: "en", dateFormat: "yyyy-MM-dd" };
    for (const [k, v] of Object.entries(data)) {
        converted[k] = dateFields.includes(k) ? currentDate(v as string | undefined) : v;
    }
    const { data: result } = await client.post<SavingsCommandResponse>(`/fixeddepositaccounts/${accountId}`, converted, { params: { command } });
    return result;
}

export async function approveFixedDeposit(accountId: number, approvedOnDate?: string) {
    return fixedDepositCommand(accountId, "approve", approvedOnDate ? { approvedOnDate } : { approvedOnDate: new Date().toISOString().split("T")[0] });
}

export async function activateFixedDeposit(accountId: number, activatedOnDate?: string) {
    return fixedDepositCommand(accountId, "activate", activatedOnDate ? { activatedOnDate } : { activatedOnDate: new Date().toISOString().split("T")[0] });
}

export async function closeFixedDeposit(accountId: number, closedOnDate?: string) {
    return fixedDepositCommand(accountId, "close", closedOnDate ? { closedOnDate } : { closedOnDate: new Date().toISOString().split("T")[0] });
}

export async function prematureCloseFixedDeposit(accountId: number, closedOnDate?: string) {
    return fixedDepositCommand(accountId, "prematureClose", closedOnDate ? { closedOnDate } : { closedOnDate: new Date().toISOString().split("T")[0] });
}

export async function rejectFixedDeposit(accountId: number, rejectedOnDate?: string) {
    return fixedDepositCommand(accountId, "reject", rejectedOnDate ? { rejectedOnDate } : { rejectedOnDate: new Date().toISOString().split("T")[0] });
}

export async function withdrawFixedDeposit(accountId: number, withdrawnOnDate?: string) {
    return fixedDepositCommand(accountId, "withdrawnByApplicant", withdrawnOnDate ? { withdrawnOnDate } : { withdrawnOnDate: new Date().toISOString().split("T")[0] });
}

export async function undoApprovalFixedDeposit(accountId: number) {
    return fixedDepositCommand(accountId, "undoApproval");
}

export async function undoActivationFixedDeposit(accountId: number) {
    return fixedDepositCommand(accountId, "undoActivation");
}

export async function calculatePrematureAmount(accountId: number, closedOnDate?: string) {
    return fixedDepositCommand(accountId, "calculatePrematureAmount", closedOnDate ? { closedOnDate } : {});
}

// ─── Create Fixed Deposit (10.2) ──────────────────────────────

export async function createFixedDepositAccount(payload: Record<string, unknown>): Promise<SavingsCommandResponse> {
    const { data } = await client.post<SavingsCommandResponse>("/fixeddepositaccounts", {
        locale: "en",
        dateFormat: "yyyy-MM-dd",
        nominalAnnualInterestRate: 1,
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

export async function fetchRecurringDepositAccounts(params: FixedDepositListParams = {}): Promise<{ totalFilteredRecords: number; pageItems: RecurringDepositAccount[] }> {
    const { data } = await client.get<{ totalFilteredRecords: number; pageItems: RecurringDepositAccount[] }>("/recurringdepositaccounts", { params });
    return data;
}

export async function fetchRecurringDepositAccount(accountId: number | string): Promise<RecurringDepositAccount> {
    const { data } = await client.get<RecurringDepositAccount>(`/recurringdepositaccounts/${accountId}`);
    return data;
}

export async function createRecurringDepositAccount(payload: Record<string, unknown>): Promise<SavingsCommandResponse> {
    const { data } = await client.post<SavingsCommandResponse>("/recurringdepositaccounts", payload);
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
export async function fetchFixedDepositTransactions(accountId: number | string): Promise<{ totalFilteredRecords?: number; pageItems?: FixedDepositTransaction[] }> {
    const { data } = await client.get(`/fixeddepositaccounts/${accountId}/transactions`, { params: { offset: 0, limit: 100 } });
    return data;
}

/** POST /fixeddepositaccounts/{accountId}/transactions/{transactionId}?command=undo */
export async function undoFixedDepositTransaction(accountId: number | string, transactionId: number | string): Promise<{ resourceId: number }> {
    const { data } = await client.post(`/fixeddepositaccounts/${accountId}/transactions/${transactionId}`, {}, { params: { command: "undo" } });
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

export async function createFixedDepositProduct(payload: FixedDepositProductCreateRequest): Promise<{ resourceId: number }> {
    const { data } = await client.post<{ resourceId: number }>("/fixeddepositproducts", {
        ...payload,
    });
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
export async function waiveSavingsCharge(savingsAccountId: number | string, chargeId: number | string): Promise<{ savingsAccountId: number; resourceId: number }> {
    const { data } = await client.post(`/savingsaccounts/${savingsAccountId}/charges/${chargeId}`, {}, { params: { command: "waive" } });
    return data;
}

/** DELETE /savingsaccounts/{savingsAccountId}/charges/{chargeId} */
export async function deleteSavingsCharge(savingsAccountId: number | string, chargeId: number | string): Promise<{ savingsAccountId: number; resourceId: number }> {
    const { data } = await client.delete(`/savingsaccounts/${savingsAccountId}/charges/${chargeId}`);
    return data;
}

// ─── Savings Commands (Section 4) ────────────────────────────────

/** POST /savingsaccounts/{savingsAccountId}?command=reject */
export async function rejectSavingsAccount(savingsAccountId: number | string): Promise<{ resourceId: number }> {
    const { data } = await client.post(`/savingsaccounts/${savingsAccountId}`, {}, { params: { command: "reject" } });
    return data;
}

/** POST /savingsaccounts/{savingsAccountId}?command=withdrawnByApplicant */
export async function withdrawSavingsAccount(savingsAccountId: number | string): Promise<{ resourceId: number }> {
    const { data } = await client.post(`/savingsaccounts/${savingsAccountId}`, {}, { params: { command: "withdrawnByApplicant" } });
    return data;
}

/** POST /savingsaccounts/{savingsAccountId}?command=undoRejection */
export async function undoRejectSavingsAccount(savingsAccountId: number | string): Promise<{ resourceId: number }> {
    const { data } = await client.post(`/savingsaccounts/${savingsAccountId}`, {}, { params: { command: "undoRejection" } });
    return data;
}

// ─── Savings Transactions (Section 4) ────────────────────────────

export interface SavingsTransaction {
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

/** GET /savingsaccounts/{savingsAccountId}/transactions?offset=0&limit=100 */
export async function fetchSavingsTransactions(savingsAccountId: number | string): Promise<{ totalFilteredRecords?: number; pageItems?: SavingsTransaction[] }> {
    const { data } = await client.get(`/savingsaccounts/${savingsAccountId}/transactions`, {
        params: { offset: 0, limit: 100 },
    });
    return data;
}
