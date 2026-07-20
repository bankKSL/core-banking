import client from "@/api/client";

/**
 * Convert yyyy-MM-dd (HTML date input) → dd MMMM yyyy (Fineract format).
 * Returns undefined if empty or already in Fineract format.
 */
function toFineractDate(isoDate?: string): string | undefined {
    if (!isoDate) return undefined;
    if (/[A-Za-z]/.test(isoDate)) return isoDate;
    const [y, m, d] = isoDate.split("-").map(Number);
    if (!y || !m || !d) return isoDate;
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return `${d} ${months[m - 1]} ${y}`;
}

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
        params: { associations: "all" },
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
        submittedOnDate: toFineractDate(payload.submittedOnDate),
        dateFormat: "dd MMMM yyyy",
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
    const { data } = await client.get<SavingsTransactionTemplate>(
        `/savingsaccounts/${accountId}/transactions/template`,
        { params: { command: "deposit" } }
    );
    return data;
}

export async function makeDeposit(accountId: number, payload: SavingsTransactionRequest): Promise<SavingsCommandResponse> {
    const { data } = await client.post<SavingsCommandResponse>(
        `/savingsaccounts/${accountId}/transactions`,
        { ...payload, transactionDate: toFineractDate(payload.transactionDate), locale: "en", dateFormat: "dd MMMM yyyy" },
        { params: { command: "deposit" } }
    );
    return data;
}

export async function fetchWithdrawTemplate(accountId: number): Promise<SavingsTransactionTemplate> {
    const { data } = await client.get<SavingsTransactionTemplate>(
        `/savingsaccounts/${accountId}/transactions/template`,
        { params: { command: "withdrawal" } }
    );
    return data;
}

export async function makeWithdrawal(accountId: number, payload: SavingsTransactionRequest): Promise<SavingsCommandResponse> {
    const { data } = await client.post<SavingsCommandResponse>(
        `/savingsaccounts/${accountId}/transactions`,
        { ...payload, transactionDate: toFineractDate(payload.transactionDate), locale: "en", dateFormat: "dd MMMM yyyy" },
        { params: { command: "withdrawal" } }
    );
    return data;
}

// ─── Fixed Deposit Lifecycle Commands ───────────────────────────
// Section 10.4 — POST /fixeddepositaccounts/{id}?command={command}

export async function fixedDepositCommand(
    accountId: number,
    command: string,
    data: Record<string, unknown> = {}
): Promise<SavingsCommandResponse> {
    // Convert any date fields from yyyy-MM-dd to dd MMMM yyyy
    const dateFields = ["approvedOnDate", "activatedOnDate", "closedOnDate", "rejectedOnDate", "withdrawnOnDate"];
    const converted: Record<string, unknown> = { locale: "en", dateFormat: "dd MMMM yyyy" };
    for (const [k, v] of Object.entries(data)) {
        converted[k] = dateFields.includes(k) ? toFineractDate(v as string | undefined) : v;
    }
    const { data: result } = await client.post<SavingsCommandResponse>(
        `/fixeddepositaccounts/${accountId}`,
        converted,
        { params: { command } }
    );
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
        dateFormat: "dd MMMM yyyy",
        ...payload,
        submittedOnDate: toFineractDate(payload.submittedOnDate as string | undefined),
    });
    return data;
}

// ─── Fetch Fixed Deposits (10.1, 10.3) ────────────────────────

export async function fetchFixedDepositAccounts(params: FixedDepositListParams = {}): Promise<{ totalFilteredRecords: number; pageItems: FixedDepositAccount[] }> {
    const { data } = await client.get<{ totalFilteredRecords: number; pageItems: FixedDepositAccount[] }>("/fixeddepositaccounts", { params });
    return data;
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
    // Convert chart slab dates from yyyy-MM-dd → dd MMMM yyyy
    const charts = payload.charts?.map((chart) => ({
        ...chart,
        fromDate: chart.fromDate ? toFineractDate(chart.fromDate) : undefined,
        endDate: chart.endDate ? toFineractDate(chart.endDate) : undefined,
    }));
    const { data } = await client.post<{ resourceId: number }>("/fixeddepositproducts", {
        ...payload,
        charts,
    });
    return data;
}
