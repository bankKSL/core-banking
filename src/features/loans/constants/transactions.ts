/**
 * Loan transaction commands (POST /loans/{loanId}/transactions?command=...)
 * and state commands (POST /loans/{loanId}?command=...) per spec.
 */

// ─── Loan state commands ─────────────────────────────────────────

export const LOAN_COMMANDS = {
  APPROVE: "approve",
  UNDO_APPROVAL: "undoapproval",
  REJECT: "reject",
  WITHDRAWN_BY_APPLICANT: "withdrawnByApplicant",
  DISBURSE: "disburse",
  DISBURSE_TO_SAVINGS: "disburseToSavings",
  UNDO_DISBURSAL: "undodisbursal",
} as const;

// ─── Loan transaction commands ───────────────────────────────────

export const LOAN_TRANSACTION_COMMANDS = {
  REPAYMENT: "repayment",
  WAIVE_INTEREST: "waiveinterest",
  INTEREST_PAYMENT_WAIVER: "interestPaymentWaiver",
  WRITE_OFF: "writeoff",
  CLOSE: "close",
  CLOSE_RESCHEDULED: "close-rescheduled",
  RECOVERY_REPAYMENT: "recoverypayment",
  PREPAY_LOAN: "prepayLoan",
  FORECLOSURE: "foreclosure",
  REFUND_BY_CASH: "refundbycash",
  REFUND_BY_TRANSFER: "refundbytransfer",
  CREDIT_BALANCE_REFUND: "creditBalanceRefund",
  GOODWILL_CREDIT: "goodwillCredit",
  PAYOUT_REFUND: "payoutRefund",
  MERCHANT_ISSUED_REFUND: "merchantIssuedRefund",
  CHARGE_OFF: "charge-off",
  UNDO_CHARGE_OFF: "undo-charge-off",
  DOWN_PAYMENT: "downPayment",
  INTEREST_REFUND: "interest-refund",
  RE_AGE: "reAge",
  UNDO_RE_AGE: "undoReAge",
  RE_AMORTIZE: "reAmortize",
  UNDO_RE_AMORTIZE: "undoReAmortize",
} as const;

/** Human labels for every command handled by the transaction form page */
export const TRANSACTION_COMMAND_LABELS: Record<string, string> = {
  // state commands routed through the transaction form page
  approve: "Approve",
  disburse: "Disburse",
  disburseToSavings: "Disburse to Savings",
  reject: "Reject",
  withdrawnByApplicant: "Withdraw by Applicant",
  undoDisbursal: "Undo Disbursal",
  // transaction commands
  repayment: "Repayment",
  recoverypayment: "Recovery Repayment",
  prepayLoan: "Prepay Loan",
  downPayment: "Down Payment",
  waiveinterest: "Waive Interest",
  interestPaymentWaiver: "Interest Payment Waiver",
  "interest-refund": "Interest Refund",
  writeoff: "Write Off",
  "charge-off": "Charge Off",
  "undo-charge-off": "Undo Charge Off",
  foreclosure: "Foreclosure",
  close: "Close Loan",
  "close-rescheduled": "Close (Rescheduled)",
  refundbycash: "Refund by Cash",
  refundbytransfer: "Refund by Transfer",
  creditBalanceRefund: "Credit Balance Refund",
  goodwillCredit: "Goodwill Credit",
  payoutRefund: "Payout Refund",
  merchantIssuedRefund: "Merchant Issued Refund",
  reAge: "Re-Age Loan",
  undoReAge: "Undo Re-Age",
  reAmortize: "Re-Amortize",
  undoReAmortize: "Undo Re-Amortize",
};

/** Commands that require a transaction amount input */
export const TRANSACTION_AMOUNT_COMMANDS = new Set([
  "repayment",
  "recoverypayment",
  "prepayLoan",
  "downPayment",
  "disburse",
  "waiveinterest",
  "interestPaymentWaiver",
  "interest-refund",
  "refundbycash",
  "refundbytransfer",
  "creditBalanceRefund",
  "goodwillCredit",
  "payoutRefund",
  "merchantIssuedRefund",
]);

/** Commands that offer a payment-type select */
export const TRANSACTION_PAYMENT_TYPE_COMMANDS = new Set([
  "repayment",
  "recoverypayment",
  "prepayLoan",
  "downPayment",
  "disburse",
  "refundbycash",
  "refundbytransfer",
  "creditBalanceRefund",
  "goodwillCredit",
  "merchantIssuedRefund",
]);

/** Commands that show the extended payment details section */
export const TRANSACTION_PAYMENT_DETAILS_COMMANDS = new Set(["repayment", "recoverypayment", "prepayLoan"]);

/** Commands that do not require any date input */
export const TRANSACTION_NO_DATE_COMMANDS = new Set([
  "undoDisbursal",
  "undo-charge-off",
  "undoReAge",
  "undoReAmortize",
  "reAge",
  "reAmortize",
]);

/** Commands rendered as destructive (red) submit buttons */
export const TRANSACTION_DESTRUCTIVE_COMMANDS = new Set([
  "writeoff",
  "charge-off",
  "foreclosure",
  "close",
  "close-rescheduled",
  "undoDisbursal",
  "undo-charge-off",
]);

// ─── Reschedule request status ───────────────────────────────────

export const RESCHEDULE_STATUS_CONFIG: Record<
  string,
  { variant: "success" | "warning" | "error" | "info" | "default"; label: string }
> = {
  "Submitted and pending approval": { variant: "info", label: "Pending" },
  Approved: { variant: "success", label: "Approved" },
  Rejected: { variant: "error", label: "Rejected" },
};

export const RESCHEDULE_STATUS_ID_MAP: Record<number, string> = {
  100: "Submitted and pending approval",
  200: "Approved",
  500: "Rejected",
};
