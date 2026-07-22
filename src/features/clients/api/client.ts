import client from "@/api/client";

/**
 * Convert yyyy-MM-dd (HTML date input) → yyyy-MM-dd (Fineract format).
 * Returns undefined if the input is empty or already in Fineract format.
 */
function toFineractDate(isoDate?: string): string | undefined {
    if (!isoDate) return undefined;
    // Already in "yyyy-MM-dd" format (contains alphabetic month)?
    if (/[A-Za-z]/.test(isoDate)) return isoDate;
    const [y, m, d] = isoDate.split("-").map(Number);
    if (!y || !m || !d) return isoDate;
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${d} ${months[m - 1]} ${y}`;
}

import type { Client, ClientListResponse, ClientListParams, ClientCreateRequest, ClientUpdateRequest, ClientTemplate, ClientActivateRequest } from "../types/client";

// ─── List Clients ─────────────────────────────────────────────
export async function fetchClients(params: ClientListParams = {}): Promise<ClientListResponse> {
    const { data } = await client.get<ClientListResponse>("/clients", { params });
    return data;
}

// ─── Get Single Client ────────────────────────────────────────
export async function fetchClient(clientId: number | string): Promise<Client> {
    const { data } = await client.get<Client>(`/clients/${clientId}`);
    return data;
}

// ─── Create Client ────────────────────────────────────────────
export async function createClient(payload: ClientCreateRequest): Promise<{ clientId: number; resourceId: number; officeId: number }> {
    const { data } = await client.post<{ clientId: number; resourceId: number; officeId: number }>("/clients", payload);
    return data;
}

// ─── Update Client ────────────────────────────────────────────
export async function updateClient(clientId: number | string, payload: ClientUpdateRequest): Promise<{ clientId: number; resourceId: number; officeId: number }> {
    const { data } = await client.put<{ clientId: number; resourceId: number; officeId: number }>(`/clients/${clientId}`, payload);
    return data;
}

// ─── Activate Client ──────────────────────────────────────────
export async function activateClient(clientId: number | string, payload: ClientActivateRequest = {}): Promise<{ clientId: number; resourceId: number }> {
    const { data } = await client.post<{ clientId: number; resourceId: number }>(`/clients/${clientId}`, null, {
        params: { command: "activate", ...payload },
    });
    return data;
}

// ─── Delete Client ────────────────────────────────────────────
export async function deleteClient(clientId: number | string): Promise<{ clientId: number; resourceId: number }> {
    const { data } = await client.delete<{ clientId: number; resourceId: number }>(`/clients/${clientId}`);
    return data;
}

// ─── Client Accounts Overview ──────────────────────────────────
// GET /clients/{clientId}/accounts — returns loanAccounts[] and savingsAccounts[]

export interface ClientLoanAccount {
    id: number;
    accountNo: string;
    productId: number;
    productName: string;
    status: {
        id: number;
        code: string;
        description: string;
        pendingApproval: boolean;
        waitingForDisbursal: boolean;
        active: boolean;
        closed: boolean;
        overpaid: boolean;
    };
    loanType?: { id: number; code: string; description: string };
    loanCycle: number;
    currency: { code: string; name: string; decimalPlaces: number; displaySymbol: string };
    originalLoan?: number;
    loanBalance?: number;
    amountPaid?: number;
    amountOutstanding?: number;
    accountBalance?: number;
}

export interface ClientSavingsAccount {
    id: number;
    accountNo: string;
    productId: number;
    productName: string;
    status: {
        id: number;
        code: string;
        description: string;
        submittedAndPendingApproval: boolean;
        approved: boolean;
        active: boolean;
        closed: boolean;
        rejected: boolean;
    };
    currency: { code: string; name: string; decimalPlaces: number; displaySymbol: string };
    accountBalance: number;
    totalDeposits?: number;
    totalWithdrawals?: number;
    totalInterestEarned?: number;
}

export interface ClientAccountsResponse {
    loanAccounts: ClientLoanAccount[];
    savingsAccounts: ClientSavingsAccount[];
}

export async function fetchClientAccounts(clientId: number | string): Promise<ClientAccountsResponse> {
    const { data } = await client.get<ClientAccountsResponse>(`/clients/${clientId}/accounts`);
    return data;
}

// ─── Client Template ──────────────────────────────────────────
export async function fetchClientTemplate(): Promise<ClientTemplate> {
    const { data } = await client.get<ClientTemplate>("/clients/template");
    return data;
}

// ─── Client Commands ──────────────────────────────────────────
export async function rejectClient(clientId: number | string): Promise<{ clientId: number; resourceId: number }> {
    const { data } = await client.post<{ clientId: number; resourceId: number }>(`/clients/${clientId}`, null, {
        params: { command: "reject" },
    });
    return data;
}

export async function withdrawClient(clientId: number | string): Promise<{ clientId: number; resourceId: number }> {
    const { data } = await client.post<{ clientId: number; resourceId: number }>(`/clients/${clientId}`, null, {
        params: { command: "withdraw" },
    });
    return data;
}

export async function closeClient(
    clientId: number | string,
    payload?: { closureDate?: string; dateFormat?: string; locale?: string },
): Promise<{ clientId: number; resourceId: number }> {
    const { data } = await client.post<{ clientId: number; resourceId: number }>(`/clients/${clientId}`, payload ?? {}, {
        params: { command: "close" },
    });
    return data;
}

export async function reactivateClient(clientId: number | string): Promise<{ clientId: number; resourceId: number }> {
    const { data } = await client.post<{ clientId: number; resourceId: number }>(`/clients/${clientId}`, null, {
        params: { command: "reactivate" },
    });
    return data;
}

export async function undoRejectClient(clientId: number | string): Promise<{ clientId: number; resourceId: number }> {
    const { data } = await client.post<{ clientId: number; resourceId: number }>(`/clients/${clientId}`, null, {
        params: { command: "undoreject" },
    });
    return data;
}

export async function undoWithdrawClient(clientId: number | string): Promise<{ clientId: number; resourceId: number }> {
    const { data } = await client.post<{ clientId: number; resourceId: number }>(`/clients/${clientId}`, null, {
        params: { command: "undowithdraw" },
    });
    return data;
}
