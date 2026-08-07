import i18n from "@/i18n";

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
  // Template-only command: GET .../transactions/template?command=prepayLoan
  // returns the total outstanding. The actual POST must use `repayment`.
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
  approve: i18n.t("Approve"),
  disburse: i18n.t("Disburse"),
  disburseToSavings: i18n.t("Disburse to Savings"),
  reject: i18n.t("Reject"),
  withdrawnByApplicant: i18n.t("Withdraw by Applicant"),
  undoDisbursal: i18n.t("Undo Disbursal"),
  // transaction commands
  repayment: i18n.t("Repayment"),
  recoverypayment: i18n.t("Recovery Repayment"),
  prepayLoan: i18n.t("Prepay Loan"),
  downPayment: i18n.t("Down Payment"),
  waiveinterest: i18n.t("Waive Interest"),
  interestPaymentWaiver: i18n.t("Interest Payment Waiver"),
  "interest-refund": i18n.t("Interest Refund"),
  writeoff: i18n.t("Write Off"),
  "charge-off": i18n.t("Charge Off"),
  "undo-charge-off": i18n.t("Undo Charge Off"),
  foreclosure: i18n.t("Foreclosure"),
  close: i18n.t("Close Loan"),
  "close-rescheduled": i18n.t("Close (Rescheduled)"),
  refundbycash: i18n.t("Refund by Cash"),
  refundbytransfer: i18n.t("Refund by Transfer"),
  creditBalanceRefund: i18n.t("Credit Balance Refund"),
  goodwillCredit: i18n.t("Goodwill Credit"),
  payoutRefund: i18n.t("Payout Refund"),
  merchantIssuedRefund: i18n.t("Merchant Issued Refund"),
  reAge: i18n.t("Re-Age Loan"),
  undoReAge: i18n.t("Undo Re-Age"),
  reAmortize: i18n.t("Re-Amortize"),
  undoReAmortize: i18n.t("Undo Re-Amortize"),
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

/**
 * Commands that do not require any date input. Per doc §7.14 the following
 * commands all require a `transactionDate` (and sometimes more), so they are
 * intentionally NOT in this set:
 *   - reAge, undoReAge, reAmortize, undoReAmortize
 *     (doc §7.14: `transactionDate` is mandatory)
 */
export const TRANSACTION_NO_DATE_COMMANDS = new Set([
  "undoDisbursal",
  "undo-charge-off",
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
  "Submitted and pending approval": { variant: "info", label: i18n.t("Pending") },
  Approved: { variant: "success", label: i18n.t("Approved") },
  Rejected: { variant: "error", label: i18n.t("Rejected") },
};

export const RESCHEDULE_STATUS_ID_MAP: Record<number, string> = {
  100: "Submitted and pending approval",
  200: "Approved",
  500: "Rejected",
};
