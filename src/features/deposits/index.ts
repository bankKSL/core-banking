// ─── Deposits Feature ───────────────────────────────────────

export type {
    SavingsAccount,
    SavingsAccountStatus,
    SavingsProduct,
    SavingsTransaction,
    SavingsSummary,
    SavingsAccountListResponse,
    SavingsAccountListParams,
    SavingsAccountTemplate,
    SavingsAccountCreateRequest,
    SavingsCommandResponse,
    SavingsTransactionRequest,
    SavingsTransactionTemplate,
    FixedDepositAccount,
    FixedDepositListParams,
    RecurringDepositAccount,
    SavingsProductCreateRequest,
    DepositAccountType,
    FixedDepositProduct,
    FixedDepositProductCreateRequest,
} from "./types/deposit";

export {
    SAVINGS_STATUS_LABELS,
    SAVINGS_STATUS_CONFIG,
    DEPOSIT_ACCOUNTS_PAGE_SIZE,
    DEPOSIT_SEARCH_DEBOUNCE_MS,
    DEPOSIT_TYPE_LABELS,
    DEPOSIT_PERIOD_FREQUENCIES,
    FIXED_DEPOSIT_STATUS_CONFIG,
    PRE_CLOSURE_PENALTY_TYPES,
    CHART_SLAB_PERIOD_TYPES,
    ACCOUNTING_RULES,
} from "./constants/status";

export {
    createSavingsAccountSchema,
    depositTransactionSchema,
    createSavingsProductSchema,
} from "./schemas/deposit.schema";
export type {
    CreateSavingsAccountFormValues,
    DepositTransactionFormValues,
    CreateSavingsProductFormValues,
} from "./schemas/deposit.schema";

export {
    fetchSavingsAccounts,
    fetchSavingsAccount,
    fetchSavingsAccountTemplate,
    createSavingsAccount,
    updateSavingsAccount,
    deleteSavingsAccount,
    approveSavingsAccount,
    activateSavingsAccount,
    closeSavingsAccount,
    fetchDepositTemplate,
    makeDeposit,
    fetchWithdrawTemplate,
    makeWithdrawal,
    fetchFixedDepositAccounts,
    fetchFixedDepositAccount,
    createFixedDepositAccount,
    approveFixedDeposit,
    activateFixedDeposit,
    closeFixedDeposit,
    prematureCloseFixedDeposit,
    rejectFixedDeposit,
    withdrawFixedDeposit,
    undoApprovalFixedDeposit,
    undoActivationFixedDeposit,
    calculatePrematureAmount,
    fetchFixedDepositProducts,
    fetchFixedDepositProduct,
    createFixedDepositProduct,
    fetchRecurringDepositAccounts,
    fetchRecurringDepositAccount,
    createRecurringDepositAccount,
    fetchSavingsProducts,
    fetchSavingsProduct,
    createSavingsProduct,
    updateSavingsProduct,
} from "./api/deposit";

export {
    useSavingsAccounts,
    useSavingsAccount,
    depositKeys,
} from "./hooks/useSavingsAccounts";

export {
    useSavingsProducts,
    useSavingsProduct,
} from "./hooks/useSavingsProducts";

export { useSavingsTemplate } from "./hooks/useSavingsTemplate";

export { useCreateSavingsAccount } from "./hooks/useCreateSavingsAccount";

export {
    useMakeDeposit,
    useMakeWithdrawal,
} from "./hooks/useDepositWithdraw";

export {
    useFixedDepositAccounts,
    useFixedDepositAccount,
} from "./hooks/useFixedDeposits";

export {
    useFixedDepositProducts,
    useFixedDepositProduct,
} from "./hooks/useFixedDepositProducts";

export {
    useRecurringDepositAccounts,
    useRecurringDepositAccount,
} from "./hooks/useRecurringDeposits";

// API — Savings Charges
export { fetchSavingsCharges, fetchSavingsChargesTemplate, createSavingsCharge, waiveSavingsCharge, deleteSavingsCharge } from "./api/deposit";
export type { SavingsCharge, SavingsChargeListResponse, PostSavingsChargeRequest, SavingsChargesTemplate } from "./api/deposit";

// API — Savings Commands
export { rejectSavingsAccount, withdrawSavingsAccount, undoRejectSavingsAccount } from "./api/deposit";

// API — Savings Transactions
export { fetchSavingsTransactions, undoSavingsTransaction } from "./api/deposit";

// API — Fixed Deposit Transactions
export { fetchFixedDepositTransactions, undoFixedDepositTransaction } from "./api/deposit";
export type { FixedDepositTransaction } from "./api/deposit";

// Hooks — Savings Charges
export { useSavingsCharges, useSavingsChargesTemplate, useCreateSavingsCharge, useWaiveSavingsCharge, useDeleteSavingsCharge, savingsChargeKeys } from "./hooks/useSavingsCharges";

// Hooks — Savings Commands
export { useRejectSavingsAccount, useWithdrawSavingsAccount, useUndoRejectSavingsAccount } from "./hooks/useSavingsCommands";

// Hooks — Savings Transactions
export { useSavingsTransactions, useUndoSavingsTransaction, savingsTransactionKeys } from "./hooks/useSavingsTransactions";

// Hooks — Fixed Deposit Transactions
export { useFixedDepositTransactions, useUndoFixedDepositTransaction, fdTransactionKeys } from "./hooks/useFixedDepositTransactions";

