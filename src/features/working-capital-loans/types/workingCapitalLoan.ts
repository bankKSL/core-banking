export type WCLoanStatus = "Submitted and pending approval" | "Approved" | "Active" | "Closed" | "Rejected";

export interface CodeName {
  id: number;
  value: string;
  code?: string;
}

/** Fineract enum wire shape (StringEnumOptionData) or a plain string */
export type EnumValue = string | { id?: number | string; code?: string; value?: string; label?: string };

export interface DelinquencyRange {
  classification: string;
  minimumAgeDays: number;
  maximumAgeDays: number;
}

export interface DelinquencyBucket {
  id: number;
  name: string;
  bucketType?: string;
  ranges?: DelinquencyRange[];
}

export interface WCLoanProductAllowAttributeOverrides {
  discountDefault?: boolean;
  discountFee?: boolean;
  delinquencyBucketClassification?: boolean;
  [key: string]: unknown;
}

export interface WCLoanProduct {
  id: number;
  name: string;
  shortName?: string;
  description?: string;
  currency: {
    code: string;
    name: string;
    decimalPlaces: number;
    inMultiplesOf?: number;
    displaySymbol: string;
  };
  amortizationType: EnumValue;
  npvDayCount: number;
  principal: number;
  minPrincipal: number;
  maxPrincipal: number;
  periodPaymentRate: number;
  minPeriodPaymentRate: number;
  maxPeriodPaymentRate: number;
  repaymentEvery: number;
  repaymentFrequencyType: EnumValue;
  delinquencyBucketId?: number;
  delinquencyBucket?: { id: number; name?: string; bucketType?: unknown; ranges?: unknown[] };
  delinquencyGraceDays: number;
  delinquencyStartType: EnumValue;
  accountingRule: EnumValue;
  allowAttributeOverrides?: WCLoanProductAllowAttributeOverrides;
  externalId?: string;
}

export interface WCLoanProductCreateRequest {
  name: string;
  shortName?: string;
  description?: string;
  currencyCode: string;
  digitsAfterDecimal?: number;
  inMultiplesOf?: number;
  amortizationType: string;
  npvDayCount: number;
  principal: number;
  minPrincipal?: number;
  maxPrincipal?: number;
  periodPaymentRate: number;
  minPeriodPaymentRate?: number;
  maxPeriodPaymentRate?: number;
  repaymentEvery: number;
  repaymentFrequencyType: string;
  delinquencyBucketId: number;
  delinquencyGraceDays?: number;
  delinquencyStartType?: string;
  accountingRule?: string;
  paymentAllocation?: Array<{
    transactionType: string;
    paymentAllocationOrder: Array<{ paymentAllocationRule: string; order: number }>;
  }>;
  locale?: string;
  dateFormat?: string;
}

export interface WCLoanProductTemplate {
  currencyOptions?: Array<{
    code: string;
    name: string;
    decimalPlaces: number;
    displaySymbol?: string;
  }>;
  repaymentFrequencyTypeOptions?: Array<{ id: number; code: string; value: string }>;
  periodFrequencyTypeOptions?: Array<{ id: number; code: string; value: string }>;
  delinquencyBucketOptions?: Array<{ id: number; name: string }>;
  accountingRuleOptions?: Array<{ id: string; code: string; value: string }>;
  advancedPaymentAllocationTransactionTypes?: Array<{ id: number; code: string; value: string }>;
  advancedPaymentAllocationTypes?: Array<{ id: number; code: string; value: string }>;
  advancedPaymentAllocationFutureInstallmentAllocationRules?: Array<{ id: number; code: string; value: string }>;
}

export interface WCLoan {
  id: number;
  accountNo?: string;
  externalId?: string;
  status: {
    id: number;
    code: string;
    value: string;
    pendingApproval?: boolean;
    waitingForDisbursal?: boolean;
    active?: boolean;
    closedObligationsMet?: boolean;
  };
  clientId: number;
  clientName?: string;
  loanProductId: number;
  loanProductName: string;
  principal: number;
  approvedPrincipal?: number;
  totalOutstanding?: number;
  totalPrincipalPaid?: number;
  summary?: WCLoanSummary;
  balance?: WCLoanBalance;
  timeline: WCLoanTimeline;
  delinquencyBucketId?: number;
  delinquencyBucket?: { id: number; name?: string; bucketType?: unknown; ranges?: unknown[] };
  delinquencyGraceDays?: number;
  delinquencyStartType?: EnumValue;
  delinquent?: {
    delinquentDays?: number;
    delinquentAmount?: number;
    lastPaymentDate?: string | number[];
    installmentLevelDelinquency?: WCLoanInstallmentLevelDelinquency[];
  };
  delinquencyRange?: { id: number; classification: string; minimumAgeDays: number; maximumAgeDays: number };
  proposedPrincipal?: number;
  netDisbursalAmount?: number;
  totalPaymentVolume?: number;
  paymentRate?: number;
  discountFee?: number;
  fraud?: boolean | null;
  chargedOff?: boolean | null;
  chargedOffOnDate?: string | number[] | null;
  transactions?: WCLoanTransaction[];
}

export interface WCLoanInstallmentLevelDelinquency {
  rangeId?: number;
  classification?: string;
  minimumAgeDays?: number;
  maximumAgeDays?: number;
  delinquentAmount?: number;
}

export interface WCLoanBalance {
  totalOutstanding?: number;
  totalRepayment?: number;
  totalPrincipalOutstanding?: number;
  totalPrincipalDue?: number;
  totalInterestOutstanding?: number;
  totalInterestDue?: number;
  totalOverdue?: number;
}

export interface WCLoanSummary {
  currency: { code: string; name: string; decimalPlaces: number; displaySymbol: string };
  principalDisbursed?: number;
  totalDisbursement?: number;
  principalPaid: number;
  principalOutstanding: number;
  interestOutstanding?: number;
  interestPaid?: number;
  totalOutstanding: number;
  totalRepayment: number;
}

export interface WCLoanTimeline {
  submittedOnDate?: string | number[];
  expectedDisbursementDate?: string | number[];
  actualDisbursementDate?: string | number[];
  approvedOnDate?: string | number[];
  closedOnDate?: string | number[];
}

export interface WCLoanTransaction {
  id: number;
  type: { id: number; code: string; value: string };
  date?: string | number[];
  transactionDate?: string | number[];
  currency: { code: string; displaySymbol: string };
  amount?: number;
  transactionAmount?: number;
  principalPortion?: number;
  feeChargesPortion?: number;
  penaltyChargesPortion?: number;
  overpaymentPortion?: number;
  interestPortion?: number;
  outstandingLoanBalance?: number;
  externalId?: string | null;
  reversed?: boolean;
  reversalExternalId?: string | null;
  reversedOnDate?: string | number[] | null;
  classification?: { id: number; name: string } | null;
  paymentDetailData?: {
    paymentType?: { id: number; name: string };
  } | null;
}

export interface WCLoanCreateRequest {
  clientId: number;
  productId: number;
  principalAmount: number;
  totalPaymentVolume: number;
  periodPaymentRate: number;
  discount: number;
  submittedOnDate: string;
  expectedDisbursementDate: string;
  delinquencyBucketId?: number;
  delinquencyGraceDays?: number;
  delinquencyStartType?: string;
  locale?: string;
  dateFormat?: string;
}

export interface WCLoanCommandRequest {
  approvedOnDate?: string;
  approvedLoanAmount?: number;
  expectedDisbursementDate?: string;
  actualDisbursementDate?: string;
  transactionAmount?: number;
  transactionDate?: string;
  paymentTypeId?: number;
  note?: string;
  locale?: string;
  dateFormat?: string;
}

export interface WCLoanCommandResponse {
  officeId: number;
  clientId: number;
  loanId: number;
  resourceId?: number;
  loanExternalId?: string;
  changes?: Record<string, unknown>;
}

export interface WCLoanListParams {
  clientId?: number;
  externalId?: string;
  status?: string;
  accountNo?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface WCLoanListResponse {
  totalElements?: number;
  totalPages?: number;
  content?: WCLoan[];
  pageItems?: WCLoan[];
}

export interface WCLoanTemplate {
  clientId?: number;
  clientName?: string;
  productId?: number;
  productOptions?: Array<{ id: number; name: string }>;
  fundOptions?: Array<{ id: number; name: string }>;
  delinquencyBucketOptions?: Array<{ id: number; name: string }>;
  frequencyTypeOptions?: Array<{ id: number; code: string; value: string }>;
  currency?: { code: string; name: string; decimalPlaces: number; displaySymbol: string };
  loanData?: {
    principalAmount?: number;
    periodPaymentRate?: number;
    totalPaymentVolume?: number;
    discount?: number;
    submittedOnDate?: string;
    expectedDisbursementDate?: string;
    delinquencyBucketId?: number;
    delinquencyGraceDays?: number;
    delinquencyStartType?: {
      id: string;
      code: string;
      value: string;
    };
    [key: string]: unknown;
  };
  isDelinquencyBucketClassification?: boolean;
}

export interface AmortizationScheduleEntry {
  period: number;
  fromDate: string | number[];
  dueDate: string | number[];
  expectedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  eir?: number;
  discountFactor?: number;
  npv?: number;
  deferredBalance?: number;
  minPaymentCriteriaMet?: boolean;
}

export interface DelinquencyRangeScheduleEntry {
  period: number;
  fromDate?: string | number[];
  toDate?: string | number[];
  expectedAmount?: number;
  paidAmount?: number;
  outstandingAmount?: number;
  minPaymentCriteriaMet?: boolean;
  delinquencyStatus?: string;
}

export type WCBreachDelinquencyAction =
  | "pause"
  | "reschedule"
  | "resume"
  | "reset"
  | "undo_reset"
  | "disable"
  | "enable";

export interface DelinquencyActionRequest {
  action: WCBreachDelinquencyAction;
  startDate?: string;
  endDate?: string;
  minimumPayment?: number;
  minimumPaymentType?: string;
  frequency?: number;
  frequencyType?: string;
  startNewPeriod?: boolean;
  locale?: string;
  dateFormat?: string;
}

export interface BreachActionRequest {
  action: WCBreachDelinquencyAction;
  startDate?: string;
  endDate?: string;
  minimumPayment?: number;
  minimumPaymentType?: string;
  frequency?: number;
  frequencyType?: string;
  locale?: string;
  dateFormat?: string;
}

export interface NearBreachActionRequest {
  action: "RESCHEDULE";
  nearBreachThreshold: number;
  nearBreachFrequency: number;
  nearBreachFrequencyType: "DAYS" | "WEEKS" | "MONTHS";
  locale?: string;
}

export interface WCBreachActionData {
  id: number;
  loanId?: number;
  action: "PAUSE" | "RESUME" | "RESCHEDULE" | "RESET" | "UNDO_RESET" | "DISABLE" | "ENABLE";
  startDate: string | number[];
  endDate: string | number[] | null;
  effectiveEndDate: string | number[] | null;
  minimumPayment: number | null;
  minimumPaymentType: "PERCENTAGE" | "FLAT" | null;
  frequency: number | null;
  frequencyType: string | null;
}

export interface WCNearBreachActionData {
  id: number;
  loanId: number;
  action: "RESCHEDULE";
  threshold: number;
  frequency: number;
  frequencyType: string;
  createdDate: string | number[];
}

export interface WCBreachSchedulePeriod {
  id: number;
  loanId: number;
  periodNumber: number;
  fromDate: string | number[];
  toDate: string | number[];
  numberOfDays?: number;
  minPaymentAmount: number;
  outstandingAmount: number;
  nearBreach: boolean;
  breach: boolean;
  reset: boolean;
}

export interface RateChangeRequest {
  periodPaymentRate: number;
  note?: string;
  locale?: string;
}

export interface RateChangeHistoryEntry {
  id: number;
  periodPaymentRate?: number;
  newRate?: number;
  previousRate?: number;
  fromDate?: string | number[];
  effectiveDate?: string | number[];
  createdOnDate?: string | number[];
  createdDate?: string | number[];
  note?: string;
}

export interface RepaymentRequest {
  transactionDate: string;
  transactionAmount: number;
  paymentTypeId?: number;
  locale?: string;
  dateFormat?: string;
}

// ─── Loan Status (numeric wire values, shared LoanStatus enum) ───
export const WC_LOAN_STATUS_ID = {
  INVALID: 0,
  SUBMITTED_AND_PENDING_APPROVAL: 100,
  APPROVED: 200,
  ACTIVE: 300,
  WITHDRAWN_BY_CLIENT: 400,
  REJECTED: 500,
  CLOSED_OBLIGATIONS_MET: 600,
  OVERPAID: 700,
} as const;

export const WC_TRANSACTION_COMMANDS = [
  "repayment",
  "payoutRefund",
  "goodwillCredit",
  "creditBalanceRefund",
  "discountFee",
  "discountFeeAdjustment",
  "chargeOff",
  "undoChargeOff",
] as const;

export type WCTransactionCommand = (typeof WC_TRANSACTION_COMMANDS)[number];

export const WC_TEMPLATE_TYPES = [
  "approve",
  "disburse",
  "repayment",
  "goodwillCredit",
  "creditBalanceRefund",
  "discountFee",
  "discountFeeAdjustment",
  "chargeOff",
] as const;

export type WCTemplateType = (typeof WC_TEMPLATE_TYPES)[number];

// ─── State transition & lifecycle requests (§4.3–§4.9) ───
export interface RejectWCLoanRequest {
  rejectedOnDate: string;
  note?: string;
  locale?: string;
  dateFormat?: string;
}

export interface UndoApprovalRequest {
  note?: string;
  locale?: string;
  dateFormat?: string;
}

export type UndoDisbursalRequest = UndoApprovalRequest;

export interface DisbursementPaymentDetails {
  paymentTypeId?: number;
  accountNumber?: string;
  checkNumber?: string;
  routingCode?: string;
  receiptNumber?: string;
  bankNumber?: string;
}

export interface MarkAsFraudRequest {
  fraud: boolean;
}

export interface UpdateDiscountRequest {
  discountAmount?: number;
  note?: string;
  locale?: string;
  dateFormat?: string;
}

export type WCLoanStateTransitionCommand = "approve" | "reject" | "undoapproval" | "disburse" | "undodisbursal";

// ─── Transaction command requests (§4.10–§4.15) ───
export interface RepaymentLikeRequest extends RepaymentRequest {
  classificationId?: number;
  note?: string;
  paymentDetails?: DisbursementPaymentDetails;
  externalId?: string;
}

export type CreditBalanceRefundRequest = RepaymentLikeRequest;

export interface DiscountFeeTransactionRequest {
  transactionAmount?: number;
  transactionDate?: string;
  classificationId?: number;
  relatedResourceId?: number;
  note?: string;
  paymentDetails?: DisbursementPaymentDetails;
  externalId?: string;
  locale?: string;
  dateFormat?: string;
}

export interface DiscountFeeAdjustmentRequest extends DiscountFeeTransactionRequest {
  transactionAmount: number;
}

export interface ChargeOffRequest {
  transactionDate: string;
  chargeOffReasonId?: number;
  note?: string;
  externalId?: string;
  locale?: string;
  dateFormat?: string;
}

export interface UndoChargeOffRequest {
  reversalExternalId?: string;
  note?: string;
  locale?: string;
}

export interface UndoTransactionRequest {
  reversalExternalId?: string;
  note?: string;
  locale?: string;
  dateFormat?: string;
}

// ─── Command template (§5 WCCommandTemplateData) ───
export interface WCCommandTemplateData {
  loanId: number;
  approvalDate?: string | number[] | null;
  approvalAmount?: number | null;
  discountAmount?: number | null;
  overrideDiscountDisabled?: boolean;
  expectedDisbursementDate?: string | number[] | null;
  expectedAmount?: number | null;
  expectedMaturityDate?: string | number[] | null;
  currency?: { code: string; name: string; decimalPlaces: number; displaySymbol: string } | null;
  paymentTypeOptions?: Array<{ id: number; name: string }>;
  classificationOptions?: CodeName[];
  chargeOffAmount?: number | null;
  chargeOffDate?: string | number[] | null;
  chargeOffReasonOptions?: CodeName[];
}

// ─── Charges (§3.3, §4.16–§4.17, §5 WCChargeData) ───
export interface WCChargeData {
  id: number;
  chargeId: number;
  name: string;
  chargeTimeType?: { id: number; code: string; value: string } | null;
  submittedOnDate?: string | number[] | null;
  dueDate?: string | number[] | null;
  chargeCalculationType?: { id: number; code: string; value: string } | null;
  currency?: { code: string; name: string; decimalPlaces: number; displaySymbol: string } | null;
  amount: number;
  amountPaid?: number | null;
  amountOutstanding: number;
  penalty?: boolean;
  chargePaymentMode?: { id: number; code: string; value: string } | null;
  paid?: boolean;
  loanId?: number | null;
  externalId?: string | null;
}

export interface CreateLoanChargeRequest {
  chargeId: number;
  amount: number;
  dueDate?: string;
  externalId?: string;
  locale?: string;
  dateFormat?: string;
}

export interface ChargeAdjustmentRequest {
  amount: number;
  externalId?: string;
  note?: string;
  paymentTypeId?: number;
  accountNumber?: string;
  checkNumber?: string;
  routingCode?: string;
  receiptNumber?: string;
  bankNumber?: string;
  locale?: string;
  dateFormat?: string;
}

export interface WCChargeTemplateData {
  chargeOptions?: Array<{
    id: number;
    name: string;
    chargeTimeType?: { id: number; code: string; value: string };
    chargeCalculationType?: { id: number; code: string; value: string };
    currency?: { code: string; displaySymbol?: string };
    amount?: number;
    active?: boolean;
    penalty?: boolean;
  }>;
  paymentTypeOptions?: Array<{ id: number; name: string }>;
}

// ─── Configuration modules (docs/WCLoan.md §4.21) ───
export interface WCBreachConfig {
  id: number;
  name: string;
  breachFrequency: number;
  breachFrequencyType: EnumValue;
  breachAmountCalculationType: EnumValue;
  breachAmount: number;
}

export interface WCBreachConfigRequest {
  name: string;
  breachFrequency: number;
  breachFrequencyType: "DAYS" | "WEEKS" | "MONTHS" | "YEARS";
  breachAmountCalculationType: "PERCENTAGE" | "FLAT";
  breachAmount: number;
}

export interface WCNearBreachConfig {
  id: number;
  name?: string;
  nearBreachName?: string;
  frequency?: number;
  nearBreachFrequency?: number;
  frequencyType?: EnumValue;
  nearBreachFrequencyType?: EnumValue;
  threshold?: number;
  nearBreachThreshold?: number;
}

export interface WCNearBreachConfigRequest {
  nearBreachName: string;
  nearBreachFrequency: number;
  nearBreachFrequencyType: "DAYS" | "WEEKS" | "MONTHS" | "YEARS";
  nearBreachThreshold: number;
}
