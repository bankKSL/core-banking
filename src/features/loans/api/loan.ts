import client from "@/api/client";
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
    const { data } = await client.post<LoanCommandResponse>("/loans", payload);
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
    const { data } = await client.post<LoanCommandResponse>(`/loans/${loanId}`, {}, {
        params: { command: "undoApproval" },
    });
    return data;
}

export async function undoDisbursal(loanId: number): Promise<LoanCommandResponse> {
    const { data } = await client.post<LoanCommandResponse>(`/loans/${loanId}`, {}, {
        params: { command: "undoDisbursal" },
    });
    return data;
}

// ─── Repayments ──────────────────────────────────────────────────

export async function fetchRepaymentTemplate(loanId: number): Promise<RepaymentTemplate> {
    const { data } = await client.get<RepaymentTemplate>(
        `/loans/${loanId}/transactions/template`,
        { params: { command: "repayment" } }
    );
    return data;
}

export async function makeRepayment(
    loanId: number,
    payload: RepaymentTransactionRequest
): Promise<LoanCommandResponse> {
    const { data } = await client.post<LoanCommandResponse>(
        `/loans/${loanId}/transactions`,
        payload,
        { params: { command: "repayment" } }
    );
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
