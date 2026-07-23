import client from "@/api/client";

/**
 * Convert yyyy-MM-dd (HTML date input) → yyyy-MM-dd (Finfact format).
 * Returns undefined if empty or already in Finfact format.
 */

import type {
    Loan,
    LoanListResponse,
    LoanListParams,
    LoanCreateRequest,
    LoanTemplate,
    LoanCommandRequest,
    LoanCommandResponse,
    RepaymentTransactionRequest,
    RepaymentTemplate,
    LoanProduct,
    LoanProductCreateRequest,
} from "../types/loan";
import { currentDate } from "@/lib/utils";

// ─── Loan Products ───────────────────────────────────────────────

export async function fetchLoanProducts(params?: { offset?: number; limit?: number }): Promise<LoanProduct[]> {
    const { data } = await client.get<LoanProduct[]>("/loanproducts", { params });
    return data;
}

export async function fetchLoanProduct(productId: number): Promise<LoanProduct> {
    const { data } = await client.get<LoanProduct>(`/loanproducts/${productId}`);
    return data;
}

export async function createLoanProduct(payload: LoanProductCreateRequest): Promise<LoanCommandResponse> {
    const { data } = await client.post<LoanCommandResponse>("/loanproducts", payload);
    return data;
}

export async function updateLoanProduct(productId: number, payload: Partial<LoanProductCreateRequest>): Promise<LoanCommandResponse> {
    const { data } = await client.put<LoanCommandResponse>(`/loanproducts/${productId}`, payload);
    return data;
}

// ─── Loans ───────────────────────────────────────────────────────

export async function fetchLoans(params: LoanListParams = {}): Promise<LoanListResponse> {
    const { data } = await client.get<LoanListResponse>("/loans", { params });
    return data;
}

export async function fetchLoan(loanId: number | string): Promise<Loan> {
    const { data } = await client.get<Loan>(`/loans/${loanId}`);
    return data;
}

export async function fetchLoanTemplate(clientId?: number, productId?: number): Promise<LoanTemplate> {
    const params: Record<string, string> = {};
    if (clientId) params.clientId = String(clientId);
    if (productId) params.productId = String(productId);
    const { data } = await client.get<LoanTemplate>("/loans/template", { params });
    return data;
}

export async function createLoan(payload: LoanCreateRequest): Promise<LoanCommandResponse> {
    const { data } = await client.post<LoanCommandResponse>("/loans", {
        ...payload,
        submittedOnDate: currentDate(payload.submittedOnDate),
        expectedDisbursementDate: currentDate(payload.expectedDisbursementDate),
        locale: "en",
        dateFormat: "yyyy-MM-dd",
    });
    return data;
}

export async function updateLoan(loanId: number, payload: Partial<LoanCreateRequest>): Promise<LoanCommandResponse> {
    const { data } = await client.put<LoanCommandResponse>(`/loans/${loanId}`, payload);
    return data;
}

export async function deleteLoan(loanId: number): Promise<LoanCommandResponse> {
    const { data } = await client.delete<LoanCommandResponse>(`/loans/${loanId}`);
    return data;
}

// ─── Loan Lifecycle Commands ──────────────────────────────────────

export async function approveLoan(loanId: number, payload: LoanCommandRequest = {}): Promise<LoanCommandResponse> {
    const { data } = await client.post<LoanCommandResponse>(`/loans/${loanId}`, payload, {
        params: { command: "approve" },
    });
    return data;
}

export async function disburseLoan(loanId: number, payload: LoanCommandRequest = {}): Promise<LoanCommandResponse> {
    const { data } = await client.post<LoanCommandResponse>(`/loans/${loanId}`, payload, {
        params: { command: "disburse" },
    });
    return data;
}

export async function rejectLoan(loanId: number, payload: LoanCommandRequest = {}): Promise<LoanCommandResponse> {
    const { data } = await client.post<LoanCommandResponse>(`/loans/${loanId}`, payload, {
        params: { command: "reject" },
    });
    return data;
}

export async function closeLoan(loanId: number, payload: LoanCommandRequest = {}): Promise<LoanCommandResponse> {
    const { data } = await client.post<LoanCommandResponse>(`/loans/${loanId}`, payload, {
        params: { command: "close" },
    });
    return data;
}

export async function undoApproval(loanId: number): Promise<LoanCommandResponse> {
    const { data } = await client.post<LoanCommandResponse>(
        `/loans/${loanId}`,
        {},
        {
            params: { command: "undoApproval" },
        },
    );
    return data;
}

export async function undoDisbursal(loanId: number): Promise<LoanCommandResponse> {
    const { data } = await client.post<LoanCommandResponse>(
        `/loans/${loanId}`,
        {},
        {
            params: { command: "undoDisbursal" },
        },
    );
    return data;
}

// ─── Repayments ──────────────────────────────────────────────────

export async function fetchRepaymentTemplate(loanId: number): Promise<RepaymentTemplate> {
    const { data } = await client.get<RepaymentTemplate>(`/loans/${loanId}/transactions/template`, { params: { command: "repayment" } });
    return data;
}

// ─── Loan Transaction Template ──────────────────────────────

export async function fetchTransactionTemplate(loanId: number, command?: string): Promise<any> {
    const { data } = await client.get<any>(`/loans/${loanId}/transactions/template`, {
        params: command ? { command } : undefined,
    });
    return data;
}

// ─── Generic Transaction Posting ────────────────────────────

export async function makeTransaction(loanId: number, payload: Record<string, unknown>, command: string): Promise<LoanCommandResponse> {
    const { data } = await client.post<LoanCommandResponse>(`/loans/${loanId}/transactions`, { ...payload, locale: "en", dateFormat: "yyyy-MM-dd" }, { params: { command } });
    return data;
}

// ─── Additional Lifecycle Commands ──────────────────────────

export async function waiveInterest(loanId: number, payload: LoanCommandRequest = {}): Promise<LoanCommandResponse> {
    return makeTransaction(loanId, payload as Record<string, unknown>, "waiveinterest");
}

export async function prepayLoan(loanId: number, payload: LoanCommandRequest = {}): Promise<LoanCommandResponse> {
    return makeTransaction(loanId, payload as Record<string, unknown>, "prepayLoan");
}

export async function forecloseLoan(loanId: number, payload: LoanCommandRequest = {}): Promise<LoanCommandResponse> {
    return makeTransaction(loanId, payload as Record<string, unknown>, "foreclosure");
}

export async function writeOffLoan(loanId: number, payload: LoanCommandRequest = {}): Promise<LoanCommandResponse> {
    return makeTransaction(loanId, payload as Record<string, unknown>, "writeoff");
}

export async function rejectLoanApplication(loanId: number, payload: LoanCommandRequest = {}): Promise<LoanCommandResponse> {
    const { data } = await client.post<LoanCommandResponse>(`/loans/${loanId}`, payload, {
        params: { command: "reject" },
    });
    return data;
}

export async function withdrawLoanApplication(loanId: number, payload: LoanCommandRequest = {}): Promise<LoanCommandResponse> {
    const { data } = await client.post<LoanCommandResponse>(`/loans/${loanId}`, payload, {
        params: { command: "withdrawnByClient" },
    });
    return data;
}

export async function closeLoanAsRescheduled(loanId: number, payload: LoanCommandRequest = {}): Promise<LoanCommandResponse> {
    const { data } = await client.post<LoanCommandResponse>(`/loans/${loanId}`, payload, {
        params: { command: "closeAsRescheduled" },
    });
    return data;
}

// ─── Loan Repayment Schedule ──────────────────────────────────────

export async function fetchRepaymentSchedule(loanId: number): Promise<Loan> {
    const { data } = await client.get<Loan>(`/loans/${loanId}`, {
        params: { associations: "repaymentSchedule" },
    });
    return data;
}

// ─── Loan Transactions ────────────────────────────────────────────

export async function fetchLoanTransactions(loanId: number): Promise<Loan> {
    const { data } = await client.get<Loan>(`/loans/${loanId}`, {
        params: { associations: "all" },
    });
    return data;
}
