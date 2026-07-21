// ─── Campaign ────────────────────────────────────────────────
export type CampaignStatus = "active" | "inactive" | "scheduled" | "expired" | "draft";
export type CampaignPriority = 1 | 2 | 3 | 4 | 5;

export interface Campaign {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  products: string[];
  priority: CampaignPriority;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  eligibilityRules: EligibilityRule[];
  formula: string;
  actions: CampaignAction[];
}

// ─── Category ────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  type: "interest" | "fee" | "cashback" | "reward" | "penalty" | "loan" | "deposit";
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Product ─────────────────────────────────────────────────
export type ProductType = "savings_account" | "current_account" | "fixed_deposit" | "loan" | "credit_card" | "wallet";

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Eligibility Rules ──────────────────────────────────────
export type LogicalOperator = "AND" | "OR";
export type ComparisonOperator = "==" | "!=" | ">" | ">=" | "<" | "<=" | "contains" | "not_contains" | "in" | "not_in";

export interface EligibilityRule {
  id: string;
  field: string;
  operator: ComparisonOperator;
  value: string;
  logicalOperator?: LogicalOperator;
}

export interface RuleGroup {
  id: string;
  logicalOperator: LogicalOperator;
  rules: EligibilityRule[];
  groups: RuleGroup[];
  isNegated?: boolean;
}

// ─── Formula ─────────────────────────────────────────────────
export type FormulaNodeType = "variable" | "operator" | "function" | "number" | "string";

export interface FormulaNode {
  id: string;
  type: FormulaNodeType;
  value: string;
  children?: FormulaNode[];
  left?: FormulaNode;
  right?: FormulaNode;
}

export interface FormulaVariable {
  key: string;
  label: string;
  description: string;
}

export type FormulaFunction = "MIN" | "MAX" | "ROUND" | "IF" | "ABS" | "SUM" | "AVG";

// ─── Actions ─────────────────────────────────────────────────
export type ActionType = "set_interest_rate" | "apply_cashback" | "waive_fee" | "add_reward_points" | "apply_penalty" | "adjust_limit";

export interface CampaignAction {
  id: string;
  type: ActionType;
  target: string;
  value: string;
  description: string;
}

// ─── Execution Log ───────────────────────────────────────────
export type ExecutionStatus = "success" | "failed" | "skipped";

export interface ExecutionLog {
  id: string;
  executionId: string;
  campaignId: string;
  campaignName: string;
  matched: boolean;
  duration: number; // ms
  status: ExecutionStatus;
  request: string;
  response: string;
  timestamp: string;
}

// ─── Audit Log ───────────────────────────────────────────────
export type AuditAction = "create" | "update" | "delete" | "activate" | "deactivate" | "publish" | "approve";

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
  ipAddress: string;
}

// ─── Simulation ──────────────────────────────────────────────
export interface SimulationInput {
  balance: number;
  amount: number;
  interestRate: number;
  tenor: number;
  transactionCount: number;
  accountAge: number;
  customerScore: number;
  currency: string;
  customerType: string;
  channel: string;
  [key: string]: string | number;
}

export interface SimulationResult {
  campaignId: string;
  campaignName: string;
  matched: boolean;
  formulaResult: number;
  actions: CampaignAction[];
  steps: SimulationStep[];
  duration: number;
}

export interface SimulationStep {
  step: number;
  expression: string;
  result: number;
}

// ─── Dashboard Stats ─────────────────────────────────────────
export interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  scheduledCampaigns: number;
  expiredCampaigns: number;
}

// ═══════════════════════════════════════════════════════════════
// ─── CORE LENDING ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════

// ─── Loan Product ────────────────────────────────────────────
export type LoanProductType = "personal_loan" | "mortgage" | "auto_loan" | "business_loan" | "education_loan" | "home_equity";
export type InterestType = "fixed" | "floating" | "reducing_balance" | "flat";
export type AmortizationType = "equal_installment" | "equal_principal" | "bullet" | "custom";
export type InterestFrequency = "monthly" | "quarterly" | "annually" | "daily";

export interface LoanProduct {
  id: string;
  name: string;
  type: LoanProductType;
  description: string;
  minAmount: number;
  maxAmount: number;
  minTenure: number; // months
  maxTenure: number; // months
  interestType: InterestType;
  baseInterestRate: number; // percentage
  floatingMargin?: number; // for floating rate loans
  processingFeePercent: number;
  latePaymentPenaltyPercent: number;
  prepaymentPenaltyPercent: number;
  isActive: boolean;
  requiresCollateral: boolean;
  minCreditScore: number;
  maxLTVRatio?: number; // Loan to Value ratio
  gracePeriodDays: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Loan Application ────────────────────────────────────────
export type LoanStatus =
  "draft" | "pending" | "under_review" | "approved" | "rejected" | "disbursed" | "active" | "closed" | "defaulted" | "restructured";

export interface LoanApplication {
  id: string;
  applicationId: string;
  customerName: string;
  customerId: string;
  customerType: "individual" | "business";
  productId: string;
  productName: string;
  productType: LoanProductType;
  amount: number;
  tenure: number; // months
  interestRate: number;
  interestType: InterestType;
  amortizationType: AmortizationType;
  status: LoanStatus;
  purpose: string;
  creditScore: number;
  monthlyIncome: number;
  existingDebtObligation: number;
  collateralId?: string;
  collateralValue?: number;
  appliedDate: string;
  reviewedDate?: string;
  approvedDate?: string;
  disbursedDate?: string;
  closedDate?: string;
  assignedTo: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Repayment Schedule ──────────────────────────────────────
export type InstallmentStatus = "pending" | "paid" | "overdue" | "partial" | "waived";

export interface RepaymentSchedule {
  id: string;
  loanApplicationId: string;
  installmentNo: number;
  dueDate: string;
  openingBalance: number;
  emi: number;
  principalComponent: number;
  interestComponent: number;
  closingBalance: number;
  status: InstallmentStatus;
  paidDate?: string;
  paidAmount?: number;
  lateFee?: number;
  prepaymentAmount?: number;
}

// ─── Collateral ──────────────────────────────────────────────
export type CollateralType = "property" | "vehicle" | "fixed_deposit" | "gold" | "securities" | "guarantee" | "equipment";
export type CollateralStatus = "pledged" | "released" | "foreclosed" | "under_valuation";

export interface Collateral {
  id: string;
  collateralId: string;
  type: CollateralType;
  description: string;
  estimatedValue: number;
  forcedSaleValue: number;
  currency: string;
  ownerName: string;
  ownerId: string;
  status: CollateralStatus;
  valuationDate: string;
  expiryDate?: string;
  insuranceProvider?: string;
  insuranceExpiry?: string;
  pledgedLoanId?: string;
  valuationReportRef?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Loan Disbursement ───────────────────────────────────────
export type DisbursementMethod = "bank_transfer" | "cheque" | "direct_credit" | "escrow";

export interface LoanDisbursement {
  id: string;
  loanApplicationId: string;
  amount: number;
  method: DisbursementMethod;
  bankAccount: string;
  bankName: string;
  referenceNo: string;
  status: "pending" | "processed" | "failed";
  processedDate?: string;
  processedBy?: string;
  remarks: string;
  createdAt: string;
}

// ─── Lending Dashboard Stats ─────────────────────────────────
export interface LendingStats {
  totalApplications: number;
  pendingReview: number;
  approved: number;
  activeLoans: number;
  disbursedAmount: number;
  defaultedLoans: number;
  totalReceivables: number;
  recoveryRate: number;
  nplRatio: number;
}

// ═══════════════════════════════════════════════════════════════
// ─── DEPOSITS & WITHDRAWALS ───────────────────────────────────
// ═══════════════════════════════════════════════════════════════

// ─── Deposit Account ─────────────────────────────────────────
export type DepositAccountType = "savings" | "current" | "fixed_deposit" | "recurring_deposit";
export type DepositAccountStatus = "active" | "dormant" | "frozen" | "closed";

export interface DepositAccount {
  id: string;
  accountNumber: string;
  customerName: string;
  customerId: string;
  type: DepositAccountType;
  status: DepositAccountStatus;
  balance: number;
  currency: string;
  interestRate: number; // annual %
  branchName: string;
  branchCode: string;
  openedDate: string;
  closedDate?: string;
  lastTransactionDate?: string;
  nomineeName?: string;
  accountOfficer: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Deposit Transaction ─────────────────────────────────────
export type TransactionType =
  | "cash_deposit"
  | "cash_withdrawal"
  | "cheque_deposit"
  | "cheque_withdrawal"
  | "transfer_in"
  | "transfer_out"
  | "interest_credit"
  | "fee_debit"
  | "atm_withdrawal"
  | "pos_payment"
  | "standing_order";

export type TransactionStatus = "completed" | "pending" | "reversed" | "failed";

export interface DepositTransaction {
  id: string;
  transactionId: string;
  accountId: string;
  accountNumber: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  description: string;
  referenceNo: string;
  channel: "branch" | "atm" | "online" | "mobile" | "pos";
  initiatedBy: string;
  approvedBy?: string;
  transactionDate: string;
  valueDate: string;
  createdAt: string;
}

// ─── Fixed Deposit ───────────────────────────────────────────
export type FixedDepositStatus = "active" | "matured" | "premature_withdrawn" | "renewed";

export interface FixedDeposit {
  id: string;
  fdNumber: string;
  customerName: string;
  customerId: string;
  accountId: string;
  accountNumber: string;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  startDate: string;
  maturityDate: string;
  maturityAmount: number;
  status: FixedDepositStatus;
  autoRenew: boolean;
  prematurePenaltyPercent: number;
  nomineeName?: string;
  interestPayoutFrequency: "monthly" | "quarterly" | "maturity";
  branchName: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Recurring Deposit ───────────────────────────────────────
export type RecurringDepositStatus = "active" | "matured" | "premature_closed" | "defaulted";

export interface RecurringDeposit {
  id: string;
  rdNumber: string;
  customerName: string;
  customerId: string;
  accountId: string;
  accountNumber: string;
  monthlyInstallment: number;
  interestRate: number;
  tenureMonths: number;
  installmentsPaid: number;
  totalInstallments: number;
  startDate: string;
  maturityDate: string;
  maturityAmount: number;
  status: RecurringDepositStatus;
  missedInstallments: number;
  penaltyAmount: number;
  branchName: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Withdrawal Limits ───────────────────────────────────────
export interface WithdrawalLimit {
  accountType: DepositAccountType;
  dailyLimit: number;
  perTransactionLimit: number;
  dailyCountLimit: number;
  monthlyLimit: number;
  atmDailyLimit: number;
  atmPerTransactionLimit: number;
  chequePerDayLimit: number;
}

// ─── Deposit Dashboard Stats ─────────────────────────────────
export interface DepositStats {
  totalAccounts: number;
  activeAccounts: number;
  totalBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  fixedDepositsActive: number;
  fixedDepositsValue: number;
  recurringDepositsActive: number;
}
// ─── Exchange Rate ───────────────────────────────────────────
export interface ExchangeRate {
  id: string;
  currencyCode: string;
  currencyName: string;
  country: string;
  symbol: string;
  buyRate: number;
  sellRate: number;
  midRate: number;
  spreadPercent: number;
  lastUpdated: string;
  source: "central_bank" | "commercial_bank" | "market" | "manual";
  isActive: boolean;
}

// ─── Organization: Office ─────────────────────────────────────
export interface Office {
  id: number;
  name: string;
  nameDecorated: string;
  externalId: string;
  openingDate: string; // ISO date
  hierarchy: string; // e.g. ".1.2."
  parentId: number | null;
  parentName: string | null;
}

export interface OfficeCreateRequest {
  name: string;
  parentId?: number;
  openingDate: string;
  externalId?: string;
  dateFormat?: string;
  locale?: string;
}

export interface OfficeUpdateRequest {
  name?: string;
  parentId?: number;
  openingDate?: string;
  externalId?: string;
  dateFormat?: string;
  locale?: string;
}
