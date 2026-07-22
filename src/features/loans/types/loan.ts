// ─── Apache Fineract Loan Types ────────────────────────────────

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

export type RepaymentFrequency = "Daily" | "Weekly" | "Every two weeks" | "Monthly" | "Every two months" | "Quarterly" | "Semi Annual" | "Annual";

export type LoanTransactionType = "disbursement" | "repayment" | "waiveInterest" | "waiveCharges" | "writeOff" | "recoveryPayment" | "accrual";

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
    loanProductId: number;
    loanProductName: string;
    loanProductDescription?: string;
    clientId: number;
    clientName?: string;
    clientOfficeId?: number;
    loanOfficerId?: number;
    loanOfficerName?: string;
    loanPurposeName?: string;
    principal: number;
    approvedPrincipal?: number;
    proposedPrincipal?: number;
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
    transactionProcessingStrategyId?: number;
    transactionProcessingStrategyName?: string;
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
    repaymentSchedule?: LoanRepaymentPeriod[];
    transactions?: LoanTransaction[];
    inArrears?: boolean;
    isNPA?: boolean;
    overdueSinceDate?: string;
    emiAmount?: number;
    fixedEmiAmount?: number;
    maxOutstandingLoanBalance?: number;
    expectedDisbursementDate?: string;
    submittedOnDate?: string;
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
    fromDate: string;
    dueDate: string;
    principalOriginalDue: number;
    principalDue: number;
    principalOutstanding: number;
    principalPaid: number;
    principalWrittenOff?: number;
    interestOriginalDue: number;
    interestDue: number;
    interestOutstanding: number;
    interestPaid: number;
    interestWrittenOff?: number;
    feeChargesDue: number;
    feeChargesOutstanding: number;
    feeChargesPaid: number;
    penaltyChargesDue: number;
    totalOriginalDueForPeriod: number;
    totalDueForPeriod: number;
    totalOutstandingForPeriod: number;
    totalPaidForPeriod?: number;
    daysInPeriod: number;
    complete?: boolean;
    obligationMetOnDate?: string;
}

export interface LoanTransaction {
    id: number;
    type: { id: number; code: string; value: string };
    date: string;
    currency: { code: string; displaySymbol: string };
    amount: number;
    principalPortion?: number;
    interestPortion?: number;
    feeChargesPortion?: number;
    penaltyChargesPortion?: number;
    outstandingLoanBalance?: number;
    submittedOnDate: string;
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
    accountNo?: string;
    loanStatus?: number;
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
    expectedDisbursementDate?: string;
    actualDisbursementDate?: string;
    transactionAmount?: number;
    paymentTypeId?: number;
    transactionDate?: string;
    rejectedOnDate?: string;
    closedOnDate?: string;
    writeoffReason?: string;
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
    numberOfRepayments: number;
    repaymentEvery: number;
    repaymentFrequencyType: number;
    interestRatePerPeriod: number;
    interestRateFrequencyType?: number;
    amortizationType: number;
    interestType: number;
    interestCalculationPeriodType: number;
    loanScheduleType?: string;
    loanScheduleProcessingType?: string;
    transactionProcessingStrategyCode?: string;
    daysInYearType?: number;
    daysInMonthType?: number;
    isInterestRecalculationEnabled?: boolean;
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
