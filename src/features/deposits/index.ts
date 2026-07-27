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
  RECURRING_DEPOSIT_FREQUENCY_TYPES,
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
} from "./schemas/deposit.schema";
export type {
  CreateSavingsAccountFormValues,
  DepositTransactionFormValues,
  CreateSavingsProductFormValues,
  CreateRecurringDepositAccountFormValues,
  CreateRecurringDepositProductFormValues,
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
  fixedDepositCommand,
  fetchFixedDepositProducts,
  fetchFixedDepositProduct,
  createFixedDepositProduct,
  updateFixedDepositProduct,
  fetchRecurringDepositAccounts,
  fetchRecurringDepositAccount,
  createRecurringDepositAccount,
  updateRecurringDepositAccount,
  deleteRecurringDepositAccount,
  fetchRecurringDepositAccountTemplate,
  recurringDepositCommand,
  approveRecurringDeposit,
  activateRecurringDeposit,
  closeRecurringDeposit,
  prematureCloseRecurringDeposit,
  rejectRecurringDeposit,
  withdrawRecurringDeposit,
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
  createSavingsProduct,
  updateSavingsProduct,
  deleteSavingsProduct,
} from "./api/deposit";

export { useSavingsAccounts, useSavingsAccount, depositKeys } from "./hooks/useSavingsAccounts";

export { useSavingsProducts, useSavingsProduct } from "./hooks/useSavingsProducts";

export { useSavingsTemplate } from "./hooks/useSavingsTemplate";

export { useCreateSavingsAccount } from "./hooks/useCreateSavingsAccount";

export { useUpdateSavingsAccount } from "./hooks/useUpdateSavingsAccount";

export { useMakeDeposit, useMakeWithdrawal } from "./hooks/useDepositWithdraw";

export { useFixedDepositAccounts, useFixedDepositAccount } from "./hooks/useFixedDeposits";

export {
  useFixedDepositProducts,
  useFixedDepositProduct,
  useCreateFixedDepositProduct,
  useUpdateFixedDepositProduct,
  useDeleteFixedDepositProduct,
} from "./hooks/useFixedDepositProducts";

export { useRecurringDepositAccounts, useRecurringDepositAccount } from "./hooks/useRecurringDeposits";

export {
  useCreateRecurringDepositAccount,
  useUpdateRecurringDepositAccount,
  useDeleteRecurringDepositAccount,
  useRecurringDepositCommand,
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
  undoRecurringDepositTransaction,
  makeRecurringDepositTransaction,
} from "./api/deposit";
export type { RecurringDepositTransaction } from "./api/deposit";

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
  undoRejectSavingsAccount,
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
export {
  fetchSavingsTransactions,
  adjustSavingsTransaction,
  searchTransactions,
} from "./api/deposit";
export type { TransactionSearchParams } from "./api/deposit";

// API — Fixed Deposit Transactions
export {
  fetchFixedDepositTransactions,
  undoFixedDepositTransaction,
  makeFixedDepositTransaction,
} from "./api/deposit";
export type { FixedDepositTransaction } from "./api/deposit";

// API — Fixed Deposit
export {
  fetchFixedDepositAccountTemplate,
  fetchFixedDepositClosureTemplate,
  calculateFixedDepositInterest,
  fetchFixedDepositCharges,
  createFixedDepositCharge,
  waiveFixedDepositCharge,
  deleteFixedDepositCharge,
} from "./api/deposit";
export type {
  FixedDepositAccountTemplate,
  FixedDepositClosureTemplate,
  CalculateFDInterestQuery,
  CalculateFDInterestResponse,
  FixedDepositCharge,
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
  useUndoRejectSavingsAccount,
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
export { savingsTransactionKeys } from "./hooks/useSavingsTransactions";

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
export type {
  InterestRateChart,
  InterestRateChartSlab,
  InterestRateChartTemplate,
} from "./api/deposit";

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
