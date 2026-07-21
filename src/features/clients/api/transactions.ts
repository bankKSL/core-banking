import client from "@/api/client";

// ─── Types ─────────────────────────────────────────────────────────────

export interface ClientTransaction {
    id: number;
    clientId: number;
    officeId?: number;
    officeName?: string;
    type: {
        id: number;
        code: string;
        value: string;
    };
    date?: string;
    dateFormat?: string;
    amount: number;
    reversed?: boolean;
    transactionDate?: string;
    currency?: {
        code: string;
        name: string;
        decimalPlaces: number;
        displaySymbol?: string;
    };
    paymentTypeId?: number;
    paymentTypeName?: string;
}

export interface ClientTransactionListResponse {
    totalFilteredRecords?: number;
    pageItems?: ClientTransaction[];
}

export interface ClientTransactionCommandResponse {
    clientId: number;
    resourceId: number;
    officeId?: number;
}

// ─── API Functions ─────────────────────────────────────────────────────

/**
 * GET /clients/{clientId}/transactions
 * List all transactions for a client.
 */
export async function fetchClientTransactions(
    clientId: number | string,
    params?: {
        offset?: number;
        limit?: number;
    },
): Promise<ClientTransactionListResponse> {
    const { data } = await client.get<ClientTransactionListResponse>(
        `/clients/${clientId}/transactions`,
        { params },
    );
    return data;
}

/**
 * POST /clients/{clientId}/transactions/{transactionId}?command=undo
 * Undo a client transaction (reversal).
 */
export async function undoClientTransaction(
    clientId: number | string,
    transactionId: number | string,
): Promise<ClientTransactionCommandResponse> {
    const { data } = await client.post<ClientTransactionCommandResponse>(
        `/clients/${clientId}/transactions/${transactionId}`,
        {},
        { params: { command: "undo" } },
    );
    return data;
}
