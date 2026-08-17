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
  RecurringDepositListParams,
  RecurringDepositAccountCreateRequest,
  RecurringDepositProduct,
  RecurringDepositProductCreateRequest,
  SavingsProductCreateRequest,
  DepositAccountType,
  FixedDepositProduct,
  FixedDepositProductCreateRequest,
  FixedDepositAccountCreateRequest,
} from "./types/deposit";

export {
  SAVINGS_STATUS_LABELS,
  SAVINGS_STATUS_CONFIG,
  DEPOSIT_ACCOUNTS_PAGE_SIZE,
  DEPOSIT_SEARCH_DEBOUNCE_MS,
  DEPOSIT_TYPE_LABELS,
  DEPOSIT_PERIOD_FREQUENCIES,
  FIXED_DEPOSIT_STATUS_CONFIG,
  RECURRING_DEPOSIT_STATUS_CONFIG,
  PRE_CLOSURE_PENALTY_TYPES,
  CHART_SLAB_PERIOD_TYPES,
  ACCOUNTING_RULES,
} from "./constants/status";

export {
  createSavingsAccountSchema,
  depositTransactionSchema,
  createSavingsProductSchema,
  createRecurringDepositAccountSchema,
  createRecurringDepositProductSchema,
  holdAmountSchema,
} from "./schemas/deposit.schema";
export type {
  CreateSavingsAccountFormValues,
  DepositTransactionFormValues,
  CreateSavingsProductFormValues,
  CreateRecurringDepositAccountFormValues,
  CreateRecurringDepositProductFormValues,
  HoldAmountFormValues,
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
  updateFixedDepositAccount,
  approveFixedDeposit,
  activateFixedDeposit,
  closeFixedDeposit,
  prematureCloseFixedDeposit,
  rejectFixedDeposit,
  withdrawFixedDeposit,
  undoApprovalFixedDeposit,
  undoActivationFixedDeposit,
  calculatePrematureAmount,
  calculateInterestFixedDeposit,
  postInterestFixedDeposit,
  fixedDepositCommand,
  fetchFixedDepositProducts,
  fetchFixedDepositProduct,
  createFixedDepositProduct,
  updateFixedDepositProduct,
  fetchFixedDepositProductTemplate,
  fetchRecurringDepositAccounts,
  fetchRecurringDepositAccount,
  createRecurringDepositAccount,
  updateRecurringDepositAccount,
  deleteRecurringDepositAccount,
  fetchRecurringDepositAccountTemplate,
  fetchRecurringDepositProductTemplate,
  recurringDepositCommand,
  approveRecurringDeposit,
  activateRecurringDeposit,
  closeRecurringDeposit,
  prematureCloseRecurringDeposit,
  rejectRecurringDeposit,
  withdrawRecurringDeposit,
  undoApprovalRecurringDeposit,
  calculateInterestRecurringDeposit,
  postInterestRecurringDeposit,
  calculatePrematureAmountRecurringDeposit,
  updateDepositAmountRecurringDeposit,
  fetchRecurringDepositProducts,
  fetchRecurringDepositProduct,
  createRecurringDepositProduct,
  updateRecurringDepositProduct,
  deleteRecurringDepositProduct,
  fetchSavingsProducts,
  fetchSavingsProduct,
  fetchSavingsProductTemplate,
  fetchSavingsProductWithTemplate,
  createSavingsProduct,
  updateSavingsProduct,
  deleteSavingsProduct,
} from "./api/deposit";
export type { SavingsProductTemplate } from "./api/deposit";

export { useSavingsAccounts, useSavingsAccount, depositKeys } from "./hooks/useSavingsAccounts";

export { useSavingsProducts, useSavingsProduct, useSavingsProductTemplate } from "./hooks/useSavingsProducts";

export { useSavingsTemplate } from "./hooks/useSavingsTemplate";

export { useCreateSavingsAccount } from "./hooks/useCreateSavingsAccount";

export { useUpdateSavingsAccount } from "./hooks/useUpdateSavingsAccount";

export { useMakeDeposit, useMakeWithdrawal } from "./hooks/useDepositWithdraw";

export {
  useFixedDepositAccounts,
  useFixedDepositAccount,
  useDeleteFixedDepositAccount,
  useUpdateFixedDepositAccount,
  useFixedDepositCommand,
} from "./hooks/useFixedDeposits";

export {
  useFixedDepositProducts,
  useFixedDepositProduct,
  useCreateFixedDepositProduct,
  useUpdateFixedDepositProduct,
  useDeleteFixedDepositProduct,
} from "./hooks/useFixedDepositProducts";

export {
  useRecurringDepositAccounts,
  useRecurringDepositAccount,
  useCreateRecurringDepositAccount,
  useUpdateRecurringDepositAccount,
  useDeleteRecurringDepositAccount,
  useRecurringDepositCommand,
  useRecurringDepositClosureTemplate,
} from "./hooks/useRecurringDeposits";

export {
  useRecurringDepositProducts,
  useRecurringDepositProduct,
  useCreateRecurringDepositProduct,
  useUpdateRecurringDepositProduct,
  useDeleteRecurringDepositProduct,
} from "./hooks/useRecurringDepositProducts";

export { useRecurringDepositTemplate } from "./hooks/useRecurringDepositTemplate";

export {
  useRecurringDepositTransactions,
  useUndoRecurringDepositTransaction,
  useMakeRecurringDepositTransaction,
  rdTransactionKeys,
} from "./hooks/useRecurringDepositTransactions";

// API — Recurring Deposit Transactions
export {
  fetchRecurringDepositTransactions,
  fetchRecurringDepositTransaction,
  fetchRecurringDepositTransactionTemplate,
  fetchRecurringDepositTransactionTemplate2,
  modifyRecurringDepositTransaction,
  undoRecurringDepositTransaction,
  makeRecurringDepositTransaction,
  fetchRecurringDepositAccountForEdit,
  fetchRecurringDepositClosureTemplate,
  fetchRecurringDepositChargesTemplate,
  createRecurringDepositCharge,
  updateRecurringDepositCharge,
  payRecurringDepositCharge,
  waiveRecurringDepositCharge,
  deleteRecurringDepositCharge,
  fetchChargeDefinition,
  updateRecurringDepositWithHoldTax,
  fetchStandingInstructions,
  fetchStandingInstructionTemplate,
  createStandingInstruction,
  fetchStandingInstruction,
  fetchStandingInstructionForEdit,
  updateStandingInstruction,
  deleteStandingInstruction,
  fetchStandingInstructionTransactions,
  fetchAccountTransferTemplate,
  createAccountTransfer,
  fetchAccountTransfer,
  undoAccountTransfer,
} from "./api/deposit";
export type {
  RecurringDepositTransaction,
  RecurringDepositClosureTemplate,
  StandingInstruction,
  StandingInstructionListResponse,
  StandingInstructionTemplate,
  AccountTransferTemplate,
} from "./api/deposit";

// API — Savings Charges
export {
  fetchSavingsCharges,
  fetchSavingsChargesTemplate,
  createSavingsCharge,
  waiveSavingsCharge,
  paySavingsCharge,
  deleteSavingsCharge,
} from "./api/deposit";
export type {
  SavingsCharge,
  SavingsChargeListResponse,
  PostSavingsChargeRequest,
  SavingsChargesTemplate,
} from "./api/deposit";

// API — Savings Commands
export {
  rejectSavingsAccount,
  withdrawSavingsAccount,
  calculateInterestSavings,
  postInterestSavings,
  blockSavingsAccount,
  unblockSavingsAccount,
  blockCreditSavingsAccount,
  unblockCreditSavingsAccount,
  blockDebitSavingsAccount,
  unblockDebitSavingsAccount,
  holdAmountSavings,
  releaseAmountSavings,
  fetchOnHoldTransactions,
  undoApproveSavingsAccount,
  forceWithdrawalSavings,
  applyAnnualFeesSavings,
  assignSavingsOfficer,
  unassignSavingsOfficer,
} from "./api/deposit";
export type { OnHoldTransaction } from "./api/deposit";

// API — Savings Transactions
export { adjustSavingsTransaction, searchTransactions } from "./api/deposit";
export type { TransactionSearchParams } from "./api/deposit";

// API — Fixed Deposit Transactions
export { fetchFixedDepositTransactions, undoFixedDepositTransaction, makeFixedDepositTransaction } from "./api/deposit";
export type { FixedDepositTransaction } from "./api/deposit";

// API — Fixed Deposit
export {
  fetchFixedDepositAccountTemplate,
  fetchFixedDepositClosureTemplate,
  calculateFixedDepositInterest,
  fetchFixedDepositCharges,
  fetchFixedDepositChargesTemplate,
  createFixedDepositCharge,
  waiveFixedDepositCharge,
  deleteFixedDepositCharge,
} from "./api/deposit";
export type {
  FixedDepositAccountTemplate,
  FixedDepositClosureTemplate,
  FixedDepositProductTemplate,
  CalculateFDInterestQuery,
  CalculateFDInterestResponse,
  FixedDepositCharge,
  RecurringDepositProductTemplate,
} from "./api/deposit";

// Hooks — Savings Charges
export {
  useSavingsCharges,
  useSavingsChargesTemplate,
  useCreateSavingsCharge,
  usePaySavingsCharge,
  useWaiveSavingsCharge,
  useDeleteSavingsCharge,
  savingsChargeKeys,
} from "./hooks/useSavingsCharges";

// Hooks — Savings Commands
export {
  useRejectSavingsAccount,
  useWithdrawSavingsAccount,
  useApproveSavingsAccount,
  useActivateSavingsAccount,
  useCloseSavingsAccount,
  useDeleteSavingsAccount,
  useUndoApproveSavingsAccount,
  useDeleteSavingsProduct,
  useForceWithdrawalSavings,
  useApplyAnnualFeesSavings,
  useAssignSavingsOfficer,
  useUnassignSavingsOfficer,
  useAdjustSavingsTransaction,
} from "./hooks/useSavingsCommands";

// Hooks — Savings Transactions
export {
  savingsTransactionKeys,
  useOnHoldTransactions,
  useSearchSavingsTransactions,
  useHoldAmountSavings,
  useReleaseAmountSavings,
} from "./hooks/useSavingsTransactions";

// Hooks — Savings Permissions
export { useSavingsPermissions, SAVINGS_ACTION_PERMISSIONS } from "./hooks/useSavingsPermissions";
export type { SavingsAction } from "./hooks/useSavingsPermissions";

// Hooks — Fixed Deposit Permissions
export { useFixedDepositPermissions, FIXED_DEPOSIT_ACTION_PERMISSIONS } from "./hooks/useFixedDepositPermissions";
export type { FixedDepositAction } from "./hooks/useFixedDepositPermissions";

// Hooks — Savings Transaction Undo
export {
  useUndoSavingsTransaction,
  useReverseSavingsTransaction,
  useModifySavingsTransaction,
} from "./hooks/useSavingsTransactionUndo";

// Hooks — Fixed Deposit Transactions
export {
  useFixedDepositTransactions,
  useUndoFixedDepositTransaction,
  useMakeFixedDepositTransaction,
  fdTransactionKeys,
} from "./hooks/useFixedDepositTransactions";

// API — Interest Rate Charts
export {
  fetchInterestRateCharts,
  fetchInterestRateChart,
  fetchInterestRateChartTemplate,
  createInterestRateChart,
  updateInterestRateChart,
  deleteInterestRateChart,
  fetchChartSlabs,
  fetchChartSlabTemplate,
  createChartSlab,
  updateChartSlab,
  deleteChartSlab,
} from "./api/deposit";
export type { InterestRateChart, InterestRateChartSlab, InterestRateChartTemplate } from "./api/deposit";

// Hooks — Interest Rate Charts
export {
  interestRateChartKeys,
  useInterestRateCharts,
  useInterestRateChart,
  useInterestRateChartTemplate,
  useCreateInterestRateChart,
  useUpdateInterestRateChart,
  useDeleteInterestRateChart,
  useChartSlabs,
  useCreateChartSlab,
  useUpdateChartSlab,
  useDeleteChartSlab,
} from "./hooks/useInterestRateCharts";

// ─── Pages ───────────────────────────────────────────────
export { default as AccountActionPage } from "./pages/AccountActionPage";
export { default as CreateDepositAccountPage } from "./pages/CreateDepositAccountPage";
export { default as CreateFixedDepositPage } from "./pages/CreateFixedDepositPage";
export { default as CreateRecurringDepositPage } from "./pages/CreateRecurringDepositPage";
export { default as DepositAccountDetailPage } from "./pages/DepositAccountDetailPage";
export { default as DepositAccountsPage } from "./pages/DepositAccountsPage";
export { default as FixedDepositDetailPage } from "./pages/FixedDepositDetailPage";
export { default as FixedDepositProductDetailPage } from "./pages/FixedDepositProductDetailPage";
export { default as FixedDepositProductFormPage } from "./pages/FixedDepositProductFormPage";
export { default as FixedDepositProductsPage } from "./pages/FixedDepositProductsPage";
export { default as FixedDepositsPage } from "./pages/FixedDepositsPage";
export { default as InterestRateChartFormPage } from "./pages/InterestRateChartFormPage";
export { default as InterestRateChartListPage } from "./pages/InterestRateChartListPage";
export { default as RecurringDepositDetailPage } from "./pages/RecurringDepositDetailPage";
export { default as RecurringDepositProductDetailPage } from "./pages/RecurringDepositProductDetailPage";
export { default as RecurringDepositProductFormPage } from "./pages/RecurringDepositProductFormPage";
export { default as RecurringDepositProductsPage } from "./pages/RecurringDepositProductsPage";
export { default as RecurringDepositsPage } from "./pages/RecurringDepositsPage";
export { default as SavingsProductDetailPage } from "./pages/SavingsProductDetailPage";
export { default as SavingsProductFormPage } from "./pages/SavingsProductFormPage";
export { default as SavingsProductsPage } from "./pages/SavingsProductsPage";
export { default as SavingsTransactionFormPage } from "./pages/SavingsTransactionFormPage";
