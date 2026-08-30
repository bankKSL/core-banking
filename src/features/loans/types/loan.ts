// ─── Loan Types ────────────────────────────────

import type { LoanOriginator } from "@/features/loan-originators/types/loanOriginator";
import type { LoanApplicationOriginator } from "@/features/loan-originators/types/loanOriginator";

export type LoanStatus =
  | "Submitted and pending approval"
  | "Approved"
  | "Active"
  | "Disbursed"
  | "Closed (obligations met)"
  | "Closed (written off)"
  | "Closed (rescheduled)"
  | "Closed"
  | "Overpaid"
  | "Rejected";

export type AmortizationType = "Equal installments" | "Equal principal payments";
export type InterestType = "Flat" | "Declining Balance";
export type InterestCalculationPeriodType = "daily" | "same as repayment period";

export type RepaymentFrequency =
  "Daily" | "Weekly" | "Every two weeks" | "Monthly" | "Every two months" | "Quarterly" | "Semi Annual" | "Annual";

export type LoanTransactionType =
  "disbursement" | "repayment" | "waiveInterest" | "waiveCharges" | "writeOff" | "recoveryPayment" | "accrual";

export interface CodeName {
  id: number;
  value: string;
  code?: string;
}

// ─── Loan Product ────────────────────────────────────────────────

export interface LoanProduct {
  id: number;
  name: string;
  shortName?: string;
  description?: string;
  fund?: { id: number; name: string };
  fundId?: number;
  fundName?: string;
  includeInBorrowerCycle?: boolean;
  useBorrowerCycle?: boolean;
  startDate?: string | number[];
  closeDate?: string | number[];
  status?: string;
  currency: {
    code: string;
    name: string;
    decimalPlaces: number;
    inMultiplesOf?: number;
    displaySymbol: string;
    nameCode: string;
    displayLabel: string;
  };
  principal: number;
  minPrincipal: number;
  maxPrincipal: number;
  numberOfRepayments: number;
  minNumberOfRepayments: number;
  maxNumberOfRepayments: number;
  repaymentEvery: number;
  repaymentFrequencyType: CodeName;
  interestRatePerPeriod: number;
  minInterestRatePerPeriod: number;
  maxInterestRatePerPeriod: number;
  interestRateFrequencyType?: CodeName;
  annualInterestRate: number;
  isLinkedToFloatingInterestRates?: boolean;
  isFloatingInterestRateCalculationAllowed?: boolean;
  allowVariableInstallments?: boolean;
  amortizationType: CodeName;
  interestType: CodeName;
  interestCalculationPeriodType: CodeName;
  transactionProcessingStrategyCode?: string;
  transactionProcessingStrategyId?: number;
  transactionProcessingStrategyName?: string;
  accountingRule?: CodeName;
  accountingMappings?: unknown;
  charges: Array<{
    id: number;
    chargeId: number;
    name: string;
    chargeTimeType: CodeName;
    chargeCalculationType: CodeName;
    amount: number;
    chargePaymentMode: CodeName;
    isPenalty: boolean;
    isActive: boolean;
  }>;
  overdueCharges?: Array<{
    id: number;
    chargeId: number;
    name: string;
    chargeTimeType: CodeName;
    chargeCalculationType: CodeName;
    amount: number;
    chargePaymentMode: CodeName;
    isPenalty: boolean;
    isActive: boolean;
  }>;
  daysInMonthType?: CodeName;
  daysInYearType?: CodeName;
  isInterestRecalculationEnabled?: boolean;
  multiDisburseLoan?: boolean;
  maxTrancheCount?: number;
  outstandingLoanBalance?: number;
  canDefineInstallmentAmount?: boolean;
  graceOnPrincipalPayment?: number;
  graceOnInterestPayment?: number;
  graceOnInterestCharged?: number;
  inArrearsTolerance?: number;
  allowPartialPeriodInterestCalculation?: boolean;
  loanScheduleType?: CodeName | string;
  externalId?: string;
  delinquencyBucketId?: number;
}

// ─── Loan ────────────────────────────────────────────────────────

export interface Loan {
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
    closedWrittenOff?: boolean;
    closedRescheduled?: boolean;
    overpaid?: boolean;
  };
  subStatus?: { id: number; code: string; value: string };
  loanProductId: number;
  loanProductName: string;
  loanProductDescription?: string;
  clientId: number;
  clientName?: string;
  clientOfficeId?: number;
  group?: { id: number; name: string } | null;
  groupName?: string;
  loanType?: { id: number; code: string; value: string };
  loanOfficerId?: number;
  loanOfficerName?: string;
  loanPurposeId?: number;
  loanPurposeName?: string;
  fundId?: number;
  fundName?: string;
  officeId?: number;
  officeName?: string;
  principal: number;
  approvedPrincipal?: number;
  proposedPrincipal?: number;
  netDisbursalAmount?: number;
  termFrequency: number;
  termPeriodFrequencyType: CodeName;
  numberOfRepayments: number;
  repaymentEvery: number;
  repaymentFrequencyType: CodeName;
  interestRatePerPeriod: number;
  interestRateFrequencyType?: CodeName;
  annualInterestRate: number;
  isFloatingInterestRate?: boolean;
  amortizationType: CodeName;
  interestType: CodeName;
  interestCalculationPeriodType: CodeName;
  allowPartialPeriodInterestCalculation?: boolean;
  inArrearsTolerance?: number;
  transactionProcessingStrategyId?: number;
  transactionProcessingStrategyCode?: string;
  transactionProcessingStrategyName?: string;
  graceOnPrincipalPayment?: number;
  graceOnInterestPayment?: number;
  graceOnInterestCharged?: number;
  graceOnArrearsAgeing?: number;
  totalChargesDueAtDisbursement?: number;
  totalOutstanding?: number;
  totalPrincipalPaid?: number;
  totalInterestPaid?: number;
  totalFeeChargesPaid?: number;
  totalPenaltyChargesPaid?: number;
  totalWaived?: number;
  totalWrittenOff?: number;
  totalRepayment?: number;
  totalOverpaid?: number;
  summary?: LoanSummary;
  timeline: LoanTimeline;
  repaymentSchedule?: LoanRepaymentSchedule;
  transactions?: LoanTransaction[];
  charges?: LoanCharge[];
  collateral?: LoanCollateral[];
  guarantors?: LoanGuarantor[];
  originators?: LoanOriginator[];
  delinquent?: LoanDelinquentData;
  delinquencyRange?: { id: number; classification: string; minimumAgeDays: number; maximumAgeDays: number };
  inArrears?: boolean;
  isNPA?: boolean;
  fraud?: boolean;
  chargedOff?: boolean;
  overdueSinceDate?: string | number[];
  emiAmount?: number;
  fixedEmiAmount?: number;
  maxOutstandingLoanBalance?: number;
  multiDisburseLoan?: boolean;
  maxTrancheCount?: number;
  outstandingLoanBalance?: number;
  expectedDisbursementDate?: string | number[];
  submittedOnDate?: string | number[];
  linkAccountId?: number;
  isTopup?: boolean;
  loanIdToClose?: number;
  enableDownPayment?: boolean;
  enableInstallmentLevelDelinquency?: boolean;
  loanDocuments?: unknown[];
  notes?: unknown[];
  currency: {
    code: string;
    name: string;
    decimalPlaces: number;
    nameCode: string;
    displayLabel: string;
  };
}

/** Repayment schedule block as returned with associations=repaymentSchedule|all */
export interface LoanRepaymentSchedule {
  currency?: { code: string; name: string; decimalPlaces: number; displaySymbol: string };
  loanTermInDays?: number;
  totalPrincipalDisbursed?: number;
  totalPrincipalExpected?: number;
  totalPrincipalPaid?: number;
  totalInterestCharged?: number;
  totalFeeChargesCharged?: number;
  totalPenaltyChargesCharged?: number;
  totalWaived?: number;
  totalWrittenOff?: number;
  totalRepaymentExpected?: number;
  totalRepayment?: number;
  totalOutstanding?: number;
  periods?: LoanRepaymentPeriod[];
}

export interface LoanSummary {
  currency: { code: string; name: string; decimalPlaces: number; displaySymbol: string };
  principalDisbursed: number;
  principalPaid: number;
  principalWrittenOff: number;
  principalOutstanding: number;
  principalOverdue: number;
  interestOutstanding: number;
  interestPaid: number;
  interestWrittenOff: number;
  interestOverdue: number;
  feeChargesOutstanding: number;
  feeChargesPaid: number;
  feeChargesWrittenOff: number;
  feeChargesOverdue: number;
  penaltyChargesOutstanding: number;
  penaltyChargesPaid: number;
  penaltyChargesWrittenOff: number;
  penaltyChargesOverdue: number;
  totalExpectedRepayment: number;
  totalRepayment: number;
  totalExpectedCostOfLoan: number;
  totalCostOfLoan: number;
  totalWaived: number;
  totalWrittenOff: number;
  totalOutstanding: number;
  totalOverdue: number;
  overdueSinceDate?: string;
  lastRepaymentDate?: string;
}

export interface LoanTimeline {
  submittedOnDate?: string | number[];
  submittedByUsername?: string;
  expectedDisbursementDate?: string | number[];
  expectedMaturityDate?: string | number[];
  actualDisbursementDate?: string | number[];
  approvedOnDate?: string | number[];
  approvedByUsername?: string;
  rejectedOnDate?: string | number[];
  rejectedByUsername?: string;
  closedOnDate?: string | number[];
  closedByUsername?: string;
  withdrawnOnDate?: string | number[];
  disbursedByUsername?: string;
}

export interface LoanRepaymentPeriod {
  period: number;
  fromDate: string | number[];
  dueDate: string | number[];
  obligationsMetOnDate?: string | number[] | null;
  completed?: boolean;
  complete?: boolean;
  principalOriginalDue: number;
  principalDue: number;
  principalOutstanding?: number;
  principalLoanBalanceOutstanding?: number;
  principalPaid: number;
  principalWrittenOff?: number;
  interestOriginalDue: number;
  interestDue: number;
  interestOutstanding?: number;
  interestPaid: number;
  interestWaived?: number;
  interestWrittenOff?: number;
  feeChargesDue: number;
  feeChargesOutstanding?: number;
  feeChargesPaid: number;
  feeChargesWaived?: number;
  feeChargesWrittenOff?: number;
  penaltyChargesDue: number;
  penaltyChargesPaid?: number;
  penaltyChargesWaived?: number;
  penaltyChargesWrittenOff?: number;
  totalOriginalDueForPeriod: number;
  totalDueForPeriod: number;
  totalOutstandingForPeriod: number;
  totalPaidForPeriod?: number;
  totalPaidInAdvanceForPeriod?: number;
  totalPaidLateForPeriod?: number;
  totalWaivedForPeriod?: number;
  totalWrittenOffForPeriod?: number;
  totalActualCostOfLoanForPeriod?: number;
  daysInPeriod: number;
  repaid?: boolean;
  late?: boolean;
}

export interface LoanTransaction {
  id: number;
  type: { id: number; code: string; value: string };
  date: string | number[];
  currency: { code: string; displaySymbol: string };
  paymentDetailData?: {
    paymentType?: { id: number; name: string };
    accountNumber?: string;
    checkNumber?: string;
    routingCode?: string;
    receiptNumber?: string;
    bankNumber?: string;
  } | null;
  amount: number;
  netDisbursalAmount?: number | null;
  principalPortion?: number;
  interestPortion?: number;
  feeChargesPortion?: number;
  penaltyChargesPortion?: number;
  overpaymentPortion?: number;
  unrecognizedIncomePortion?: number;
  externalId?: string;
  outstandingLoanBalance?: number;
  submittedOnDate: string | number[];
  manuallyReversed: boolean;
}

// ─── List / Pagination ───────────────────────────────────────────

export interface LoanListResponse {
  totalFilteredRecords?: number;
  pageItems?: Loan[];
}

export interface LoanListParams {
  offset?: number;
  limit?: number;
  orderBy?: string;
  sortOrder?: "ASC" | "DESC";
  officeId?: number;
  clientId?: number;
  groupId?: number;
  accountNo?: string;
  externalId?: string;
  /** Numeric `loan_status_id` (doc §8.1) — server uses the `status` query param. */
  status?: number;
}

// ─── Loan Template ───────────────────────────────────────────────

export interface LoanTemplateOption {
  id: number;
  code?: string;
  value?: string;
  name?: string;
}

export interface LoanTemplate {
  clientId?: number;
  clientName?: string;
  clientAccountNo?: string;
  clientOfficeId?: number;
  loanProductId?: number;
  loanProductName?: string;
  /** Product dropdown — `GET /v1/loans/template?...` → productOptions (doc §3/§6) */
  productOptions?: Array<{ id: number; name: string; multiDisburseLoan?: boolean }>;
  loanProductOptions?: Array<{ id: number; name: string; multiDisburseLoan?: boolean }>;
  loanOfficerOptions?: Array<{ id: number; displayName?: string; name?: string }>;
  fundOptions?: Array<{ id: number; name: string }>;
  loanPurposeOptions?: Array<{ id: number; name: string }>;
  loanCollateralOptions?: Array<{ id: number; name: string; position?: number }>;
  accountLinkingOptions?: Array<{
    id: number;
    accountNo?: string;
    productName?: string;
    accountType?: { id: number; code: string; value: string };
  }>;
  clientActiveLoanOptions?: Array<{ id: number; accountNo?: string; loanProductName?: string }>;
  chargeOptions?: Array<{ id: number; name: string; active?: boolean; penalty?: boolean }>;
  datatables?: Array<{ registeredTableName: string; entity?: number }>;
  expectedDisbursementDate?: string;

  currency?: { code: string; name: string; decimalPlaces: number; displaySymbol: string };
  principal?: number;
  termFrequency?: number;
  termPeriodFrequencyType?: LoanTemplateOption;
  numberOfRepayments?: number;
  repaymentEvery?: number;
  repaymentFrequencyType?: LoanTemplateOption;
  interestRatePerPeriod?: number;
  interestRateFrequencyType?: LoanTemplateOption;
  annualInterestRate?: number;
  amortizationType?: LoanTemplateOption;
  interestType?: LoanTemplateOption;
  interestCalculationPeriodType?: LoanTemplateOption;
  transactionProcessingStrategyCode?: string;
  transactionProcessingStrategyName?: string;
  transactionProcessingStrategyId?: number;
  isFloatingInterestRate?: boolean;
  isLoanProductLinkedToFloatingRate?: boolean;
  daysInMonthType?: LoanTemplateOption;
  daysInYearType?: LoanTemplateOption;
  daysInYearTypeId?: number;
  repaymentStartDateType?: number;
  loanScheduleType?: { id: number; code: string; value: string } | string;
  loanScheduleProcessingType?: { id: number; code: string; value: string } | string;
  isEqualAmortization?: boolean;
  fixedPrincipalPercentagePerInstallment?: number;
  netDisbursalAmount?: number;
  loanCounter?: number;
  loanProductCounter?: number;
  multiDisburseLoan?: boolean;
  canDefineInstallmentAmount?: boolean;
  canUseForTopup?: boolean;
  enableDownPayment?: boolean;
  enableAutoRepaymentForDownPayment?: boolean;
  disbursedAmountPercentageForDownPayment?: number;
  enableInstallmentLevelDelinquency?: boolean;
  interestRecognitionOnDisbursementDate?: boolean;
  enableIncomeCapitalization?: boolean;
  enableBuyDownFee?: boolean;
  maxOutstandingLoanBalance?: number;

  graceOnPrincipalPayment?: number;
  graceOnInterestPayment?: number;
  graceOnInterestCharged?: number;
  graceOnArrearsAgeing?: number;
  inArrearsTolerance?: number;
  charges?: LoanCharge[];

  amortizationTypeOptions?: LoanTemplateOption[];
  interestTypeOptions?: LoanTemplateOption[];
  interestCalculationPeriodTypeOptions?: LoanTemplateOption[];
  repaymentPeriodFrequencyTypeOptions?: LoanTemplateOption[];
  termFrequencyTypeOptions?: LoanTemplateOption[];
  repaymentFrequencyTypeOptions?: LoanTemplateOption[];
  interestRateFrequencyTypeOptions?: LoanTemplateOption[];
  transactionProcessingStrategyOptions?: Array<{ code: string; name: string }>;
  loanScheduleTypeOptions?: LoanTemplateOption[];
  loanScheduleProcessingTypeOptions?: LoanTemplateOption[];
  repaymentStartDateTypeOptions?: LoanTemplateOption[];
  repaymentFrequencyNthDayTypeOptions?: LoanTemplateOption[];
  repaymentFrequencyDaysOfWeekTypeOptions?: LoanTemplateOption[];
}

// ─── Loan Create/Command Requests ────────────────────────────────

export interface LoanCreateRequest {
  clientId: number;
  productId: number;
  principal: number;
  loanTermFrequency: number;
  loanTermFrequencyType: number;
  numberOfRepayments: number;
  repaymentEvery: number;
  repaymentFrequencyType: number;
  interestRatePerPeriod: number;
  expectedDisbursementDate: string;
  submittedOnDate: string;
  transactionProcessingStrategyId?: number;
  transactionProcessingStrategyCode?: string;
  amortizationType?: number;
  interestType?: number;
  interestCalculationPeriodType?: number;
  loanPurposeName?: string;
  loanPurposeId?: number;
  loanOfficerId?: number;
  fundId?: number;
  linkAccountId?: number;
  externalId?: string;
  maxOutstandingLoanBalance?: number;
  charges?: Array<{ chargeId: number; amount: number; dueDate?: string }>;
  collateral?: Array<{ collateralTypeId: number; value: number; description?: string }>;
  guarantors?: Array<{ clientId: number; amount: number; guarantorTypeId?: number }>;
  originators?: LoanApplicationOriginator[];
  disbursementData?: Array<{
    expectedDisbursementDate: string;
    principal: number;
    approvedPrincipal?: number;
    netDisbursalAmount?: number;
  }>;
  datatables?: Array<{ data: unknown; registeredTableName: string }>;
  dateFormat?: string;
  locale?: string;
}

export interface LoanCommandRequest {
  command?: string;
  locale?: string;
  dateFormat?: string;
  note?: string;
  approvedOnDate?: string;
  approvedLoanAmount?: number;
  expectedDisbursementDate?: string;
  actualDisbursementDate?: string;
  transactionAmount?: number;
  paymentTypeId?: number;
  transactionDate?: string;
  rejectedOnDate?: string;
  withdrawnOnDate?: string;
  closedOnDate?: string;
  writeoffReason?: string;
  chargeOffReasonId?: number;
  externalId?: string;
}

export interface LoanCommandResponse {
  officeId: number;
  clientId: number;
  loanId: number;
  resourceId?: number;
  changes?: Record<string, unknown>;
}

// ─── Repayment ───────────────────────────────────────────────────

export interface RepaymentTransactionRequest {
  transactionDate: string;
  transactionAmount: number;
  paymentTypeId?: number;
  accountNumber?: string;
  checkNumber?: string;
  routingCode?: string;
  receiptNumber?: string;
  bankNumber?: string;
  locale?: string;
  dateFormat?: string;
}

export interface RepaymentTemplate {
  amount: number;
  date: string;
  currency: { code: string; name: string; displaySymbol: string };
  paymentTypeOptions: Array<{ id: number; name: string }>;
  outstandingLoanBalance: number;
}

// ─── Loan Product Template ───────────────────────────────────────

export interface LoanProductTemplate {
  currencyOptions?: Array<{
    code: string;
    name: string;
    decimalPlaces: number;
    displaySymbol?: string;
    nameCode: string;
    displayLabel: string;
  }>;
  fundOptions?: Array<{ id: number; name: string }>;
  repaymentFrequencyTypeOptions?: Array<{ id: number; code: string; value: string }>;
  interestRateFrequencyTypeOptions?: Array<{ id: number; code: string; value: string }>;
  amortizationTypeOptions?: Array<{ id: number; code: string; value: string }>;
  interestTypeOptions?: Array<{ id: number; code: string; value: string }>;
  interestCalculationPeriodTypeOptions?: Array<{ id: number; code: string; value: string }>;
  transactionProcessingStrategyOptions?: Array<{ code: string; name: string }>;
  daysInYearTypeOptions?: Array<{ id: number; code: string; value: string }>;
  daysInMonthTypeOptions?: Array<{ id: number; code: string; value: string }>;
  accountingRuleOptions?: Array<{ id: number; code: string; value: string }>;
  loanScheduleTypeOptions?: Array<{ id: number; code: string; value: string }>;
  loanScheduleProcessingTypeOptions?: Array<{ id: number; code: string; value: string }>;
  repaymentStartDateTypeOptions?: Array<{ id: number; code: string; value: string }>;
  chargeOffBehaviourOptions?: Array<{ id: string; code: string; value: string }>;
  interestRecalculationCompoundingTypeOptions?: Array<{ id: number; code: string; value: string }>;
  rescheduleStrategyTypeOptions?: Array<{ id: number; code: string; value: string }>;
  interestRecalculationFrequencyTypeOptions?: Array<{ id: number; code: string; value: string }>;
  preClosureInterestCalculationStrategyOptions?: Array<{ id: number; code: string; value: string }>;
  buyDownFeeIncomeTypeOptions?: Array<{ id: string; code: string; value: string }>;
  buyDownFeeCalculationTypeOptions?: Array<{ id: string; code: string; value: string }>;
  buyDownFeeStrategyOptions?: Array<{ id: string; code: string; value: string }>;
  capitalizedIncomeTypeOptions?: Array<{ id: string; code: string; value: string }>;
  capitalizedIncomeCalculationTypeOptions?: Array<{ id: string; code: string; value: string }>;
  capitalizedIncomeStrategyOptions?: Array<{ id: string; code: string; value: string }>;
  valueConditionTypeOptions?: Array<{ id: number; code: string; value: string }>;
  writeOffReasonOptions?: Array<{ id: number; name: string }>;
  interestRecalculationNthDayTypeOptions?: Array<{ id: number; code: string; value: string }>;
  interestRecalculationDayOfWeekTypeOptions?: Array<{ id: number; code: string; value: string }>;
  advancedPaymentAllocationTransactionTypes?: Array<{ id: number; code: string; value: string }>;
  advancedPaymentAllocationFutureInstallmentAllocationRules?: Array<{ id: number; code: string; value: string }>;
  accountingMappingOptions?: {
    assetAccountOptions?: Array<{ id: number; name: string; glCode: string; disabled?: boolean }>;
    liabilityAccountOptions?: Array<{ id: number; name: string; glCode: string; disabled?: boolean }>;
    incomeAccountOptions?: Array<{ id: number; name: string; glCode: string; disabled?: boolean }>;
    expenseAccountOptions?: Array<{ id: number; name: string; glCode: string; disabled?: boolean }>;
  };
  paymentTypeOptions?: Array<{
    id: number;
    name: string;
    description?: string;
    isCashPayment?: boolean;
    position?: number;
    isSystemDefined?: boolean;
    codeName?: string;
  }>;
}

// ─── Loan Product Create ─────────────────────────────────────────

export interface LoanProductCreateRequest {
  name: string;
  shortName?: string;
  description?: string;
  externalId?: string;
  fundId?: number;
  delinquencyBucketId?: number;
  currencyCode: string;
  digitsAfterDecimal?: number;
  inMultiplesOf?: number;
  principal: number;
  minPrincipal?: number;
  maxPrincipal?: number;
  numberOfRepayments: number;
  minNumberOfRepayments?: number;
  maxNumberOfRepayments?: number;
  repaymentEvery: number;
  repaymentFrequencyType: number;
  interestRatePerPeriod: number;
  minInterestRatePerPeriod?: number;
  maxInterestRatePerPeriod?: number;
  interestRateFrequencyType?: number;
  amortizationType: number;
  interestType: number;
  interestCalculationPeriodType: number;
  allowPartialPeriodInterestCalculation?: boolean;
  loanScheduleType?: string;
  loanScheduleProcessingType?: string;
  transactionProcessingStrategyCode?: string;
  daysInYearType?: number;
  daysInMonthType?: number;
  graceOnPrincipalPayment?: number;
  graceOnInterestPayment?: number;
  graceOnInterestCharged?: number;
  graceOnArrearsAgeing?: number;
  multiDisburseLoan?: boolean;
  maxTrancheCount?: number;
  outstandingLoanBalance?: number;
  canDefineInstallmentAmount?: boolean;
  installmentAmountInMultiplesOf?: number;
  isInterestRecalculationEnabled?: boolean;
  interestRecalculationCompoundingMethod?: number;
  rescheduleStrategyMethod?: number;
  recalculationRestFrequencyType?: number;
  preClosureInterestCalculationStrategy?: number;
  enableBuyDownFee?: boolean;
  merchantBuyDownFee?: boolean;
  buyDownFeeCalculationType?: string;
  buyDownFeeStrategy?: string;
  buyDownFeeIncomeType?: string;
  enableIncomeCapitalization?: boolean;
  capitalizedIncomeCalculationType?: string;
  capitalizedIncomeStrategy?: string;
  capitalizedIncomeType?: string;
  chargeOffBehaviour?: string;
  enableAccrualActivityPosting?: boolean;
  interestRecognitionOnDisbursementDate?: boolean;
  isEqualAmortization?: boolean;
  canUseForTopup?: boolean;
  syncExpectedWithDisbursementDate?: boolean;
  disallowExpectedDisbursements?: boolean;
  allowApprovedDisbursedAmountsOverApplied?: boolean;
  holdGuaranteeFunds?: boolean;
  isLinkedToFloatingInterestRates?: boolean;
  allowVariableInstallments?: boolean;
  enableInstallmentLevelDelinquency?: boolean;
  includeInBorrowerCycle?: boolean;
  useBorrowerCycle?: boolean;
  accountMovesOutOfNpaOnlyOnArrearsCompletion?: boolean;
  overdueDaysForNpa?: number;
  minDaysBetweenDisbursalAndFirstRepayment?: number;
  principalThresholdForLastInstallment?: number;
  fixedPrincipalPercentagePerInstallment?: number;
  dueDaysForRepaymentEvent?: number;
  overdueDaysForRepaymentEvent?: number;
  overAppliedCalculationType?: string;
  overAppliedNumber?: number;
  minimumGap?: number;
  maximumGap?: number;
  compoundingFrequencyType?: number;
  compoundingFrequencyTypeId?: number;
  compoundingFrequencyNthDayType?: number;
  compoundingFrequencyDayOfWeekType?: number;
  compoundingFrequencyOnDay?: number;
  isArrearsBasedOnOriginalSchedule?: boolean;
  isCompoundingToBePostedAsTransaction?: boolean;
  allowCompoundingOnEod?: boolean;
  disallowInterestCalculationOnPastDue?: boolean;
  inArrearsTolerance?: number;
  paymentAllocation?: unknown[];
  creditAllocation?: unknown[];
  accountingRule?: number;
  startDate?: string;
  closeDate?: string;
  locale?: string;
  dateFormat?: string;
}

export interface Fund {
  id: number;
  name: string;
}

// ─── Loan Charges ────────────────────────────────────────────────

export interface LoanCharge {
  id: number;
  chargeId: number;
  name: string;
  chargeTimeType?: { id: number; code: string; value: string };
  chargeCalculationType?: { id: number; code: string; value: string };
  dueDate?: string | number[] | null;
  currency?: { code: string; name?: string; decimalPlaces?: number; displaySymbol?: string };
  percentage?: number;
  amountPercentageAppliedTo?: number;
  amount: number;
  amountPaid?: number;
  amountWaived?: number;
  amountWrittenOff?: number;
  amountOutstanding: number;
  amountOrPercentage?: number;
  penalty: boolean;
  paid?: boolean;
  waived?: boolean;
  chargePayable?: boolean;
}

/** GET /loans/{loanId}/charges/template */
export interface LoanChargeTemplate {
  chargeOptions?: Array<{
    id: number;
    name: string;
    active?: boolean;
    penalty?: boolean;
    currency?: { code: string; name?: string; decimalPlaces?: number; displaySymbol?: string };
    amount?: number;
    chargeTimeType?: { id: number; code: string; value: string };
    chargeCalculationType?: { id: number; code: string; value: string };
  }>;
}

export interface LoanChargeCreateRequest {
  chargeId: number;
  amount: number;
  dueDate?: string;
  dateFormat?: string;
  locale?: string;
}

export interface LoanChargeUpdateRequest {
  amount?: number;
  dueDate?: string;
  dateFormat?: string;
  locale?: string;
}

export interface LoanChargeCommandRequest {
  transactionDate?: string;
  amount?: number;
  note?: string;
  dateFormat?: string;
  locale?: string;
}

// ─── Loan Collateral ─────────────────────────────────────────────

export interface LoanCollateral {
  id: number;
  type?: { id: number; name: string; position?: number };
  collateralTypeId?: number;
  collateralTypeName?: string;
  value: number;
  description?: string;
}

/** GET /loans/template?templateType=collateral */
export interface LoanCollateralTemplate {
  loanCollateralOptions?: Array<{ id: number; name: string; position?: number }>;
}

export interface LoanCollateralCreateRequest {
  collateralTypeId: number;
  value: number;
  description?: string;
  dateFormat?: string;
  locale?: string;
}

// ─── Loan Guarantors ─────────────────────────────────────────────

export interface LoanGuarantor {
  id: number;
  loanId?: number;
  clientId?: number;
  clientName?: string;
  firstname?: string;
  lastname?: string;
  externalId?: string;
  guarantorType?: { id: number; code: string; value: string };
  guarantorTypeId?: number;
  amount: number;
  status?: boolean;
}

export interface LoanGuarantorCreateRequest {
  clientId: number;
  amount: number;
  guarantorTypeId?: number;
  dateFormat?: string;
  locale?: string;
}

// ─── Loan Delinquency ────────────────────────────────────────────

export interface LoanDelinquentData {
  delinquentDays?: number;
  delinquentAmount?: number;
  lastRepaymentDate?: string | number[];
  lastPaymentDate?: string | number[];
  /** Available disbursement amount — only present on approved multi-disbursal loans. */
  availableDisbursementAmount?: number;
  availableDisbursementAmountWithOverApplied?: number;
}

export interface LoanDelinquencyTag {
  id: number;
  loanId?: number;
  /** Backend nests the range fields under `delinquencyRange` (see fix_doc/loans-comparison.md). */
  delinquencyRange?: {
    id: number;
    classification: string;
    minimumAgeDays: number;
    maximumAgeDays: number;
  };
  addedOnDate?: string | number[];
  liftedOnDate?: string | number[] | null;
}

// ─── Loan Rescheduling ───────────────────────────────────────────

export interface LoanRescheduleRequest {
  id: number;
  loanId: number;
  clientId?: number;
  clientName?: string;
  loanAccountNo?: string;
  status: { id: number; code: string; value: string };
  rescheduleFromDate?: string | number[];
  rescheduleFromInstallment?: number;
  submittedOnDate?: string | number[];
  approvedOnDate?: string | number[] | null;
  rejectedOnDate?: string | number[] | null;
  rescheduleReasonId?: number;
  rescheduleReasonName?: string;
  rescheduleReasonCodeValue?: { id: number; name: string };
  rescheduleReasonComment?: string;
  adjustedDueDate?: string | number[] | null;
  graceOnPrincipal?: number;
  graceOnInterest?: number;
  newInterestRate?: number;
  extraTerms?: number;
  emi?: number;
  endDate?: string | number[];
  recalculateInterest?: boolean;
  timeline?: {
    submittedOnDate?: string | number[];
    submittedByUsername?: string;
    submittedByFirstname?: string;
    submittedByLastname?: string;
    approvedOnDate?: string | number[] | null;
    approvedByUsername?: string;
    approvedByFirstname?: string;
    approvedByLastname?: string;
    rejectedOnDate?: string | number[] | null;
    rejectedByUsername?: string;
    rejectedByFirstname?: string;
    rejectedByLastname?: string;
  };
  loanTermVariationsData?: Array<{
    id: number;
    termType: { id: number; code: string; value: string };
    termVariationApplicableFrom: string | number[];
    decimalValue: number;
    dateValue: string | number[] | null;
    isSpecificToInstallment: boolean;
    isProcessed: boolean;
  }>;
}

/** GET /rescheduleloans/template */
export interface RescheduleLoanTemplate {
  rescheduleReasons?: Array<{ id: number; name: string; position?: number; description?: string }>;
}

export interface RescheduleLoanCreateRequest {
  loanId: number;
  rescheduleFromDate: string;
  rescheduleReasonId: number;
  submittedOnDate: string;
  adjustedDueDate?: string;
  graceOnPrincipal?: number;
  graceOnInterest?: number;
  newInterestRate?: number;
  extraTerms?: number;
  emi?: number;
  endDate?: string;
  rescheduleReasonComment?: string;
  recalculateInterest?: boolean;
  dateFormat?: string;
  locale?: string;
}

export interface RescheduleLoanCommandRequest {
  approvedOnDate?: string;
  rejectedOnDate?: string;
  dateFormat?: string;
  locale?: string;
}

// ─── Schedule calculation (preview before submit) ────────────────

export interface CalculateLoanScheduleRequest {
  clientId?: number;
  groupId?: number;
  productId: number;
  principal: number;
  loanTermFrequency: number;
  loanTermFrequencyType: number;
  numberOfRepayments: number;
  repaymentEvery: number;
  repaymentFrequencyType: number;
  interestRatePerPeriod: number;
  interestRateFrequencyType?: number;
  amortizationType: number;
  interestType: number;
  interestCalculationPeriodType: number;
  expectedDisbursementDate: string;
  transactionProcessingStrategyCode?: string;
  loanType?: string;
  dateFormat?: string;
  locale?: string;
}
