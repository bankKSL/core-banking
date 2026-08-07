// ─── Accounting Feature ─────────────────────────────────────────

export type {
  EnumOptionData,
  CodeValueData,
  OfficeData,
  CurrencyData,
  TransactionDetailData,
  CommandProcessingResult,
  Page,
  GLAccountData,
  CreateGLAccountRequest,
  UpdateGLAccountRequest,
  GLAccountListParams,
  JournalEntryData,
  CreditDebit,
  CreateJournalEntryRequest,
  JournalEntryListParams,
  AccountingTagRuleData,
  GLAccountDataForLookup,
  AccountingRuleData,
  CreateAccountingRuleRequest,
  FinancialActivityData,
  FinancialActivityAccountData,
  CreateFinancialActivityMappingRequest,
  GLClosureData,
  CreateGLClosureRequest,
  ExecutePeriodicAccrualRequest,
  ProvisioningEntryData,
  CreateProvisioningEntryRequest,
} from "./types/accounting";

export {
  GL_ACCOUNT_TYPE,
  GL_ACCOUNT_TYPE_LABELS,
  GL_ACCOUNT_USAGE,
  GL_ACCOUNT_USAGE_LABELS,
  ACCOUNTING_RULE_TYPE,
  ACCOUNTING_RULE_TYPE_LABELS,
  ACCOUNTING_PAGE_SIZE,
} from "./constants/accounting";

export {
  createGLAccountSchema,
  updateGLAccountSchema,
  createJournalEntrySchema,
  createAccountingRuleSchema,
  createFinancialActivityMappingSchema,
  createGLClosureSchema,
  executePeriodicAccrualSchema,
  createProvisioningEntrySchema,
} from "./schemas/accounting.schema";
export type {
  CreateGLAccountFormValues,
  CreateJournalEntryFormValues,
  CreateAccountingRuleFormValues,
  CreateFinancialActivityMappingFormValues,
  CreateGLClosureFormValues,
  ExecutePeriodicAccrualFormValues,
  CreateProvisioningEntryFormValues,
} from "./schemas/accounting.schema";

// API — GL Accounts
export {
  fetchGLAccounts,
  fetchGLAccount,
  fetchGLAccountTemplate,
  createGLAccount,
  updateGLAccount,
  deleteGLAccount,
} from "./api/accounting";

// API — Journal Entries
export { fetchJournalEntries, fetchJournalEntry, createJournalEntry, reverseJournalEntry } from "./api/accounting";

// API — Accounting Rules
export {
  fetchAccountingRules,
  fetchAccountingRule,
  fetchAccountingRuleTemplate,
  createAccountingRule,
  updateAccountingRule,
  deleteAccountingRule,
} from "./api/accounting";

// API — Financial Activity Mappings
export {
  fetchFinancialActivityAccounts,
  fetchFinancialActivityAccount,
  fetchFinancialActivityAccountTemplate,
  createFinancialActivityMapping,
  updateFinancialActivityMapping,
  deleteFinancialActivityMapping,
} from "./api/accounting";

// API — GL Closures
export { fetchGLClosures, fetchGLClosure, createGLClosure, updateGLClosure, deleteGLClosure } from "./api/accounting";

// API — Periodic Accrual
export { executePeriodicAccrual } from "./api/accounting";

// API — Provisioning Entries
export {
  fetchProvisioningEntries,
  fetchProvisioningEntry,
  createProvisioningEntry,
  provisioningEntryCommand,
} from "./api/accounting";

// Hooks — GL Accounts
export {
  glAccountKeys,
  useGLAccounts,
  useGLAccount,
  useGLAccountTemplate,
  useCreateGLAccount,
  useUpdateGLAccount,
  useDeleteGLAccount,
} from "./hooks/useGLAccounts";

// Hooks — Journal Entries
export {
  journalEntryKeys,
  useJournalEntries,
  useJournalEntry,
  useCreateJournalEntry,
  useReverseJournalEntry,
} from "./hooks/useJournalEntries";

// Hooks — Accounting Rules
export {
  accountingRuleKeys,
  useAccountingRules,
  useAccountingRule,
  useAccountingRuleTemplate,
  useCreateAccountingRule,
  useUpdateAccountingRule,
  useDeleteAccountingRule,
} from "./hooks/useAccountingRules";

// Hooks — Financial Activity Mappings
export {
  financialActivityAccountKeys,
  useFinancialActivityAccounts,
  useFinancialActivityAccountTemplate,
  useCreateFinancialActivityMapping,
  useUpdateFinancialActivityMapping,
  useDeleteFinancialActivityMapping,
} from "./hooks/useFinancialActivityAccounts";

// Hooks — GL Closures
export {
  glClosureKeys,
  useGLClosures,
  useGLClosure,
  useCreateGLClosure,
  useUpdateGLClosure,
  useDeleteGLClosure,
} from "./hooks/useGLClosures";

// Hooks — Periodic Accrual
export { useExecutePeriodicAccrual } from "./hooks/usePeriodicAccrual";

// Hooks — Provisioning Entries
export {
  provisioningEntryKeys,
  useProvisioningEntries,
  useProvisioningEntry,
  useCreateProvisioningEntry,
  useProvisioningEntryCommand,
} from "./hooks/useProvisioningEntries";

// ─── Pages ───────────────────────────────────────────────
export { default as AccountingClosuresPage } from "./pages/AccountingClosuresPage";
export { default as AccountingRuleFormPage } from "./pages/AccountingRuleFormPage";
export { default as AccountingRulesPage } from "./pages/AccountingRulesPage";
export { default as FinancialActivityMappingsPage } from "./pages/FinancialActivityMappingsPage";
export { default as GLAccountFormPage } from "./pages/GLAccountFormPage";
export { default as GLAccountsPage } from "./pages/GLAccountsPage";
export { default as JournalEntriesPage } from "./pages/JournalEntriesPage";
export { default as JournalEntryFormPage } from "./pages/JournalEntryFormPage";
export { default as PeriodicAccrualPage } from "./pages/PeriodicAccrualPage";
export { default as ProvisioningEntriesPage } from "./pages/ProvisioningEntriesPage";
