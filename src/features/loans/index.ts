// ─── Loans Feature ──────────────────────────────────────────

export type {
  Loan,
  LoanStatus,
  LoanProduct,
  LoanTimeline,
  LoanSummary,
  LoanRepaymentPeriod,
  LoanRepaymentSchedule,
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
  LoanProductTemplate,
  AmortizationType,
  InterestType as LoanInterestType,
  InterestCalculationPeriodType,
  RepaymentFrequency,
  LoanTransactionType,
  Fund,
  LoanCharge,
  LoanChargeTemplate,
  LoanChargeCreateRequest,
  LoanChargeUpdateRequest,
  LoanChargeCommandRequest,
  LoanCollateral,
  LoanCollateralTemplate,
  LoanCollateralCreateRequest,
  LoanGuarantor,
  LoanGuarantorCreateRequest,
  LoanDelinquentData,
  LoanDelinquencyTag,
  LoanRescheduleRequest,
  RescheduleLoanTemplate,
  RescheduleLoanCreateRequest,
  RescheduleLoanCommandRequest,
  CalculateLoanScheduleRequest,
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

export {
  LOAN_COMMANDS,
  LOAN_TRANSACTION_COMMANDS,
  TRANSACTION_COMMAND_LABELS,
  TRANSACTION_AMOUNT_COMMANDS,
  TRANSACTION_PAYMENT_TYPE_COMMANDS,
  TRANSACTION_PAYMENT_DETAILS_COMMANDS,
  TRANSACTION_NO_DATE_COMMANDS,
  TRANSACTION_DESTRUCTIVE_COMMANDS,
  RESCHEDULE_STATUS_CONFIG,
  RESCHEDULE_STATUS_ID_MAP,
} from "./constants/transactions";

export {
  createLoanSchema,
  createLoanProductSchema,
  createLoanChargeSchema,
  payLoanChargeSchema,
  createLoanCollateralSchema,
  createLoanGuarantorSchema,
  createRescheduleRequestSchema,
  createLoanTransactionSchema,
} from "./schemas/loan.schema";
export type {
  CreateLoanFormValues,
  CreateLoanProductFormValues,
  CreateLoanChargeFormValues,
  PayLoanChargeFormValues,
  CreateLoanCollateralFormValues,
  CreateLoanGuarantorFormValues,
  CreateRescheduleRequestFormValues,
  CreateLoanTransactionFormValues,
} from "./schemas/loan.schema";

export {
  fetchLoans,
  fetchLoan,
  fetchLoanByExternalId,
  fetchLoanTemplate,
  createLoan,
  updateLoan,
  deleteLoan,
  approveLoan,
  disburseLoan,
  disburseLoanToSavings,
  rejectLoan,
  closeLoan,
  undoApproval,
  undoDisbursal,
  fetchRepaymentTemplate,
  fetchRepaymentSchedule,
  fetchLoanTransactions,
  fetchLoanProducts,
  fetchLoanProduct,
  fetchLoanProductTemplate,
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
  calculateLoanSchedule,
  fetchDelinquencyTags,
} from "./api/loan";

export {
  fetchLoanCharges,
  fetchLoanCharge,
  fetchLoanChargeTemplate,
  addLoanCharge,
  updateLoanCharge,
  deleteLoanCharge,
  loanChargeCommand,
} from "./api/loanCharges";

export {
  fetchLoanCollateral,
  fetchCollateralTemplate,
  addLoanCollateral,
  updateLoanCollateral,
  deleteLoanCollateral,
} from "./api/loanCollateral";

export {
  fetchLoanGuarantors,
  addLoanGuarantor,
  updateLoanGuarantor,
  deleteLoanGuarantor,
} from "./api/loanGuarantors";

export {
  fetchRescheduleTemplate,
  fetchRescheduleRequests,
  fetchRescheduleRequest,
  createRescheduleRequest,
  rescheduleRequestCommand,
} from "./api/rescheduleLoans";

export { toIsoDate, formatFineractDate, formatMoney } from "./utils/format";

export { useLoans, loanKeys } from "./hooks/useLoans";

export { useLoan, useLoanByExternalId } from "./hooks/useLoan";

export { useLoanProducts, useLoanProduct, useLoanProductTemplate, useDeleteLoanProduct } from "./hooks/useLoanProducts";

export { useLoanTemplate } from "./hooks/useLoanTemplate";

export { useCreateLoan } from "./hooks/useCreateLoan";

export { useDeleteLoan } from "./hooks/useDeleteLoan";

export {
  useApproveLoan,
  useDisburseLoan,
  useDisburseLoanToSavings,
  useRejectLoan,
  useWithdrawLoan,
  useCloseLoan,
  useUndoApproval,
  useUndoDisbursal,
  useLoanTransactionCommand,
} from "./hooks/useLoanCommands";

export { useUpdateLoan } from "./hooks/useUpdateLoan";

export { useRepaymentSchedule } from "./hooks/useRepaymentSchedule";

export { useTransactionTemplate } from "./hooks/useTransactionTemplate";

export { useDelinquencyTags } from "./hooks/useDelinquencyTags";

export {
  useLoanCharges,
  useLoanChargeTemplate,
  useAddLoanCharge,
  useUpdateLoanCharge,
  useDeleteLoanCharge,
  useLoanChargeCommand,
} from "./hooks/useLoanCharges";

export {
  useLoanCollateral,
  useCollateralTemplate,
  useAddLoanCollateral,
  useUpdateLoanCollateral,
  useDeleteLoanCollateral,
} from "./hooks/useLoanCollateral";

export {
  useLoanGuarantors,
  useAddLoanGuarantor,
  useUpdateLoanGuarantor,
  useDeleteLoanGuarantor,
} from "./hooks/useLoanGuarantors";

export {
  rescheduleLoanKeys,
  useRescheduleTemplate,
  useRescheduleRequests,
  useRescheduleRequest,
  useCreateRescheduleRequest,
  useRescheduleRequestCommand,
} from "./hooks/useRescheduleLoans";

export { useFunds } from "./hooks/useFunds";

// ─── Pages ─────────────────────────────────────────────────
export { default as LoansListPage } from "./pages/LoansListPage";
export { default as LoanFormPage } from "./pages/LoanFormPage";
export { default as LoanViewPage } from "./pages/LoanViewPage";
export { default as LoanTransactionFormPage } from "./pages/LoanTransactionFormPage";
export { default as RescheduleLoansPage } from "./pages/RescheduleLoansPage";
export { default as RescheduleLoanFormPage } from "./pages/RescheduleLoanFormPage";

// ─── Components ────────────────────────────────────────────
export { default as LoanTable } from "./components/LoanTable";
export { default as LoanFilters } from "./components/LoanFilters";
export { default as LoanForm } from "./components/LoanForm";
export { default as LoanDetails } from "./components/LoanDetails";
export { default as LoanCommands } from "./components/LoanCommands";
export { default as LoanStatusBadge } from "./components/LoanStatusBadge";
export { default as LoanTransactionsTable } from "./components/LoanTransactionsTable";
export { default as LoanScheduleTable } from "./components/LoanScheduleTable";
export { default as LoanChargesCard } from "./components/LoanChargesCard";
export { default as LoanCollateralCard } from "./components/LoanCollateralCard";
export { default as LoanGuarantorsCard } from "./components/LoanGuarantorsCard";
export { default as LoanDelinquencyCard } from "./components/LoanDelinquencyCard";
export { default as LoanTransactionForm } from "./components/LoanTransactionForm";
export type { TransactionFormValues } from "./components/LoanTransactionForm";
