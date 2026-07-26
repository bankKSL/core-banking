export type LockOwner = "LOAN_COB_CHUNK_PROCESSING" | "LOAN_INLINE_COB_PROCESSING";

export interface JobNamesResponse {
  businessJobs: string[];
}

export interface AvailableStep {
  stepName: string;
  stepDescription: string;
}

export interface AvailableStepsResponse {
  jobName: string;
  availableBusinessSteps: AvailableStep[];
}

export interface StepConfigEntry {
  stepName: string;
  order: number;
}

export interface StepConfigResponse {
  jobName: string;
  businessSteps: StepConfigEntry[];
}

export interface UpdateStepsRequest {
  businessSteps: { stepName: string; order: number }[];
}

export interface OldestCOBClosedResponse {
  loanIds: number[];
  cobProcessedDate: string;
  cobBusinessDate: string;
}

export interface IsCatchUpRunningResponse {
  isCatchUpRunning: boolean;
  processingDate: string | null;
}

export interface LoanAccountLock {
  loanId: number;
  version: number;
  lockOwner: LockOwner;
  lockPlacedOn: string;
  lockPlacedOnCobBusinessDate: string;
  error: string | null;
  stacktrace: string | null;
}

export interface LockedLoansResponse {
  page: number;
  limit: number;
  content: LoanAccountLock[];
}

export type CatchUpResult = 200 | 202 | 400;

export const BUSINESS_STEP_LABELS: Record<string, string> = {
  CHECK_DUE_INSTALLMENTS: "Check Due Installments",
  CHECK_LOAN_REPAYMENT_DUE: "Check Loan Repayment Due",
  CHECK_LOAN_REPAYMENT_OVERDUE: "Check Loan Repayment Overdue",
  APPLY_CHARGE_TO_OVERDUE_LOANS: "Apply Charge To Overdue Loans",
  ADD_PERIODIC_ACCRUAL_ENTRIES: "Add Periodic Accrual Entries",
  ACCRUAL_ACTIVITY_POSTING: "Accrual Activity Posting",
  UPDATE_LOAN_ARREARS_AGING: "Update Loan Arrears Aging",
  SET_LOAN_DELINQUENCY_TAGS: "Set Loan Delinquency Tags",
  LOAN_INTEREST_RECALCULATION: "Loan Interest Recalculation",
  BUY_DOWN_FEE_AMORTIZATION: "Buy Down Fee Amortization",
  CAPITALIZED_INCOME_AMORTIZATION: "Capitalized Income Amortization",
};

export const DEFAULT_BUSINESS_STEP_ORDER: { stepName: string; order: number }[] = [
  { stepName: "CHECK_DUE_INSTALLMENTS", order: 1 },
  { stepName: "CHECK_LOAN_REPAYMENT_DUE", order: 2 },
  { stepName: "CHECK_LOAN_REPAYMENT_OVERDUE", order: 3 },
  { stepName: "APPLY_CHARGE_TO_OVERDUE_LOANS", order: 4 },
  { stepName: "ADD_PERIODIC_ACCRUAL_ENTRIES", order: 5 },
  { stepName: "ACCRUAL_ACTIVITY_POSTING", order: 6 },
  { stepName: "UPDATE_LOAN_ARREARS_AGING", order: 7 },
  { stepName: "SET_LOAN_DELINQUENCY_TAGS", order: 8 },
  { stepName: "LOAN_INTEREST_RECALCULATION", order: 9 },
  { stepName: "BUY_DOWN_FEE_AMORTIZATION", order: 10 },
  { stepName: "CAPITALIZED_INCOME_AMORTIZATION", order: 11 },
];
