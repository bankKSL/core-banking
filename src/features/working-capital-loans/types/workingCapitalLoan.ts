export type WCLoanStatus =
  | "Submitted and pending approval"
  | "Approved"
  | "Active"
  | "Closed"
  | "Rejected";

export interface CodeName {
  id: number;
  value: string;
  code?: string;
}

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
  amortizationType: string;
  npvDayCount: number;
  principal: number;
  minPrincipal: number;
  maxPrincipal: number;
  periodPaymentRate: number;
  minPeriodPaymentRate: number;
  maxPeriodPaymentRate: number;
  repaymentEvery: number;
  repaymentFrequencyType: CodeName;
  delinquencyBucketId: number;
  delinquencyGraceDays: number;
  delinquencyStartType: string;
  accountingRule: CodeName;
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
  delinquencyBucketOptions?: Array<{ id: number; name: string }>;
  accountingRuleOptions?: Array<{ id: number; code: string; value: string }>;
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
  timeline: WCLoanTimeline;
  delinquencyBucketId?: number;
  delinquencyGraceDays?: number;
  delinquencyStartType?: string;
  delinquent?: {
    delinquentDays?: number;
    delinquentAmount?: number;
    lastPaymentDate?: string | number[];
  };
  delinquencyRange?: { id: number; classification: string; minimumAgeDays: number; maximumAgeDays: number };
  transactions?: WCLoanTransaction[];
}

export interface WCLoanSummary {
  currency: { code: string; name: string; decimalPlaces: number; displaySymbol: string };
  principalDisbursed: number;
  principalPaid: number;
  principalOutstanding: number;
  interestOutstanding: number;
  interestPaid: number;
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
  date: string | number[];
  currency: { code: string; displaySymbol: string };
  amount: number;
  principalPortion?: number;
  interestPortion?: number;
  outstandingLoanBalance?: number;
  paymentDetailData?: {
    paymentType?: { id: number; name: string };
  } | null;
}

export interface WCLoanCreateRequest {
  clientId: number;
  productId: number;
  principalAmount: number;
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
  delinquencyBucketOptions?: Array<{ id: number; name: string }>;
  frequencyTypeOptions?: Array<{ id: number; code: string; value: string }>;
  currency?: { code: string; name: string; decimalPlaces: number; displaySymbol: string };
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
  fromDate: string | number[];
  toDate: string | number[];
  expectedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  minPaymentCriteriaMet?: boolean;
  delinquencyStatus?: string;
}

export interface DelinquencyActionRequest {
  action: "pause" | "reschedule";
  startDate?: string;
  endDate?: string;
  minimumPayment?: number;
  minimumPaymentType?: string;
  frequency?: number;
  frequencyType?: string;
  locale?: string;
  dateFormat?: string;
}

export interface RateChangeRequest {
  periodPaymentRate: number;
  note?: string;
  locale?: string;
}

export interface RateChangeHistoryEntry {
  id: number;
  periodPaymentRate: number;
  fromDate: string | number[];
  createdOnDate?: string | number[];
  note?: string;
}

export interface RepaymentRequest {
  transactionDate: string;
  transactionAmount: number;
  paymentTypeId?: number;
  locale?: string;
  dateFormat?: string;
}
