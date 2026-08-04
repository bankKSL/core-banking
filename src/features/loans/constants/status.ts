export const LOAN_STATUS_LABELS: Record<string, string> = {
  "Submitted and pending approval": "Pending",
  Approved: "Approved",
  Active: "Active",
  Disbursed: "Disbursed",
  "Closed (obligations met)": "Closed",
  "Closed (written off)": "Written Off",
  "Closed (rescheduled)": "Rescheduled",
  Closed: "Closed",
  Overpaid: "Overpaid",
  Rejected: "Rejected",
};

export const LOAN_STATUS_CONFIG: Record<
  string,
  {
    variant: "success" | "warning" | "error" | "info" | "default";
    label: string;
  }
> = {
  "Submitted and pending approval": { variant: "info", label: "Pending" },
  Approved: { variant: "success", label: "Approved" },
  Active: { variant: "success", label: "Active" },
  Disbursed: { variant: "info", label: "Disbursed" },
  "Closed (obligations met)": { variant: "default", label: "Closed" },
  "Closed (written off)": { variant: "error", label: "Written Off" },
  "Closed (rescheduled)": { variant: "warning", label: "Rescheduled" },
  Closed: { variant: "default", label: "Closed" },
  Overpaid: { variant: "warning", label: "Overpaid" },
  Rejected: { variant: "error", label: "Rejected" },
};

/** Finfact numeric loan status to string mapping (doc §17.1) */
export const LOAN_STATUS_ID_MAP: Record<number, string> = {
  100: "Submitted and pending approval",
  200: "Approved",
  300: "Active",
  303: "Transfer in progress",
  304: "Transfer on hold",
  400: "Withdrawn",
  500: "Rejected",
  600: "Closed (obligations met)",
  601: "Closed (written off)",
  602: "Closed (rescheduled)",
  700: "Overpaid",
  0: "Invalid",
};

/** Reverse map: i18n status string → numeric id (for status filter) */
export const STATUS_NAME_TO_ID: Record<string, number> = Object.entries(LOAN_STATUS_ID_MAP).reduce(
  (acc, [id, name]) => {
    acc[name] = Number(id);
    return acc;
  },
  {} as Record<string, number>,
);

/** Default sort applied to every list query (doc §11 / §27 #1) */
export const LOAN_DEFAULT_ORDER_BY = "l.id";
export const LOAN_DEFAULT_SORT_ORDER: "ASC" | "DESC" = "DESC";

/** Sortable columns exposed in the UI sort selector (doc §11) */
export const LOAN_SORT_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "l.id", label: "Loan ID" },
  { value: "l.account_no", label: "Account Number" },
  { value: "l.loan_status_id", label: "Status" },
  { value: "l.principal", label: "Principal" },
  { value: "l.total_outstanding_derived", label: "Outstanding" },
  { value: "l.submittedon_date", label: "Submitted On" },
];

export const LOANS_PAGE_SIZE = 15;
export const LOAN_SEARCH_DEBOUNCE_MS = 400;

/**
 * Resolve a `Loan.status` payload to the canonical i18n string used by
 * `LOAN_STATUS_CONFIG` / `STATUS_NAME_TO_ID`. Accepts both the raw
 * `{id, code, value}` payload from Fineract and the numeric-only form.
 */
export function resolveStatusCode(loan: {
  status?: { id?: number; code?: string; value?: string };
}): string {
  const s = loan.status;
  if (!s) return "Unknown";
  if (s.code) return s.code;
  if (s.value && s.value in STATUS_NAME_TO_ID) return s.value;
  if (s.id != null && s.id in LOAN_STATUS_ID_MAP) return LOAN_STATUS_ID_MAP[s.id];
  return "Unknown";
}

/** Interest type labels for display */
export const INTEREST_TYPE_LABELS: Record<string, string> = {
  Flat: "Flat Rate",
  "Declining Balance": "Reducing Balance",
};

/** Amortization type labels for display */
export const AMORTIZATION_TYPE_LABELS: Record<string, string> = {
  "Equal installments": "Equal Installments (EMI)",
  "Equal principal payments": "Equal Principal",
};

export const REPAYMENT_FREQ_LABELS: Record<string, string> = {
  Daily: "Daily",
  Weekly: "Weekly",
  "Every two weeks": "Bi-Weekly",
  Monthly: "Monthly",
  "Every two months": "Bi-Monthly",
  Quarterly: "Quarterly",
  "Semi Annual": "Semi-Annual",
  Annual: "Annual",
};
