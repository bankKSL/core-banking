// ─── Apache Fineract Savings / Deposit Types ────────────────────

export type SavingsAccountStatus =
  | "Submitted and pending approval"
  | "Approved"
  | "Active"
  | "Closed"
  | "Rejected"
  | "Withdrawn by applicant"
  | "Matured"
  | "Premature Closed";

export type DepositAccountType = "savings" | "fixed_deposit" | "recurring_deposit";

// ─── Savings Product ─────────────────────────────────────────────

export interface SavingsProduct {
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
  nominalAnnualInterestRate: number;
  minRequiredOpeningBalance: number;
  lockinPeriodFrequency?: number;
  lockinPeriodFrequencyType?: { id: number; code: string; value: string };
  withdrawalFeeForTransfers?: boolean;
  withdrawalFeeAmount?: number;
  withdrawalFeeType?: { id: number; code: string; value: string };
  feeAmount?: number;
  feeOnMonthDay?: string;
  allowOverdraft?: boolean;
  overdraftLimit?: number;
  nominalAnnualInterestRateOverdraft?: number;
  minOverdraftForInterestCalculation?: number;
  minBalanceForInterestCalculation?: number;
  minRequiredBalance?: number;
  enforceMinRequiredBalance?: boolean;
  lienAllowed?: boolean;
  maxAllowedLienLimit?: number;
  accountingType?: number;
  interestCompoundingPeriodType?: { id: number; code: string; value: string };
  interestPostingPeriodType?: { id: number; code: string; value: string };
  interestCalculationType?: { id: number; code: string; value: string };
  interestCalculationDaysInYearType?: { id: number; code: string; value: string };
  isDormancyTrackingActive?: boolean;
  daysToInactive?: number;
  daysToDormancy?: number;
  daysToEscheat?: number;
  withHoldTax?: boolean;
  taxGroupId?: number;
  charges: Array<{
    id: number;
    chargeId: number;
    name: string;
    amount: number;
    chargeTimeType: { id: number; code: string; value: string };
    chargeCalculationType: { id: number; code: string; value: string };
    isPenalty: boolean;
    isActive: boolean;
  }>;
}

// ─── Savings Account ─────────────────────────────────────────────

export interface SavingsAccount {
  id: number;
  accountNo: string;
  externalId?: string;
  clientId: number;
  clientName?: string;
  savingsProductId: number;
  savingsProductName?: string;
  productId?: number;
  status: { id: number; code: string; value: string };
  subStatus?: { id: number; code: string; value: string };
  currency: { code: string; name: string; decimalPlaces: number; displaySymbol: string };
  accountBalance: number;
  totalDeposits?: number;
  totalWithdrawals?: number;
  totalInterestEarned?: number;
  totalFeesPaid?: number;
  totalPenaltyPaid?: number;
  availableBalance?: number;
  summary?: SavingsSummary;
  nominalAnnualInterestRate: number;
  minRequiredOpeningBalance?: number;
  lockinPeriodFrequency?: number;
  lockinPeriodFrequencyType?: { id: number; code: string; value: string };
  withdrawalFee?: boolean;
  allowOverdraft?: boolean;
  overdraftLimit?: number;
  enforceMinRequiredBalance?: boolean;
  minRequiredBalance?: number;
  onHoldFunds?: number;
  lastActiveTransactionDate?: string;
  statusBlock?: unknown;
  timeline: {
    submittedOnDate?: string;
    submittedByUsername?: string;
    approvedOnDate?: string;
    approvedByUsername?: string;
    activatedOnDate?: string;
    activatedByUsername?: string;
    closedOnDate?: string;
    closedByUsername?: string;
  };
  client?: { id: number; displayName: string };
  group?: { id: number; name: string };
  fieldOfficerId?: number;
  savingsOfficerName?: string;
  transactions?: SavingsTransaction[];
  charges?: unknown[];
  datatables?: unknown[];
}

export interface SavingsSummary {
  currency: { code: string; name: string; displaySymbol: string };
  totalDeposits: number;
  totalWithdrawals: number;
  totalInterestEarned: number;
  totalFeesPaid: number;
  totalPenaltyPaid: number;
  accountBalance: number;
  availableBalance: number;
  interestPostedTillDate?: string;
  lastInterestCalculationDate?: string;
}

export interface SavingsTransaction {
  id: number;
  transactionType: {
    id: number;
    code: string;
    value: string;
    deposit?: boolean;
    dividendPayout?: boolean;
    withdrawal?: boolean;
    interestPosting?: boolean;
    feeDeduction?: boolean;
    initiateTransfer?: boolean;
    approveTransfer?: boolean;
    withdrawTransfer?: boolean;
    rejectTransfer?: boolean;
    overdraftInterest?: boolean;
    writtenoff?: boolean;
    withholdTax?: boolean;
    escheat?: boolean;
    amountHold?: boolean;
    amountRelease?: boolean;
    transactionTypeEnum?: string;
    entryType?: "DEBIT" | "CREDIT";
  };
  entryType?: "DEBIT" | "CREDIT";
  accountId: number;
  accountNo?: string;
  externalId?: string;
  date: string;
  transactionDate?: string;
  currency: { code: string; name: string; displaySymbol: string; decimalPlaces?: number };
  amount: number;
  runningBalance: number;
  reversed: boolean;
  submittedOnDate: string;
  submittedByUsername?: string;
  note?: string;
  isManualTransaction?: boolean;
  isReversal?: boolean;
  originalTransactionId?: number;
  lienTransaction?: boolean;
  releaseTransactionId?: number;
  reasonForBlock?: string;
  paymentDetailData?: unknown;
}

// ─── Savings List ────────────────────────────────────────────────

export interface SavingsAccountListResponse {
  totalFilteredRecords: number;
  pageItems: SavingsAccount[];
}

export interface SavingsAccountListParams {
  offset?: number;
  limit?: number;
  orderBy?: string;
  sortOrder?: "ASC" | "DESC";
  clientId?: number;
  accountNo?: string;
  status?: number;
}

// ─── Savings Template ────────────────────────────────────────────

export interface SavingsAccountTemplate {
  clientId?: number;
  clientName?: string;
  productOptions: Array<{ id: number; name: string }>;
  clientOptions?: Array<{ id: number; displayName: string }>;
  groupId?: number;
  productId?: number;
  currency?: { code: string; name: string; decimalPlaces: number; displaySymbol: string };
  nominalAnnualInterestRate?: number;
  minRequiredOpeningBalance?: number;
  lockinPeriodFrequency?: number;
  lockinPeriodFrequencyType?: { id: number; code: string; value: string };
  withdrawalFeeForTransfers?: boolean;
  allowOverdraft?: boolean;
  overdraftLimit?: number;
  enforceMinRequiredBalance?: boolean;
  minRequiredBalance?: number;
  fieldOfficerOptions?: Array<{ id: number; displayName: string }>;
  chargeOptions?: unknown[];
  interestCompoundingPeriodType?: { id: number; code: string; value: string };
  interestPostingPeriodType?: { id: number; code: string; value: string };
  interestCalculationType?: { id: number; code: string; value: string };
  interestCalculationDaysInYearType?: { id: number; code: string; value: string };
}

// ─── Savings Create/Command ──────────────────────────────────────

export interface SavingsAccountCreateRequest {
  clientId: number;
  productId: number;
  submittedOnDate: string;
  locale?: string;
  dateFormat?: string;
  externalId?: string;
  fieldOfficerId?: number;
  nominalAnnualInterestRate?: number;
  minRequiredOpeningBalance?: number;
  lockinPeriodFrequency?: number;
  lockinPeriodFrequencyType?: number;
  withdrawalFeeForTransfers?: boolean;
  allowOverdraft?: boolean;
  overdraftLimit?: number;
  enforceMinRequiredBalance?: boolean;
  minRequiredBalance?: number;
  charges?: Array<{ chargeId: number; amount: number }>;
  datatables?: Array<{ data: unknown; registeredTableName: string }>;
}

export interface SavingsCommandResponse {
  officeId: number;
  clientId: number;
  savingsId: number;
  resourceId?: number;
  changes?: Record<string, unknown>;
  transactionId?: string;
}

// ─── Deposit/Withdrawal ──────────────────────────────────────────

export interface SavingsTransactionRequest {
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

export interface SavingsTransactionTemplate {
  accountId: number;
  accountNo: string;
  currency: { code: string; name: string; displaySymbol: string };
  amount?: number;
  date?: string;
  paymentTypeOptions: Array<{ id: number; name: string; isCashPayment: boolean }>;
  reverseTransferPossible?: boolean;
}

// ─── Fixed Deposit ───────────────────────────────────────────────

export interface FixedDepositAccount {
  id: number;
  accountNo: string;
  externalId?: string;
  clientId: number;
  clientName?: string;
  depositProductId: number;
  depositProductName?: string;
  status: { id: number; code: string; value: string };
  currency: { code: string; name: string; displaySymbol: string };
  depositAmount: number;
  maturityAmount?: number;
  accountBalance: number;
  preClosurePenalApplicable: boolean;
  depositPeriod: number;
  depositPeriodFrequencyType: { id: number; code: string; value: string };
  interestRate: number;
  interestCompoundingPeriodType: { id: number; code: string; value: string };
  interestPostingPeriodType: { id: number; code: string; value: string };
  interestCalculationType: { id: number; code: string; value: string };
  interestCalculationDaysInYearType: { id: number; code: string; value: string };
  timeline: {
    submittedOnDate?: string;
    approvedOnDate?: string;
    activatedOnDate?: string;
    maturedOnDate?: string;
    closedOnDate?: string;
  };
  maturityDate?: string;
  onHoldFunds?: number;
  prematureClosure?: boolean;
  withHoldTax?: boolean;
  transferInterestToSavings?: boolean;
  savingsAccountId?: number;
  nominalAnnualInterestRate?: number;
}

export interface FixedDepositListParams {
  offset?: number;
  limit?: number;
  orderBy?: string;
  sortOrder?: "ASC" | "DESC";
  clientId?: number;
  status?: number;
}

export interface FixedDepositAccountCreateRequest {
  clientId: number;
  productId: number;
  submittedOnDate: string;
  depositAmount: number;
  depositPeriod: number;
  depositPeriodFrequencyId: number;
  accountNo?: string;
  externalId?: string;
  fieldOfficerId?: number;
  linkAccountId?: number;
  transferInterestToSavings?: boolean;
  maturityInstructionId?: number;
  transferToSavingsId?: number;
  nominalAnnualInterestRate?: number;
  interestCompoundingPeriodType?: number;
  interestPostingPeriodType?: number;
  interestCalculationType?: number;
  interestCalculationDaysInYearType?: number;
  minRequiredOpeningBalance?: number;
  lockinPeriodFrequency?: number;
  lockinPeriodFrequencyType?: number;
  preClosurePenalApplicable?: boolean;
  preClosurePenalInterest?: number;
  preClosurePenalInterestOnTypeId?: number;
  minDepositTerm?: number;
  minDepositTermTypeId?: number;
  maxDepositTerm?: number;
  maxDepositTermTypeId?: number;
  inMultiplesOfDepositTerm?: number;
  inMultiplesOfDepositTermTypeId?: number;
  withHoldTax?: boolean;
  charges?: Array<{ chargeId: number; amount: number }>;
  locale?: string;
  dateFormat?: string;
}

// ─── Recurring Deposit ───────────────────────────────────────────

export interface RecurringDepositAccount {
  id: number;
  accountNo: string;
  externalId?: string;
  clientId: number;
  clientName?: string;
  productId: number;
  productName?: string;
  depositProductId?: number;
  depositProductName?: string;
  status: { id: number; code: string; value: string };
  currency: { code: string; name: string; decimalPlaces: number; displaySymbol: string };
  summary?: {
    totalDeposits?: number;
    totalWithdrawals?: number;
    totalInterestEarned?: number;
    accountBalance?: number;
  };
  depositAmount: number;
  maturityAmount?: number;
  maturityDate?: string | number[];
  accountBalance: number;
  totalDeposits?: number;
  totalInterestEarned?: number;
  mandatoryRecommendedDepositAmount?: number;
  recurringDepositAmount?: number;
  recurringDepositFrequency?: number;
  recurringDepositFrequencyType?: { id: number; code: string; value: string };
  depositPeriod: number;
  depositPeriodFrequency?: { id: number; code: string; value: string };
  depositPeriodFrequencyType?: { id: number; code: string; value: string };
  interestRate?: number;
  nominalAnnualInterestRate?: number;
  interestCompoundingPeriodType?: { id: number; code: string; value: string };
  interestPostingPeriodType?: { id: number; code: string; value: string };
  interestCalculationType?: { id: number; code: string; value: string };
  interestCalculationDaysInYearType?: { id: number; code: string; value: string };
  expectedFirstDepositOnDate?: string | number[];
  expectedMaturityDate?: string;
  recurringFrequency?: number;
  recurringFrequencyType?: { id: number; code: string; value: string };
  submittedOnDate?: string | number[];
  approvedOnDate?: string | number[];
  activatedOnDate?: string | number[];
  timeline: {
    submittedOnDate?: string;
    approvedOnDate?: string;
    activatedOnDate?: string;
    closedOnDate?: string;
  };
  prematureClosure?: boolean;
  preClosurePenalApplicable?: boolean;
  preClosurePenalInterest?: number;
  preClosurePenalInterestOnType?: { id: number; code: string; value: string };
  withHoldTax?: boolean;
  taxGroup?: { id: number; name: string } | null;
  taxGroupId?: number;
  client?: { id: number; displayName: string };
  group?: { id: number; name: string };
  fieldOfficerId?: number;
  savingsOfficerName?: string;
  lockinPeriodFrequency?: number;
  lockinPeriodFrequencyType?: { id: number; code: string; value: string };
  isCalendarInherited?: boolean;
  isMandatoryDeposit?: boolean;
  allowWithdrawal?: boolean;
  adjustAdvanceTowardsFuturePayments?: boolean;
  transferInterestToSavings?: boolean;
  linkAccountId?: number;
  maturityInstructionId?: number;
  transferToSavingsId?: number;
  transactions?: unknown[];
  charges?: unknown[];
  activeChart?: unknown;
  depositProduct?: { shortName?: string };
}

export interface RecurringDepositListParams {
  offset?: number;
  limit?: number;
  orderBy?: string;
  sortOrder?: "ASC" | "DESC";
  clientId?: number;
  status?: number;
}

// ─── Recurring Deposit Product ────────────────────────────────────

export interface RecurringDepositProduct {
  id: number;
  name: string;
  shortName?: string;
  description?: string;
  currency: { code: string; name: string; decimalPlaces: number; displaySymbol: string; inMultiplesOf?: number };
  minDepositAmount?: number;
  depositAmount: number;
  maxDepositAmount?: number;
  interestCompoundingPeriodType: { id: number; code: string; description?: string; value?: string };
  interestPostingPeriodType: { id: number; code: string; description?: string; value?: string };
  interestCalculationType: { id: number; code: string; description?: string; value?: string };
  interestCalculationDaysInYearType: { id: number; code: string; description?: string; value?: string };
  isMandatoryDeposit?: boolean;
  adjustAdvanceTowardsFuturePayments?: boolean;
  allowWithdrawal?: boolean;
  lockinPeriodFrequency?: number;
  lockinPeriodFrequencyType?: { id: number; code: string; description?: string; value?: string };
  minDepositTerm: number;
  minDepositTermType?: { id: number; code: string; description?: string };
  minDepositTermTypeId?: { id: number; code: string; description?: string };
  inMultiplesOfDepositTerm?: number;
  inMultiplesOfDepositTermType?: { id: number; code: string; description?: string };
  inMultiplesOfDepositTermTypeId?: { id: number; code: string; description?: string };
  maxDepositTerm?: number;
  maxDepositTermType?: { id: number; code: string; description?: string };
  maxDepositTermTypeId?: { id: number; code: string; description?: string };
  preClosurePenalApplicable: boolean;
  preClosurePenalInterest?: number;
  preClosurePenalInterestOnType?: { id: number; code: string; description?: string; value?: string };
  withHoldTax?: boolean;
  taxGroup?: { id: number; name: string } | null;
  taxGroupId?: number;
  activeChart?: {
    id: number;
    name?: string;
    fromDate: string | number[];
    endDate?: string | number[] | null;
    isPrimaryGroupingByAmount?: boolean;
    chartSlabs: Array<{
      id: number;
      description: string;
      periodType: { id: number; code: string; description?: string; value?: string };
      fromPeriod: number;
      toPeriod?: number | null;
      amountRangeFrom?: number | null;
      amountRangeTo?: number | null;
      annualInterestRate: number;
      incentives?: unknown[];
    }>;
  };
  charges?: Array<{ id: number; name?: string }>;
  accountingRule?: { id: number; code?: string; description?: string; value?: string };
  accountingMappings?: {
    savingsReferenceAccount?: { id: number; name: string; glCode?: string };
    savingsControlAccount?: { id: number; name: string; glCode?: string };
    transfersInSuspenseAccount?: { id: number; name: string; glCode?: string };
    interestOnSavingsAccount?: { id: number; name: string; glCode?: string };
    incomeFromFeeAccount?: { id: number; name: string; glCode?: string };
    incomeFromPenaltyAccount?: { id: number; name: string; glCode?: string };
    feesReceivableAccount?: { id: number; name: string; glCode?: string };
    penaltiesReceivableAccount?: { id: number; name: string; glCode?: string };
    interestPayableAccount?: { id: number; name: string; glCode?: string };
  };
  paymentChannelToFundSourceMappings?: unknown[];
  feeToIncomeAccountMappings?: unknown[];
  penaltyToIncomeAccountMappings?: unknown[];
  recurringFrequency?: number;
  recurringFrequencyType?: { id: number; code: string; description?: string; value?: string };
}

export interface RecurringDepositProductCreateRequest {
  name: string;
  shortName: string;
  description?: string;
  currencyCode: string;
  digitsAfterDecimal: number;
  inMultiplesOf?: number;
  locale: string;
  dateFormat?: string;
  nominalAnnualInterestRate?: number;
  interestCompoundingPeriodType: number;
  interestPostingPeriodType: number;
  interestCalculationType: number;
  interestCalculationDaysInYearType: number;
  accountingRule: number;
  minDepositTerm: number;
  minDepositTermTypeId: number;
  depositAmount: number;
  minDepositAmount?: number;
  maxDepositAmount?: number;
  recurringFrequency: number;
  recurringFrequencyType: number;
  lockinPeriodFrequency?: number;
  lockinPeriodFrequencyType?: number;
  maxDepositTerm?: number;
  maxDepositTermTypeId?: number;
  inMultiplesOfDepositTerm?: number;
  inMultiplesOfDepositTermTypeId?: number;
  preClosurePenalApplicable?: boolean;
  preClosurePenalInterest?: number;
  preClosurePenalInterestOnTypeId?: number;
  isMandatoryDeposit?: boolean;
  allowWithdrawal?: boolean;
  adjustAdvanceTowardsFuturePayments?: boolean;
  withHoldTax?: boolean;
  taxGroupId?: number;
  charts?: Array<{
    name?: string;
    description?: string;
    fromDate?: string;
    endDate?: string;
    isPrimaryGroupingByAmount?: boolean;
    locale?: string;
    dateFormat?: string;
    chartSlabs: Array<{
      periodType: number;
      fromPeriod: number;
      toPeriod?: number | null;
      amountRangeFrom?: number | null;
      amountRangeTo?: number | null;
      annualInterestRate: number;
      description?: string;
      incentives?: unknown[];
    }>;
  }>;
  charges?: Array<{ id: number }>;
  savingsReferenceAccountId?: number;
  savingsControlAccountId?: number;
  transfersInSuspenseAccountId?: number;
  interestOnSavingsAccountId?: number;
  incomeFromFeeAccountId?: number;
  incomeFromPenaltyAccountId?: number;
  feesReceivableAccountId?: number;
  penaltiesReceivableAccountId?: number;
  interestPayableAccountId?: number;
  paymentChannelToFundSourceMappings?: Array<{ paymentTypeId: number; fundSourceAccountId: number }>;
  feeToIncomeAccountMappings?: Array<{ chargeId: number; incomeAccountId: number }>;
  penaltyToIncomeAccountMappings?: Array<{ chargeId: number; incomeAccountId: number }>;
}

// ─── Recurring Deposit Account Create ────────────────────────────

export interface RecurringDepositAccountCreateRequest {
  clientId?: number;
  groupId?: number;
  productId: number;
  submittedOnDate: string;
  mandatoryRecommendedDepositAmount: number;
  depositPeriod: number;
  depositPeriodFrequencyId: number;
  isCalendarInherited?: boolean;
  expectedFirstDepositOnDate?: string;
  recurringFrequency?: number;
  recurringFrequencyType?: number;
  accountNo?: string;
  externalId?: string;
  fieldOfficerId?: number;
  nominalAnnualInterestRate?: number;
  interestCompoundingPeriodType?: number;
  interestPostingPeriodType?: number;
  interestCalculationType?: number;
  interestCalculationDaysInYearType?: number;
  lockinPeriodFrequency?: number;
  lockinPeriodFrequencyType?: number;
  isMandatoryDeposit?: boolean;
  allowWithdrawal?: boolean;
  adjustAdvanceTowardsFuturePayments?: boolean;
  transferInterestToSavings?: boolean;
  linkAccountId?: number;
  maturityInstructionId?: number;
  transferToSavingsId?: number;
  preClosurePenalApplicable?: boolean;
  preClosurePenalInterest?: number;
  preClosurePenalInterestOnTypeId?: number;
  minDepositTerm?: number;
  minDepositTermTypeId?: number;
  maxDepositTerm?: number;
  maxDepositTermTypeId?: number;
  inMultiplesOfDepositTerm?: number;
  inMultiplesOfDepositTermTypeId?: number;
  withHoldTax?: boolean;
  charges?: Array<{
    chargeId: number;
    amount: number;
    dueDate?: string;
    feeOnMonthDay?: string;
    feeInterval?: number;
  }>;
  monthDayFormat?: string;
  locale?: string;
  dateFormat?: string;
}

// ─── Savings Product Create ──────────────────────────────────────

export interface SavingsProductCreateRequest {
  name: string;
  shortName: string;
  description?: string;
  currencyCode: string;
  digitsAfterDecimal: number;
  inMultiplesOf?: number;
  locale: string;
  dateFormat?: string;
  nominalAnnualInterestRate: number;
  interestCompoundingPeriodType: number;
  interestPostingPeriodType: number;
  interestCalculationType: number;
  interestCalculationDaysInYearType: number;
  minRequiredOpeningBalance?: number;
  lockinPeriodFrequency?: number;
  lockinPeriodFrequencyType?: number;
  withdrawalFeeAmount?: number;
  withdrawalFeeType?: number;
  withdrawalFeeForTransfers?: boolean;
  feeAmount?: number;
  feeOnMonthDay?: string;
  allowOverdraft?: boolean;
  overdraftLimit?: number;
  nominalAnnualInterestRateOverdraft?: number;
  minOverdraftForInterestCalculation?: number;
  minBalanceForInterestCalculation?: number;
  minRequiredBalance?: number;
  enforceMinRequiredBalance?: boolean;
  lienAllowed?: boolean;
  maxAllowedLienLimit?: number;
  accountingRule: number;
  charges?: number[];
  isDormancyTrackingActive?: boolean;
  daysToInactive?: number;
  daysToDormancy?: number;
  daysToEscheat?: number;
  withHoldTax?: boolean;
  taxGroupId?: number;
  accountMappingForPayment?: string;
  monthDayFormat?: string;
}

// ─── Fixed Deposit Product (Section 11) ───────────────────────

export interface FixedDepositProduct {
  id: number;
  name: string;
  shortName?: string;
  description?: string;
  currency: { code: string; name: string; decimalPlaces: number; displaySymbol: string; inMultiplesOf?: number };
  minDepositTerm: number;
  maxDepositTerm?: number;
  minDepositTermType: { id: number; code: string; description: string };
  maxDepositTermType?: { id: number; code: string; description: string };
  preClosurePenalApplicable: boolean;
  preClosurePenalInterest?: number;
  preClosurePenalInterestOnType?: { id: number; code: string; description: string };
  interestCompoundingPeriodType: { id: number; code: string; description: string };
  interestPostingPeriodType: { id: number; code: string; description: string };
  interestCalculationType: { id: number; code: string; description: string };
  interestCalculationDaysInYearType: { id: number; code: string; description: string };
  accountingRule: { id: number; code: string; description: string };
  activeChart?: {
    id: number;
    fromDate: string;
    endDate?: string;
    chartSlabs: Array<{
      id: number;
      description: string;
      periodType: { id: number; code: string; description: string };
      fromPeriod: number;
      toPeriod: number;
      annualInterestRate: number;
    }>;
  };
  withHoldTax?: boolean;
  taxGroupId?: number;
}

export interface FixedDepositProductCreateRequest {
  name: string;
  shortName: string;
  description?: string;
  currencyCode: string;
  digitsAfterDecimal: number;
  inMultiplesOf?: number;
  locale: string;
  dateFormat?: string;
  nominalAnnualInterestRate?: number;
  interestCompoundingPeriodType: number;
  interestPostingPeriodType: number;
  interestCalculationType: number;
  interestCalculationDaysInYearType: number;
  accountingRule: number;
  minDepositTerm: number;
  minDepositTermTypeId: number;
  depositAmount: number;
  lockinPeriodFrequency?: number;
  lockinPeriodFrequencyType?: number;
  maxDepositTerm?: number;
  maxDepositTermTypeId?: number;
  inMultiplesOfDepositTerm?: number;
  inMultiplesOfDepositTermTypeId?: number;
  preClosurePenalApplicable?: boolean;
  preClosurePenalInterest?: number;
  preClosurePenalInterestOnTypeId?: number;
  minDepositAmount?: number;
  maxDepositAmount?: number;
  withHoldTax?: boolean;
  taxGroupId?: number;
  charts?: Array<{
    fromDate?: string;
    endDate?: string;
    locale?: string;
    dateFormat?: string;
    chartSlabs: Array<{
      periodType: number;
      fromPeriod: number;
      annualInterestRate: number;
    }>;
  }>;
}
