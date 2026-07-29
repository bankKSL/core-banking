// ─── Apache Finfact Loan Types ────────────────────────────────

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

// ─── Loan Product ────────────────────────────────────────────────

export interface LoanProduct {
  id: number;
  name: string;
  shortName?: string;
  description?: string;
  fundId?: number;
  fundName?: string;
  includeInBorrowerCycle?: boolean;
  startDate?: string;
  closeDate?: string;
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
  repaymentFrequencyType: { id: number; code: string; value: string };
  interestRatePerPeriod: number;
  minInterestRatePerPeriod: number;
  maxInterestRatePerPeriod: number;
  interestRateFrequencyType?: { id: number; code: string; value: string };
  annualInterestRate: number;
  isLinkedToFloatingInterestRates?: boolean;
  isFloatingInterestRateCalculationAllowed?: boolean;
  allowVariableInstallments?: boolean;
  amortizationType: { id: number; code: string; value: string };
  interestType: { id: number; code: string; value: string };
  interestCalculationPeriodType: { id: number; code: string; value: string };
  allowPartialPeriodInterestCalcualtion?: boolean;
  transactionProcessingStrategyId?: number;
  transactionProcessingStrategyName?: string;
  daysInMonthType?: { id: number; code: string; value: string };
  daysInYearType?: { id: number; code: string; value: string };
  isInterestRecalculationEnabled?: boolean;
  charges: Array<{
    id: number;
    chargeId: number;
    name: string;
    chargeTimeType: { id: number; code: string; value: string };
    chargeCalculationType: { id: number; code: string; value: string };
    amount: number;
    chargePaymentMode: { id: number; code: string; value: string };
    isPenalty: boolean;
    isActive: boolean;
  }>;
  accountingMappings?: unknown;
}

// ─── Loan ────────────────────────────────────────────────────────

export interface Loan {
  id: number;
  accountNo?: string;
  externalId?: string;
  status: { id: number; code: string; value: string };
  subStatus?: { id: number; code: string; value: string };
  loanProductId: number;
  loanProductName: string;
  loanProductDescription?: string;
  clientId: number;
  clientName?: string;
  clientOfficeId?: number;
  group?: { id: number; name: string } | null;
  loanType?: { id: number; code: string; value: string };
  loanOfficerId?: number;
  loanOfficerName?: string;
  loanPurposeId?: number;
  loanPurposeName?: string;
  fundId?: number;
  fundName?: string;
  principal: number;
  approvedPrincipal?: number;
  proposedPrincipal?: number;
  netDisbursalAmount?: number;
  termFrequency: number;
  termPeriodFrequencyType: { id: number; code: string; value: string };
  numberOfRepayments: number;
  repaymentEvery: number;
  repaymentFrequencyType: { id: number; code: string; value: string };
  interestRatePerPeriod: number;
  interestRateFrequencyType?: { id: number; code: string; value: string };
  annualInterestRate: number;
  isFloatingInterestRate?: boolean;
  amortizationType: { id: number; code: string; value: string };
  interestType: { id: number; code: string; value: string };
  interestCalculationPeriodType: { id: number; code: string; value: string };
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
  delinquent?: LoanDelinquentData;
  delinquencyRange?: { id: number; classification: string; minimumAgeDays: number; maximumAgeDays: number };
  inArrears?: boolean;
  isNPA?: boolean;
  fraud?: boolean;
  chargedOff?: boolean;
  overdueSinceDate?: string;
  emiAmount?: number;
  fixedEmiAmount?: number;
  maxOutstandingLoanBalance?: number;
  expectedDisbursementDate?: string;
  submittedOnDate?: string;
  expectedFirstRepaymentOnDate?: string;
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
  submittedOnDate?: string;
  submittedByUsername?: string;
  expectedDisbursementDate?: string;
  expectedMaturityDate?: string;
  actualDisbursementDate?: string;
  approvedOnDate?: string;
  approvedByUsername?: string;
  rejectedOnDate?: string;
  rejectedByUsername?: string;
  closedOnDate?: string;
  closedByUsername?: string;
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
  totalFilteredRecords: number;
  pageItems: Loan[];
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
  status?: string;
  loanStatus?: number;
  searchByParam?: string;
}

// ─── Loan Template ───────────────────────────────────────────────

export interface LoanTemplate {
  clientId?: number;
  clientName?: string;
  clientOfficeId?: number;
  loanProductId?: number;
  loanProductOptions: Array<{ id: number; name: string }>;
  currency: { code: string; name: string; decimalPlaces: number; displaySymbol: string };
  principal: number;
  termFrequency: number;
  termPeriodFrequencyType: { id: number; code: string; value: string };
  numberOfRepayments: number;
  repaymentEvery: number;
  repaymentFrequencyType: { id: number; code: string; value: string };
  interestRatePerPeriod: number;
  interestRateFrequencyType: { id: number; code: string; value: string };
  annualInterestRate: number;
  amortizationType: { id: number; code: string; value: string };
  interestType: { id: number; code: string; value: string };
  interestCalculationPeriodType: { id: number; code: string; value: string };
  transactionProcessingStrategyId?: number;
  transactionProcessingStrategyName?: string;
  isFloatingInterestRate?: boolean;
  daysInMonthType: { id: number; code: string; value: string };
  daysInYearType: { id: number; code: string; value: string };
  amortizationTypeOptions: Array<{ id: number; code: string; value: string }>;
  interestTypeOptions: Array<{ id: number; code: string; value: string }>;
  interestCalculationPeriodTypeOptions: Array<{ id: number; code: string; value: string }>;
  repaymentPeriodFrequencyTypeOptions: Array<{ id: number; code: string; value: string }>;
  termFrequencyTypeOptions: Array<{ id: number; code: string; value: string }>;
  isLoanProductLinkedToFloatingRate?: boolean;
  fundOptions?: Array<{ id: number; name: string }>;
  chargeOptions?: unknown[];
  multiDisburseLoan?: boolean;
  canDefineInstallmentAmount?: boolean;
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
  loanPurposeName?: string;
  loanOfficerId?: number;
  fundId?: number;
  linkAccountId?: number;
  externalId?: string;
  allowPartialPeriodInterestCalcualtion?: boolean;
  maxOutstandingLoanBalance?: number;
  charges?: Array<{ chargeId: number; amount: number; dueDate?: string }>;
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
  enableDownPayment?: boolean;
  disbursedAmountPercentageDownPayment?: number;
  enableAutoRepaymentForDownPayment?: boolean;
  repaymentStartDateType?: number;
  enableBuyDownFee?: boolean;
  merchantBuyDownFee?: boolean;
  buyDownFeeCalculationType?: number;
  buyDownFeeStrategy?: number;
  buyDownFeeIncomeType?: number;
  enableIncomeCapitalization?: boolean;
  capitalizedIncomeCalculationType?: number;
  capitalizedIncomeStrategy?: number;
  capitalizedIncomeType?: number;
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
}

export interface LoanDelinquencyTag {
  id: number;
  tagId?: number;
  classification?: string;
  minimumAgeDays?: number;
  maximumAgeDays?: number;
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
  adjustedDueDate?: string | number[] | null;
  graceOnPrincipal?: number;
  graceOnInterest?: number;
  newInterestRate?: number;
  extraTerms?: number;
  recalculateInterest?: boolean;
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
