// ─── Apache Fineract Accounting Types ────────────────────────────

// ============================================================
// Shared Types
// ============================================================

export interface EnumOptionData {
  id: number;
  code: string;
  value: string;
}

export interface CodeValueData {
  id: number;
  name: string;
  description?: string;
  position?: number;
}

export interface OfficeData {
  id: number;
  name: string;
  nameDecorated: string;
  externalId: string;
  openingDate: string;
  hierarchy: string;
  parentId: number;
}

export interface CurrencyData {
  code: string;
  name: string;
  decimalPlaces: number;
  displaySymbol: string;
  nameCode: string;
  displayLabel: string;
}

export interface TransactionDetailData {
  paymentTypeId: number;
  paymentTypeName: string;
  accountNumber: string;
  checkNumber: string;
  routingCode: string;
  receiptNumber: string;
  bankNumber: string;
}

export interface CommandProcessingResult {
  resourceId: number | string;
  changes?: Record<string, unknown>;
  resourceIdentifier?: string;
}

export interface Page<T> {
  totalFilteredRecords: number;
  pageItems: T[];
}

// ============================================================
// GL Account
// ============================================================

export interface GLAccountData {
  id: number;
  name: string;
  parentId: number | null;
  glCode: string;
  disabled: boolean;
  manualEntriesAllowed: boolean;
  type: EnumOptionData;
  usage: EnumOptionData;
  description: string | null;
  nameDecorated: string;
  tagId: CodeValueData | null;
  organizationRunningBalance: number | null;

  // template fields (present only in template response)
  accountTypeOptions?: EnumOptionData[];
  usageOptions?: EnumOptionData[];
  assetHeaderAccountOptions?: GLAccountData[];
  liabilityHeaderAccountOptions?: GLAccountData[];
  equityHeaderAccountOptions?: GLAccountData[];
  incomeHeaderAccountOptions?: GLAccountData[];
  expenseHeaderAccountOptions?: GLAccountData[];
  allowedAssetsTagOptions?: CodeValueData[];
  allowedLiabilitiesTagOptions?: CodeValueData[];
  allowedEquityTagOptions?: CodeValueData[];
  allowedIncomeTagOptions?: CodeValueData[];
  allowedExpensesTagOptions?: CodeValueData[];
}

export interface CreateGLAccountRequest {
  name: string;
  glCode: string;
  type: number; // 1-5
  usage: number; // 1=Detail, 2=Header
  manualEntriesAllowed: boolean;
  parentId?: number;
  tagId?: number;
  description?: string;
}

export interface UpdateGLAccountRequest {
  name?: string;
  glCode?: string;
  type?: number;
  usage?: number;
  manualEntriesAllowed?: boolean;
  parentId?: number;
  tagId?: number;
  description?: string;
  disabled?: boolean;
}

export interface GLAccountListParams {
  type?: number;
  searchParam?: string;
  usage?: number;
  manualEntriesAllowed?: boolean;
  disabled?: boolean;
  fetchRunningBalance?: boolean;
}

// ============================================================
// Journal Entry
// ============================================================

export interface JournalEntryData {
  id: number;
  officeId: number;
  officeName: string;
  glAccountName: string;
  glAccountId: number;
  glAccountCode: string;
  glAccountType: EnumOptionData;
  transactionDate: string;
  entryType: EnumOptionData; // DEBIT or CREDIT
  amount: number;
  currency: CurrencyData;
  transactionId: string;
  manualEntry: boolean;
  entityType: EnumOptionData | null;
  entityId: number | null;
  createdByUserId: number;
  createdDate: string;
  createdByUserName: string;
  comments: string | null;
  reversed: boolean;
  referenceNumber: string | null;
  officeRunningBalance: number | null;
  organizationRunningBalance: number | null;
  runningBalanceComputed: boolean;
  transactionDetails: TransactionDetailData | null;
  submittedOnDate: string;
}

export interface CreditDebit {
  glAccountId: number;
  amount: number;
}

export interface CreateJournalEntryRequest {
  officeId: number;
  transactionDate: string;
  currencyCode: string;
  dateFormat: string;
  locale: string;
  credits: CreditDebit[];
  debits: CreditDebit[];
  comments?: string;
  referenceNumber?: string;
  accountingRuleId?: number;
  paymentTypeId?: number;
  accountNumber?: string;
  checkNumber?: string;
  routingCode?: string;
  receiptNumber?: string;
  bankNumber?: string;
  externalAssetOwner?: string;
}

export interface JournalEntryListParams {
  officeId?: number;
  glAccountId?: number;
  manualEntriesOnly?: boolean;
  fromDate?: string;
  toDate?: string;
  transactionId?: string;
  loanId?: number;
  savingsId?: number;
  runningBalance?: boolean;
  transactionDetails?: boolean;
  offset?: number;
  limit?: number;
  orderBy?: string;
  sortOrder?: "ASC" | "DESC";
  dateFormat?: string;
  locale?: string;
}

// ============================================================
// Accounting Rule
// ============================================================

export interface AccountingTagRuleData {
  tag: CodeValueData;
}

export interface GLAccountDataForLookup {
  id: number;
  name: string;
  glCode: string;
}

export interface AccountingRuleData {
  id: number;
  officeId: number;
  officeName: string;
  name: string;
  description: string;
  systemDefined: boolean;
  allowMultipleDebitEntries: boolean;
  allowMultipleCreditEntries: boolean;
  creditTags: AccountingTagRuleData[];
  debitTags: AccountingTagRuleData[];

  // template fields
  allowedOffices?: OfficeData[];
  allowedAccounts?: GLAccountData[];
  allowedCreditTagOptions?: CodeValueData[];
  allowedDebitTagOptions?: CodeValueData[];
  creditAccounts?: GLAccountDataForLookup[];
  debitAccounts?: GLAccountDataForLookup[];
}

export interface CreateAccountingRuleRequest {
  name: string;
  officeId: number;
  description?: string;
  accountToDebit?: number;
  accountToCredit?: number;
  creditTags?: { tagId: number }[];
  debitTags?: { tagId: number }[];
  allowMultipleCreditEntries?: boolean;
  allowMultipleDebitEntries?: boolean;
}

// ============================================================
// Financial Activity Account Mapping
// ============================================================

export interface FinancialActivityData {
  id: number;
  name: string;
  code: string;
}

export interface FinancialActivityAccountData {
  id: number;
  financialActivityId: number;
  financialActivityData: FinancialActivityData;
  glAccountId: number;
  glAccountData: GLAccountData;

  // template fields
  financialActivityOptions?: FinancialActivityData[];
  glAccountOptions?: GLAccountData[];
}

export interface CreateFinancialActivityMappingRequest {
  financialActivityId: number;
  glAccountId: number;
}

// ============================================================
// Accounting Closure (GL Closure)
// ============================================================

export interface GLClosureData {
  id: number;
  officeId: number;
  officeName: string;
  closingDate: string;
  deleted: boolean;
  createdDate: string;
  lastUpdatedDate: string;
  createdByUserId: number;
  createdByUsername: string;
  lastUpdatedByUserId: number;
  lastUpdatedByUsername: string;
  comments: string;
  allowedOffices?: OfficeData[];
}

export interface CreateGLClosureRequest {
  officeId: number;
  closingDate: string;
  dateFormat: string;
  locale: string;
  comments?: string;
}

// ============================================================
// Periodic Accrual
// ============================================================

export interface ExecutePeriodicAccrualRequest {
  tillDate: string;
  dateFormat: string;
  locale: string;
}

// ============================================================
// Provisioning Entry
// ============================================================

export interface ProvisioningEntryData {
  id: number;
  createdBy: string;
  createdDate: string;
  date: string;
  journalEntriesCreated: boolean;
}

export interface CreateProvisioningEntryRequest {
  date: string;
  dateFormat: string;
  locale: string;
  createjournalentries?: boolean;
}
