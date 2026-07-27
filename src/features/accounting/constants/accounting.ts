// ─── Accounting Constants ────────────────────────────────────────

export const GL_ACCOUNT_TYPE = {
  ASSET: 1,
  LIABILITY: 2,
  EQUITY: 3,
  INCOME: 4,
  EXPENSE: 5,
} as const;

export const GL_ACCOUNT_TYPE_LABELS: Record<number, string> = {
  1: "Asset",
  2: "Liability",
  3: "Equity",
  4: "Income",
  5: "Expense",
};

export const GL_ACCOUNT_USAGE = {
  DETAIL: 1,
  HEADER: 2,
} as const;

export const GL_ACCOUNT_USAGE_LABELS: Record<number, string> = {
  1: "Detail",
  2: "Header",
};

export const ACCOUNTING_RULE_TYPE = {
  NONE: 1,
  CASH_BASED: 2,
  ACCRUAL_PERIODIC: 3,
  ACCRUAL_UPFRONT: 4,
} as const;

export const ACCOUNTING_RULE_TYPE_LABELS: Record<number, string> = {
  1: "No Accounting",
  2: "Cash Based",
  3: "Periodic Accrual",
  4: "Upfront Accrual",
};

export const ACCOUNTING_PAGE_SIZE = 20;
