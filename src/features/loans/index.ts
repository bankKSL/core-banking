// ─── Loans Feature ──────────────────────────────────────────

export type {
    Loan,
    LoanStatus,
    LoanProduct,
    LoanTimeline,
    LoanSummary,
    LoanRepaymentPeriod,
    LoanTransaction,
    LoanListResponse,
    LoanListParams,
    LoanCreateRequest,
    LoanTemplate,
    LoanCommandRequest,
    LoanCommandResponse,
    RepaymentTransactionRequest,
    RepaymentTemplate,
    LoanProductCreateRequest,
    AmortizationType,
    InterestType as LoanInterestType,
    InterestCalculationPeriodType,
    RepaymentFrequency,
    LoanTransactionType,
} from "./types/loan";

export {
    LOAN_STATUS_LABELS,
    LOAN_STATUS_CONFIG,
    LOAN_STATUS_ID_MAP,
    LOANS_PAGE_SIZE,
    LOAN_SEARCH_DEBOUNCE_MS,
    INTEREST_TYPE_LABELS,
    AMORTIZATION_TYPE_LABELS,
    REPAYMENT_FREQ_LABELS,
} from "./constants/status";

export { createLoanSchema, createLoanProductSchema } from "./schemas/loan.schema";
export type { CreateLoanFormValues, CreateLoanProductFormValues } from "./schemas/loan.schema";

export {
    fetchLoans,
    fetchLoan,
    fetchLoanTemplate,
    createLoan,
    updateLoan,
    deleteLoan,
    approveLoan,
    disburseLoan,
    rejectLoan,
    closeLoan,
    undoApproval,
    undoDisbursal,
    fetchRepaymentTemplate,
    fetchRepaymentSchedule,
    fetchLoanTransactions,
    fetchLoanProducts,
    fetchLoanProduct,
    createLoanProduct,
    updateLoanProduct,
    fetchTransactionTemplate,
    makeTransaction,
    waiveInterest,
    prepayLoan,
    forecloseLoan,
    writeOffLoan,
    rejectLoanApplication,
    withdrawLoanApplication,
    closeLoanAsRescheduled,
} from "./api/loan";

export { useLoans, loanKeys } from "./hooks/useLoans";

export { useLoan as useLoanDetail } from "./hooks/useLoan";

export { useLoanProducts, useLoanProduct } from "./hooks/useLoanProducts";

export { useLoanTemplate } from "./hooks/useLoanTemplate";

export { useCreateLoan } from "./hooks/useCreateLoan";

export { useLoan } from "./hooks/useLoan";

export { useApproveLoan, useDisburseLoan, useRejectLoan, useCloseLoan, useUndoApproval, useUndoDisbursal } from "./hooks/useLoanCommands";

export { useUpdateLoan } from "./hooks/useUpdateLoan";

export { useRepaymentSchedule } from "./hooks/useRepaymentSchedule";

export { useCreateLoan as useCreateLoanMutation } from "./hooks/useCreateLoan";

export { useLoanTemplate as useLoanTemplateQuery } from "./hooks/useLoanTemplate";

// ─── Pages ─────────────────────────────────────────────────
export { default as LoansListPage } from "./pages/LoansListPage";
export { default as LoanFormPage } from "./pages/LoanFormPage";
export { default as LoanViewPage } from "./pages/LoanViewPage";
export { default as LoanTransactionFormPage } from "./pages/LoanTransactionFormPage";

// ─── Components ────────────────────────────────────────────
export { default as LoanTable } from "./components/LoanTable";
export { default as LoanFilters } from "./components/LoanFilters";
export { default as LoanForm } from "./components/LoanForm";
export { default as LoanDetails } from "./components/LoanDetails";
export { default as LoanCommands } from "./components/LoanCommands";
export { default as LoanStatusBadge } from "./components/LoanStatusBadge";
export { default as LoanTransactionsTable } from "./components/LoanTransactionsTable";
export { default as LoanTransactionForm } from "./components/LoanTransactionForm";
export type { TransactionFormValues } from "./components/LoanTransactionForm";

