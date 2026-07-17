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
        code: string; name: string; decimalPlaces: number;
        inMultiplesOf?: number; displaySymbol: string;
    };
    nominalAnnualInterestRate: number;
    minRequiredOpeningBalance: number;
    lockinPeriodFrequency?: number;
    lockinPeriodFrequencyType?: { id: number; code: string; value: string };
    withdrawalFeeForTransfers?: boolean;
    allowOverdraft?: boolean;
    overdraftLimit?: number;
    minBalanceForInterestCalculation?: number;
    minRequiredBalance?: number;
    enforceMinRequiredBalance?: boolean;
    accountingType?: number;
    isDormancyTrackingActive?: boolean;
    daysToInactive?: number;
    daysToDormancy?: number;
    daysToEscheat?: number;
    charges: Array<{
        id: number; chargeId: number; name: string;
        amount: number;
        chargeTimeType: { id: number; code: string; value: string };
        chargeCalculationType: { id: number; code: string; value: string };
        isPenalty: boolean; isActive: boolean;
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
        submittedOnDate?: string; submittedByUsername?: string;
        approvedOnDate?: string; approvedByUsername?: string;
        activatedOnDate?: string; activatedByUsername?: string;
        closedOnDate?: string; closedByUsername?: string;
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
    transactionType: { id: number; code: string; value: string };
    accountId: number;
    accountNo: string;
    date: string;
    currency: { code: string; name: string; displaySymbol: string };
    amount: number;
    runningBalance: number;
    reversed: boolean;
    submittedOnDate: string;
    isManualTransaction?: boolean;
}

// ─── Savings List ────────────────────────────────────────────────

export interface SavingsAccountListResponse {
    totalFilteredRecords: number;
    pageItems: SavingsAccount[];
}

export interface SavingsAccountListParams {
    offset?: number; limit?: number;
    orderBy?: string; sortOrder?: "ASC" | "DESC";
    clientId?: number; accountNo?: string;
    status?: number;
}

// ─── Savings Template ────────────────────────────────────────────

export interface SavingsAccountTemplate {
    clientId?: number; clientName?: string;
    productOptions: Array<{ id: number; name: string }>;
    clientOptions?: Array<{ id: number; displayName: string }>;
    groupId?: number;
    productId?: number;
    currency: { code: string; name: string; decimalPlaces: number; displaySymbol: string };
    nominalAnnualInterestRate: number;
    minRequiredOpeningBalance: number;
    lockinPeriodFrequency: number;
    lockinPeriodFrequencyType: { id: number; code: string; value: string };
    withdrawalFeeForTransfers: boolean;
    allowOverdraft: boolean;
    overdraftLimit: number;
    enforceMinRequiredBalance: boolean;
    minRequiredBalance: number;
    fieldOfficerOptions?: Array<{ id: number; displayName: string }>;
    chargeOptions?: unknown[];
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
        submittedOnDate?: string; approvedOnDate?: string;
        activatedOnDate?: string; maturedOnDate?: string;
        closedOnDate?: string;
    };
    maturityDate?: string;
    onHoldFunds?: number;
    prematureClosure?: boolean;
    withHoldTax?: boolean;
    transferInterestToSavings?: boolean;
    savingsAccountId?: number;
}

export interface FixedDepositListParams {
    offset?: number; limit?: number;
    orderBy?: string; sortOrder?: "ASC" | "DESC";
    clientId?: number; status?: number;
}

// ─── Recurring Deposit ───────────────────────────────────────────

export interface RecurringDepositAccount {
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
    recurringDepositAmount: number;
    recurringDepositFrequency: number;
    recurringDepositFrequencyType: { id: number; code: string; value: string };
    depositPeriod: number;
    depositPeriodFrequencyType: { id: number; code: string; value: string };
    interestRate: number;
    totalDeposits?: number;
    expectedFirstDepositOnDate?: string;
    expectedMaturityDate?: string;
    timeline: {
        submittedOnDate?: string; approvedOnDate?: string;
        activatedOnDate?: string;
    };
    prematureClosure?: boolean;
}

// ─── Savings Product Create ──────────────────────────────────────

export interface SavingsProductCreateRequest {
    name: string;
    shortName?: string;
    description?: string;
    currencyCode: string;
    digitsAfterDecimal?: number;
    inMultiplesOf?: number;
    nominalAnnualInterestRate: number;
    minRequiredOpeningBalance?: number;
    lockinPeriodFrequency?: number;
    lockinPeriodFrequencyType?: number;
    withdrawalFeeForTransfers?: boolean;
    allowOverdraft?: boolean;
    overdraftLimit?: number;
    minRequiredBalance?: number;
    enforceMinRequiredBalance?: boolean;
    accountingRule?: number;
    locale?: string;
    dateFormat?: string;
    charges?: Array<{ chargeId: number }>;
    isDormancyTrackingActive?: boolean;
    daysToInactive?: number;
    daysToDormancy?: number;
    daysToEscheat?: number;
}
