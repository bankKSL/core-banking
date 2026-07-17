import client from "@/api/client";
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
    const { data } = await client.post<SavingsCommandResponse>("/savingsaccounts", payload);
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
        payload,
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
        payload,
        { params: { command: "withdrawal" } }
    );
    return data;
}

// ─── Fixed Deposits ──────────────────────────────────────────────

export async function fetchFixedDepositAccounts(params: FixedDepositListParams = {}): Promise<{ totalFilteredRecords: number; pageItems: FixedDepositAccount[] }> {
    const { data } = await client.get<{ totalFilteredRecords: number; pageItems: FixedDepositAccount[] }>("/fixeddepositaccounts", { params });
    return data;
}

export async function fetchFixedDepositAccount(accountId: number | string): Promise<FixedDepositAccount> {
    const { data } = await client.get<FixedDepositAccount>(`/fixeddepositaccounts/${accountId}`);
    return data;
}

export async function createFixedDepositAccount(payload: Record<string, unknown>): Promise<SavingsCommandResponse> {
    const { data } = await client.post<SavingsCommandResponse>("/fixeddepositaccounts", payload);
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
