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
} from "./types/deposit";

export {
    SAVINGS_STATUS_LABELS,
    SAVINGS_STATUS_CONFIG,
    DEPOSIT_ACCOUNTS_PAGE_SIZE,
    DEPOSIT_SEARCH_DEBOUNCE_MS,
    DEPOSIT_TYPE_LABELS,
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
    useRecurringDepositAccounts,
    useRecurringDepositAccount,
} from "./hooks/useRecurringDeposits";
