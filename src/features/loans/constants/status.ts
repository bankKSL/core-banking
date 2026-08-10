import i18n from "@/i18n";

export const LOAN_STATUS_LABELS: Record<string, string> = {
  "Submitted and pending approval": i18n.t("Pending"),
  Approved: i18n.t("Approved"),
  Active: i18n.t("Active"),
  Disbursed: i18n.t("Disbursed"),
  "Closed (obligations met)": i18n.t("Closed"),
  "Closed (written off)": i18n.t("Written Off"),
  "Closed (rescheduled)": i18n.t("Rescheduled"),
  Closed: i18n.t("Closed"),
  Overpaid: i18n.t("Overpaid"),
  Rejected: i18n.t("Rejected"),
  Withdrawn: i18n.t("Withdrawn"),
};

export const LOAN_STATUS_CONFIG: Record<
  string,
  {
    variant: "success" | "warning" | "error" | "info" | "default";
    label: string;
  }
> = {
  "Submitted and pending approval": { variant: "info", label: i18n.t("Pending") },
  Approved: { variant: "success", label: i18n.t("Approved") },
  Active: { variant: "success", label: i18n.t("Active") },
  Disbursed: { variant: "info", label: i18n.t("Disbursed") },
  "Closed (obligations met)": { variant: "default", label: i18n.t("Closed") },
  "Closed (written off)": { variant: "error", label: i18n.t("Written Off") },
  "Closed (rescheduled)": { variant: "warning", label: i18n.t("Rescheduled") },
  Closed: { variant: "default", label: i18n.t("Closed") },
  Overpaid: { variant: "warning", label: i18n.t("Overpaid") },
  Rejected: { variant: "error", label: i18n.t("Rejected") },
  Withdrawn: { variant: "warning", label: i18n.t("Withdrawn") },
};

/** Fineract numeric loan status to string mapping (doc §17.1) */
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

/** Map raw Fineract status codes to config keys used by LOAN_STATUS_CONFIG */
export const LOAN_CODE_TO_KEY: Record<string, string> = {
  "loanStatusType.submitted.and.pending.approval": "Submitted and pending approval",
  "loanStatusType.approved": "Approved",
  "loanStatusType.active": "Active",
  "loanStatusType.disbursed": "Disbursed",
  "loanStatusType.closed.obligations.met": "Closed (obligations met)",
  "loanStatusType.closed.written.off": "Closed (written off)",
  "loanStatusType.closed.reschedule.outstanding.amount": "Closed (rescheduled)",
  "loanStatusType.closed": "Closed",
  "loanStatusType.overpaid": "Overpaid",
  "loanStatusType.rejected": "Rejected",
  "loanStatusType.withdrawn.by.client": "Withdrawn",
  "loanStatusType.withdrawn": "Withdrawn",
  "loanStatusType.transfer.in.progress": "Transfer in progress",
  "loanStatusType.transfer.on.hold": "Transfer on hold",
  "loanStatusType.invalid": "Invalid",
};

/** Default sort applied to every list query (doc §11 / §27 #1) */
export const LOAN_DEFAULT_ORDER_BY = "l.id";
export const LOAN_DEFAULT_SORT_ORDER: "ASC" | "DESC" = "DESC";

/** Sortable columns exposed in the UI sort selector (doc §11) */
export const LOAN_SORT_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "l.id", label: i18n.t("Loan ID") },
  { value: "l.account_no", label: i18n.t("Account Number") },
  { value: "l.loan_status_id", label: i18n.t("Status") },
  { value: "l.principal", label: i18n.t("Principal") },
  { value: "l.total_outstanding_derived", label: i18n.t("Outstanding") },
  { value: "l.submittedon_date", label: i18n.t("Submitted On") },
];

export const LOANS_PAGE_SIZE = 20;
/** Page-size options exposed in the loan list pagination control (doc §27). */
export const LOAN_PAGE_SIZE_OPTIONS = [20, 50, 100];
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
  if (s.code && s.code in LOAN_CODE_TO_KEY) return LOAN_CODE_TO_KEY[s.code];
  if (s.code) return s.code;
  if (s.value && s.value in STATUS_NAME_TO_ID) return s.value;
  if (s.id != null && s.id in LOAN_STATUS_ID_MAP) return LOAN_STATUS_ID_MAP[s.id];
  return "Unknown";
}

/** Interest type labels for display */
export const INTEREST_TYPE_LABELS: Record<string, string> = {
  Flat: i18n.t("Flat"),
  "Declining Balance": i18n.t("Declining Balance"),
};

/** Amortization type labels for display */
export const AMORTIZATION_TYPE_LABELS: Record<string, string> = {
  "Equal installments": i18n.t("Equal Installments (EMI)"),
  "Equal principal payments": i18n.t("Equal Principal"),
};

export const REPAYMENT_FREQ_LABELS: Record<string, string> = {
  Daily: i18n.t("Daily"),
  Weekly: i18n.t("Weekly"),
  "Every two weeks": i18n.t("Bi-Weekly"),
  Monthly: i18n.t("Monthly"),
  "Every two months": i18n.t("Bi-Monthly"),
  Quarterly: i18n.t("Quarterly"),
  "Semi Annual": i18n.t("Semi-Annual"),
  Annual: i18n.t("Annual"),
};
