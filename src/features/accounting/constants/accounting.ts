import i18n from "@/i18n";

// ─── Accounting Constants ────────────────────────────────────────

export const GL_ACCOUNT_TYPE = {
  ASSET: 1,
  LIABILITY: 2,
  EQUITY: 3,
  INCOME: 4,
  EXPENSE: 5,
} as const;

export const GL_ACCOUNT_TYPE_LABELS: Record<number, string> = {
  1: i18n.t("Asset"),
  2: i18n.t("Liability"),
  3: i18n.t("Equity"),
  4: i18n.t("Income"),
  5: i18n.t("Expense"),
};

export const GL_ACCOUNT_USAGE = {
  DETAIL: 1,
  HEADER: 2,
} as const;

export const GL_ACCOUNT_USAGE_LABELS: Record<number, string> = {
  1: i18n.t("Detail"),
  2: i18n.t("Header"),
};

export const ACCOUNTING_RULE_TYPE = {
  NONE: 1,
  CASH_BASED: 2,
  ACCRUAL_PERIODIC: 3,
  ACCRUAL_UPFRONT: 4,
} as const;

export const ACCOUNTING_RULE_TYPE_LABELS: Record<number, string> = {
  1: i18n.t("No Accounting"),
  2: i18n.t("Cash Based"),
  3: i18n.t("Periodic Accrual"),
  4: i18n.t("Upfront Accrual"),
};

// ─── Journal Entry ────────────────────────────────────────────────

export const JOURNAL_ENTRY_TYPE = {
  CREDIT: 1,
  DEBIT: 2,
} as const;

export const JOURNAL_ENTRY_TYPE_LABELS: Record<number, string> = {
  1: i18n.t("Credit"),
  2: i18n.t("Debit"),
};

export const JOURNAL_ENTRY_ENTITY_TYPE = {
  LOAN: 1,
  SAVINGS: 2,
  CLIENT: 3,
  SHARE: 4,
  PROVISIONING: 5,
} as const;

export const JOURNAL_ENTRY_ENTITY_TYPE_LABELS: Record<number, string> = {
  1: i18n.t("Loan"),
  2: i18n.t("Savings"),
  3: i18n.t("Client"),
  4: i18n.t("Share"),
  5: i18n.t("Provisioning"),
};

export const ACCOUNTING_PAGE_SIZE = 20;
